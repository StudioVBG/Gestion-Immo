export const runtime = 'nodejs';

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/edl/[id]/invite - Envoyer une invitation de signature à un locataire
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

    const body = await request.json();
    const { signer_profile_id } = body;

    if (!signer_profile_id) {
      return NextResponse.json(
        { error: "ID du signataire requis" },
        { status: 400 }
      );
    }

    // 1. Vérifier que l'EDL existe et que l'utilisateur a accès
    const { data: edl, error: edlError } = await supabase
      .from("edl")
      .select("*, property:properties(owner_id)")
      .eq("id", params.id)
      .single();

    if (edlError || !edl) {
      return NextResponse.json({ error: "EDL non trouvé" }, { status: 404 });
    }

    // 2. Vérifier que le signataire est bien lié à cet EDL
    const { data: signature, error: sigError } = await supabase
      .from("edl_signatures")
      .select("*, profile:profiles(email, prenom, nom)")
      .eq("edl_id", params.id)
      .eq("signer_profile_id", signer_profile_id)
      .single();

    if (sigError || !signature) {
      return NextResponse.json({ error: "Signataire non trouvé pour cet EDL" }, { status: 404 });
    }

    const profile = (signature as any).profile;
    if (!profile?.email) {
      return NextResponse.json({ error: "Email du locataire manquant" }, { status: 400 });
    }

    // 3. Mettre à jour la date d'invitation et générer un nouveau token si besoin
    const invitation_token = signature.invitation_token || crypto.randomUUID();
    
    await supabase
      .from("edl_signatures")
      .update({
        invitation_sent_at: new Date().toISOString(),
        invitation_token
      } as any)
      .eq("id", signature.id);

    // 4. Envoyer l'email (Simulation pour l'instant via Outbox pour traitement par Edge Function)
    await supabase.from("outbox").insert({
      event_type: "EDL.InvitationSent",
      payload: {
        edl_id: params.id,
        signer_id: signature.id,
        email: profile.email,
        name: `${profile.prenom} ${profile.nom}`,
        token: invitation_token,
        type: edl.type
      },
    } as any);

    // 5. Journaliser
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "edl_invitation_sent",
      entity_type: "edl",
      entity_id: params.id,
      metadata: { recipient: profile.email },
    } as any);

    return NextResponse.json({ success: true, sent_to: profile.email });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

