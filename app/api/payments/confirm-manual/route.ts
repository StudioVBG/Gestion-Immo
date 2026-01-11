export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/confirm-manual
 *
 * Confirme manuellement un paiement reçu par virement, chèque ou espèces.
 * Utilisé par le propriétaire pour marquer un paiement comme reçu.
 *
 * ✅ SOTA 2026: Utilise le service centralisé PaymentProcessor
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service-client";
import { z } from "zod";
import {
  manualPaymentSchema,
  recordManualPayment,
  getInvoicePaymentStatus,
} from "@/lib/services/payment-processor.service";

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
    const validated = manualPaymentSchema.parse(body);

    // Vérifier l'accès à la facture
    const { data: invoice, error: invoiceError } = await serviceClient
      .from("invoices")
      .select(`
        id,
        owner_id,
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

    // ✅ Utiliser le service centralisé
    const result = await recordManualPayment(validated, {
      userId: user.id,
      profileId: profile.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payment_id: result.payment_id,
      ...result.details,
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

    // ✅ Utiliser le service centralisé
    const status = await getInvoicePaymentStatus(invoiceId);

    if (!status) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    // Ajouter la période depuis la facture
    const { data: invoice } = await serviceClient
      .from("invoices")
      .select("periode, statut")
      .eq("id", invoiceId)
      .single();

    return NextResponse.json({
      ...status,
      invoice_status: invoice?.statut || "unknown",
      periode: invoice?.periode,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[confirm-manual GET] Erreur:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
