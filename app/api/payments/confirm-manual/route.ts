export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/confirm-manual
 *
 * Confirme manuellement un paiement reçu par virement, chèque ou espèces.
 * Utilisé par le propriétaire pour marquer un paiement comme reçu.
 *
 * ✅ SOTA 2026: Audit trail complet pour conformité légale
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service-client";
import { z } from "zod";

const confirmManualPaymentSchema = z.object({
  invoice_id: z.string().uuid("ID facture invalide"),
  amount: z.number().positive("Le montant doit être positif"),
  method: z.enum(["virement", "cheque", "especes"], {
    errorMap: () => ({ message: "Méthode invalide (virement, cheque, especes)" })
  }),
  reference: z.string().optional(), // Numéro de chèque, référence virement
  received_date: z.string().optional(), // Date de réception si différente d'aujourd'hui
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const serviceClient = getServiceClient();

    // Récupérer le profil
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "owner") {
      return NextResponse.json({
        error: "Seul le propriétaire peut confirmer un paiement manuel"
      }, { status: 403 });
    }

    // Valider les données
    const body = await request.json();
    const validated = confirmManualPaymentSchema.parse(body);

    // Récupérer la facture
    const { data: invoice, error: invoiceError } = await serviceClient
      .from("invoices")
      .select(`
        id,
        lease_id,
        owner_id,
        tenant_id,
        montant_total,
        statut,
        lease:leases!invoices_lease_id_fkey(
          property:properties!leases_property_id_fkey(owner_id)
        )
      `)
      .eq("id", validated.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire de la facture
    const leaseProperty = (invoice as any).lease?.property;
    if (leaseProperty?.owner_id !== profile.id && invoice.owner_id !== profile.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Vérifier que la facture n'est pas déjà payée
    if (invoice.statut === "paid") {
      return NextResponse.json({
        error: "Cette facture est déjà payée",
        invoice_status: invoice.statut
      }, { status: 400 });
    }

    // Calculer le total déjà payé
    const { data: existingPayments } = await serviceClient
      .from("payments")
      .select("montant")
      .eq("invoice_id", validated.invoice_id)
      .eq("statut", "succeeded");

    const totalPaid = (existingPayments || []).reduce(
      (sum, p) => sum + Number(p.montant), 0
    );
    const newTotal = totalPaid + validated.amount;

    // Créer le paiement
    const paymentData = {
      invoice_id: validated.invoice_id,
      montant: validated.amount,
      moyen: validated.method === "especes" ? "especes" : validated.method,
      statut: "succeeded" as const,
      date_paiement: validated.received_date || new Date().toISOString(),
      provider_ref: validated.reference || null,
      metadata: {
        confirmed_manually: true,
        confirmed_by: profile.id,
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
      console.error("[confirm-manual] Erreur création paiement:", paymentError);
      return NextResponse.json({
        error: "Erreur lors de l'enregistrement du paiement"
      }, { status: 500 });
    }

    // ✅ FIX: Mettre à jour le statut de la facture selon le montant
    let newInvoiceStatus: "sent" | "paid" = "sent";
    if (newTotal >= invoice.montant_total) {
      newInvoiceStatus = "paid";
    }
    // Note: On pourrait ajouter 'partial' si newTotal > 0 && newTotal < montant_total

    await serviceClient
      .from("invoices")
      .update({
        statut: newInvoiceStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.invoice_id);

    // Audit log
    await serviceClient.from("audit_log").insert({
      user_id: user.id,
      action: "manual_payment_confirmed",
      entity_type: "payment",
      entity_id: payment.id,
      metadata: {
        invoice_id: validated.invoice_id,
        amount: validated.amount,
        method: validated.method,
        reference: validated.reference,
        total_paid: newTotal,
        invoice_total: invoice.montant_total,
        invoice_status: newInvoiceStatus,
      },
    });

    // Émettre un événement si la facture est payée
    if (newInvoiceStatus === "paid") {
      await serviceClient.from("outbox").insert({
        event_type: "Invoice.Paid",
        payload: {
          invoice_id: validated.invoice_id,
          lease_id: invoice.lease_id,
          paid_amount: newTotal,
          payment_method: validated.method,
          confirmed_manually: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      amount: validated.amount,
      method: validated.method,
      total_paid: newTotal,
      invoice_total: invoice.montant_total,
      invoice_status: newInvoiceStatus,
      is_fully_paid: newTotal >= invoice.montant_total,
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Données invalides",
        details: error.errors,
      }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[confirm-manual] Erreur:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/payments/confirm-manual?invoice_id=xxx
 *
 * Récupère l'état de paiement d'une facture pour affichage UI
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const invoiceId = url.searchParams.get("invoice_id");

    if (!invoiceId) {
      return NextResponse.json({ error: "invoice_id requis" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const serviceClient = getServiceClient();

    // Récupérer la facture avec ses paiements
    const { data: invoice } = await serviceClient
      .from("invoices")
      .select(`
        id,
        montant_total,
        statut,
        periode,
        payments:payments(
          id,
          montant,
          moyen,
          statut,
          date_paiement,
          provider_ref,
          metadata
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    const payments = (invoice as any).payments || [];
    const succeededPayments = payments.filter((p: any) => p.statut === "succeeded");
    const totalPaid = succeededPayments.reduce(
      (sum: number, p: any) => sum + Number(p.montant), 0
    );

    return NextResponse.json({
      invoice_id: invoice.id,
      invoice_total: invoice.montant_total,
      invoice_status: invoice.statut,
      periode: invoice.periode,
      total_paid: totalPaid,
      remaining: Math.max(0, invoice.montant_total - totalPaid),
      is_fully_paid: totalPaid >= invoice.montant_total,
      payments: succeededPayments.map((p: any) => ({
        id: p.id,
        amount: p.montant,
        method: p.moyen,
        date: p.date_paiement,
        reference: p.provider_ref,
        confirmed_manually: p.metadata?.confirmed_manually || false,
      })),
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[confirm-manual GET] Erreur:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
