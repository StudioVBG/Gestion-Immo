export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service-client";
import { NextResponse } from "next/server";

/**
 * POST /api/properties/[id]/inspections - Planifier un EDL
 * @version 2026-01-22 - Fix: Next.js 15 params Promise pattern
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    // Frontend envoie general_notes, on accepte les deux noms
    const { type, scheduled_at, lease_id, general_notes, notes, keys } = body;

    if (!type || !["entree", "sortie"].includes(type)) {
      return NextResponse.json(
        { error: "Type requis: 'entree' ou 'sortie'" },
        { status: 400 }
      );
    }

    if (!scheduled_at) {
      return NextResponse.json(
        { error: "Date de planification requise" },
        { status: 400 }
      );
    }

    // lease_id est requis (NOT NULL dans la BDD)
    if (!lease_id) {
      return NextResponse.json(
        { error: "Bail (lease_id) requis pour créer un EDL" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire
    const { data: property } = await supabase
      .from("properties")
      .select("id, owner_id")
      .eq("id", id as any)
      .single();

    if (!property) {
      return NextResponse.json(
        { error: "Logement non trouvé" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id as any)
      .single();

    const propertyData = property as any;
    const profileData = profile as any;
    if (propertyData.owner_id !== profileData?.id) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // 🔧 FIX: Éviter les doublons d'EDL en brouillon pour le même bail et même type
    if (lease_id) {
      const { data: existingEdl } = await supabase
        .from("edl")
        .select("*")
        .eq("lease_id", lease_id)
        .eq("type", type)
        .in("status", ["draft", "in_progress"]) // Seuls statuts valides avant complétion
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingEdl) {
        console.log("[api/inspections] EDL existant trouvé pour ce bail, réutilisation de:", existingEdl.id);
        return NextResponse.json({ edl: existingEdl });
      }
    }

    // Créer l'EDL
    // Note: property_id n'existe pas dans la table edl - on utilise lease_id pour accéder à la propriété
    // scheduled_date est de type DATE (YYYY-MM-DD), pas TIMESTAMPTZ
    const scheduledDate = scheduled_at ? scheduled_at.split('T')[0] : null;

    // Utiliser le service client pour bypasser RLS lors de l'insertion
    let serviceClient;
    try {
      serviceClient = getServiceClient();
    } catch (err) {
      console.error("[api/inspections] Service client error:", err);
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
    }

    const insertPayload = {
      lease_id: lease_id,
      type,
      scheduled_date: scheduledDate,
      status: "draft", // 'scheduled' n'existe pas dans la contrainte CHECK - on utilise 'draft'
      general_notes: general_notes || notes || null, // Frontend envoie general_notes
      keys: keys || [],
      created_by: user.id,
    };

    console.log("[api/inspections] Creating EDL with payload:", JSON.stringify(insertPayload));

    const { data: edl, error } = await serviceClient
      .from("edl")
      .insert(insertPayload as any)
      .select()
      .single();

    if (error) {
      console.error("[api/inspections] EDL insert error:", error);
      return NextResponse.json({
        error: "Erreur lors de la création de l'EDL",
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    const edlData = edl as any;

    // 🔧 FIX: Injecter automatiquement les signataires du bail dans l'EDL
    try {
      const { data: leaseSigners } = await serviceClient
        .from("lease_signers")
        .select("profile_id, role")
        .eq("lease_id", lease_id);

      if (leaseSigners && leaseSigners.length > 0) {
        const edlSignatures = leaseSigners.map((ls: any) => ({
          edl_id: edlData.id,
          signer_user: null, // Sera rempli lors de la signature via auth.uid()
          signer_profile_id: ls.profile_id,
          // Convertir le rôle du bail vers le rôle EDL (supporte les formats FR et EN)
          signer_role: (ls.role === "proprietaire" || ls.role === "owner") ? "owner" : "tenant",
          invitation_token: crypto.randomUUID(),
        }));

        await serviceClient.from("edl_signatures").insert(edlSignatures);
        console.log(`[api/inspections] ${edlSignatures.length} signataires injectés depuis le bail`);
      }
    } catch (signerError) {
      // Ne pas bloquer si les signataires ne peuvent pas être ajoutés
      console.warn("[api/inspections] Erreur lors de l'ajout des signataires:", signerError);
    }

    // Émettre un événement (non bloquant)
    try {
      await serviceClient.from("outbox").insert({
        event_type: "Inspection.Scheduled",
        payload: {
          edl_id: edlData.id,
          property_id: id as any,
          lease_id,
          type,
          scheduled_at,
        },
      } as any);
    } catch (outboxError) {
      console.warn("[api/inspections] Erreur outbox:", outboxError);
    }

    // Journaliser (non bloquant)
    try {
      await serviceClient.from("audit_log").insert({
        user_id: user.id,
        action: "edl_scheduled",
        entity_type: "edl",
        entity_id: edlData.id,
        metadata: { type, scheduled_at },
      } as any);
    } catch (auditError) {
      console.warn("[api/inspections] Erreur audit_log:", auditError);
    }

    return NextResponse.json({ edl: edlData });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}





