/**
 * Service centralisé de traitement des paiements
 *
 * ✅ SOTA 2026: Single source of truth pour tous les paiements
 * Gère: Stripe, SEPA, espèces, chèques, virements
 */

import { getServiceClient } from "@/lib/supabase/service-client";
import { z } from "zod";

// Types de paiement supportés
export const PAYMENT_METHODS = [
  "stripe",
  "sepa",
  "virement",
  "cheque",
  "especes",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Statuts de paiement
export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
  "cancelled",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Schémas de validation
export const manualPaymentSchema = z.object({
  invoice_id: z.string().uuid("ID facture invalide"),
  amount: z.number().positive("Le montant doit être positif"),
  method: z.enum(["virement", "cheque", "especes"], {
    errorMap: () => ({ message: "Méthode invalide" }),
  }),
  reference: z.string().optional(),
  received_date: z.string().optional(),
  notes: z.string().optional(),
});

export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>;

// Interfaces
export interface PaymentResult {
  success: boolean;
  payment_id?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface InvoicePaymentStatus {
  invoice_id: string;
  invoice_total: number;
  total_paid: number;
  remaining: number;
  is_fully_paid: boolean;
  payments: PaymentSummary[];
}

export interface PaymentSummary {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  reference?: string;
  confirmed_manually: boolean;
}

/**
 * Calcule le total payé pour une facture
 */
export async function getInvoicePaymentTotal(
  invoiceId: string
): Promise<{ totalPaid: number; payments: PaymentSummary[] }> {
  const serviceClient = getServiceClient();

  const { data: payments } = await serviceClient
    .from("payments")
    .select("id, montant, moyen, statut, date_paiement, provider_ref, metadata")
    .eq("invoice_id", invoiceId)
    .eq("statut", "succeeded");

  if (!payments || payments.length === 0) {
    return { totalPaid: 0, payments: [] };
  }

  const totalPaid = payments.reduce(
    (sum, p) => sum + Number(p.montant),
    0
  );

  const paymentSummaries: PaymentSummary[] = payments.map((p) => ({
    id: p.id,
    amount: Number(p.montant),
    method: p.moyen as PaymentMethod,
    status: p.statut as PaymentStatus,
    date: p.date_paiement,
    reference: p.provider_ref || undefined,
    confirmed_manually: p.metadata?.confirmed_manually || false,
  }));

  return { totalPaid, payments: paymentSummaries };
}

/**
 * Récupère le statut de paiement complet d'une facture
 */
export async function getInvoicePaymentStatus(
  invoiceId: string
): Promise<InvoicePaymentStatus | null> {
  const serviceClient = getServiceClient();

  const { data: invoice } = await serviceClient
    .from("invoices")
    .select("id, montant_total")
    .eq("id", invoiceId)
    .single();

  if (!invoice) return null;

  const { totalPaid, payments } = await getInvoicePaymentTotal(invoiceId);

  return {
    invoice_id: invoice.id,
    invoice_total: invoice.montant_total,
    total_paid: totalPaid,
    remaining: Math.max(0, invoice.montant_total - totalPaid),
    is_fully_paid: totalPaid >= invoice.montant_total,
    payments,
  };
}

/**
 * Enregistre un paiement manuel (espèces, chèque, virement)
 */
export async function recordManualPayment(
  input: ManualPaymentInput,
  confirmedBy: {
    userId: string;
    profileId: string;
  }
): Promise<PaymentResult> {
  const serviceClient = getServiceClient();

  try {
    // Valider les données
    const validated = manualPaymentSchema.parse(input);

    // Vérifier que la facture existe
    const { data: invoice } = await serviceClient
      .from("invoices")
      .select("id, montant_total, statut")
      .eq("id", validated.invoice_id)
      .single();

    if (!invoice) {
      return { success: false, error: "Facture non trouvée" };
    }

    if (invoice.statut === "paid") {
      return { success: false, error: "Cette facture est déjà payée" };
    }

    // Calculer le total après ce paiement
    const { totalPaid } = await getInvoicePaymentTotal(validated.invoice_id);
    const newTotal = totalPaid + validated.amount;

    // Créer le paiement
    const paymentData = {
      invoice_id: validated.invoice_id,
      montant: validated.amount,
      moyen: validated.method,
      statut: "succeeded" as const,
      date_paiement: validated.received_date || new Date().toISOString(),
      provider_ref: validated.reference || null,
      metadata: {
        confirmed_manually: true,
        confirmed_by: confirmedBy.profileId,
        confirmed_at: new Date().toISOString(),
        notes: validated.notes || null,
        reference: validated.reference || null,
      },
    };

    const { data: payment, error: paymentError } = await serviceClient
      .from("payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error("[PaymentProcessor] Erreur création paiement:", paymentError);
      return { success: false, error: "Erreur lors de l'enregistrement" };
    }

    // Mettre à jour le statut de la facture
    const newInvoiceStatus = newTotal >= invoice.montant_total ? "paid" : "sent";

    await serviceClient
      .from("invoices")
      .update({
        statut: newInvoiceStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.invoice_id);

    // Audit log
    await serviceClient.from("audit_log").insert({
      user_id: confirmedBy.userId,
      action: "manual_payment_recorded",
      entity_type: "payment",
      entity_id: payment.id,
      metadata: {
        invoice_id: validated.invoice_id,
        amount: validated.amount,
        method: validated.method,
        total_paid: newTotal,
        invoice_total: invoice.montant_total,
        invoice_status: newInvoiceStatus,
      },
    });

    // Événement si facture payée
    if (newInvoiceStatus === "paid") {
      await serviceClient.from("outbox").insert({
        event_type: "Invoice.Paid",
        payload: {
          invoice_id: validated.invoice_id,
          paid_amount: newTotal,
          payment_method: validated.method,
          confirmed_manually: true,
        },
      });
    }

    return {
      success: true,
      payment_id: payment.id,
      details: {
        amount: validated.amount,
        method: validated.method,
        total_paid: newTotal,
        invoice_total: invoice.montant_total,
        invoice_status: newInvoiceStatus,
        is_fully_paid: newTotal >= invoice.montant_total,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Données invalides",
        details: { errors: error.errors },
      };
    }
    console.error("[PaymentProcessor] Erreur:", error);
    return { success: false, error: "Erreur serveur" };
  }
}

/**
 * Vérifie si un locataire a un moyen de paiement configuré
 */
export async function checkTenantPaymentMethod(
  tenantProfileId: string
): Promise<{
  hasPaymentMethod: boolean;
  methods: PaymentMethod[];
  details: Record<string, unknown>;
}> {
  const serviceClient = getServiceClient();

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("stripe_customer_id, sepa_mandate_id")
    .eq("id", tenantProfileId)
    .single();

  if (!profile) {
    return { hasPaymentMethod: false, methods: [], details: {} };
  }

  const methods: PaymentMethod[] = [];
  const details: Record<string, unknown> = {};

  if (profile.stripe_customer_id) {
    methods.push("stripe");
    details.stripe_customer_id = profile.stripe_customer_id;
  }

  if (profile.sepa_mandate_id) {
    methods.push("sepa");
    details.sepa_mandate_id = profile.sepa_mandate_id;
  }

  // Les méthodes manuelles sont toujours disponibles
  methods.push("virement", "cheque", "especes");

  return {
    hasPaymentMethod: methods.includes("stripe") || methods.includes("sepa"),
    methods,
    details,
  };
}

/**
 * Vérifie si un bail peut être activé (paiement configuré)
 */
export async function canActivateLease(
  leaseId: string
): Promise<{
  canActivate: boolean;
  reason?: string;
  missingRequirements?: string[];
}> {
  const serviceClient = getServiceClient();

  // Récupérer le bail avec ses signataires
  const { data: lease } = await serviceClient
    .from("leases")
    .select(`
      id,
      statut,
      signers:lease_signers(profile_id, role, signature_status)
    `)
    .eq("id", leaseId)
    .single();

  if (!lease) {
    return { canActivate: false, reason: "Bail non trouvé" };
  }

  const missing: string[] = [];

  // Vérifier les signatures
  const signers = (lease as any).signers || [];
  const allSigned = signers.every(
    (s: any) => s.signature_status === "signed"
  );

  if (!allSigned) {
    missing.push("Toutes les signatures requises");
  }

  // Vérifier le paiement pour chaque locataire
  const tenantSigners = signers.filter((s: any) =>
    ["locataire_principal", "locataire", "tenant", "colocataire"].includes(s.role)
  );

  for (const tenant of tenantSigners) {
    if (tenant.profile_id) {
      const { hasPaymentMethod } = await checkTenantPaymentMethod(
        tenant.profile_id
      );
      if (!hasPaymentMethod) {
        missing.push(`Moyen de paiement pour le locataire ${tenant.profile_id}`);
      }
    }
  }

  if (missing.length > 0) {
    return {
      canActivate: false,
      reason: "Prérequis manquants",
      missingRequirements: missing,
    };
  }

  return { canActivate: true };
}

export default {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  manualPaymentSchema,
  getInvoicePaymentTotal,
  getInvoicePaymentStatus,
  recordManualPayment,
  checkTenantPaymentMethod,
  canActivateLease,
};
