export const runtime = 'nodejs';

// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/leases/[id]/activate - Activer manuellement un bail
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est propriétaire
    const { data: lease } = await supabase
      .from("leases")
      .select(`
        id,
        statut,
        property:properties!inner(owner_id)
      `)
      .eq("id", params.id as any)
      .single();

    if (!lease) {
      return NextResponse.json(
        { error: "Bail non trouvé" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    const leaseData = lease as any;
    const profileData = profile as any;
    const isAdmin = profileData?.role === "admin";
    const isOwner = leaseData.property.owner_id === profileData?.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    if (leaseData.statut === "active") {
      return NextResponse.json(
        { error: "Le bail est déjà actif" },
        { status: 400 }
      );
    }

    // Vérifier que tous les signataires ont signé
    const { data: signers } = await (supabase as any)
      .from("lease_signers")
      .select("signature_status")
      .eq("lease_id", params.id as any);

    const allSigned = signers?.every((s: any) => s.signature_status === "signed");

    if (!allSigned && !isAdmin) {
      return NextResponse.json(
        { error: "Tous les signataires doivent avoir signé" },
        { status: 400 }
      );
    }

    // Activer le bail
    const supabaseClient = supabase as any;
    const { data: updated, error } = await supabaseClient
      .from("leases")
      .update({ statut: "active" } as any)
      .eq("id", params.id as any)
      .select()
      .single();

    if (error) throw error;

    // ============================================================
    // AUTOMATISATION : Générer la première facture
    // ============================================================
    try {
      const currentDate = new Date();
      const periode = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Récupérer le locataire principal
      const { data: tenantSigner } = await supabaseClient
        .from("lease_signers")
        .select("profile_id")
        .eq("lease_id", params.id as any)
        .eq("role", "locataire_principal")
        .maybeSingle();

      const tenantId = tenantSigner ? (tenantSigner as any).profile_id : null;

      if (tenantId) {
        // Vérifier si facture existe déjà
        const { data: existingInvoice } = await supabaseClient
          .from("invoices")
          .select("id")
          .eq("lease_id", params.id as any)
          .eq("periode", periode)
          .maybeSingle();

        if (!existingInvoice) {
          const loyer = Number(leaseData.loyer || 0);
          const charges = Number(leaseData.charges_forfaitaires || 0);
          
          await supabaseClient.from("invoices").insert({
            lease_id: params.id as any,
            owner_id: leaseData.property.owner_id,
            tenant_id: tenantId,
            periode: periode,
            montant_loyer: loyer,
            montant_charges: charges,
            montant_total: loyer + charges,
            statut: "draft", // On la crée en brouillon pour validation, ou "sent" direct ? Disons draft.
            created_at: new Date().toISOString()
          } as any);
          
          console.log(`[Auto-Invoice] Facture générée pour le bail ${params.id} (Période: ${periode})`);
        }
      }
    } catch (invError) {
      console.error("[Auto-Invoice] Erreur lors de la génération automatique:", invError);
      // On ne bloque pas l'activation du bail si la facture échoue
    }
    // ============================================================

    // Émettre un événement
    await supabaseClient.from("outbox").insert({
      event_type: "Lease.Activated",
      payload: {
        lease_id: params.id as any,
        activated_by: user.id,
        manual: true,
      },
    } as any);

    // Journaliser
    await supabaseClient.from("audit_log").insert({
      user_id: user.id,
      action: "lease_activated",
      entity_type: "lease",
      entity_id: params.id,
      metadata: { manual: true },
    } as any);

    return NextResponse.json({ lease: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}





