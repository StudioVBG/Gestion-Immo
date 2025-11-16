import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/units/[uid]/leases - Créer un bail depuis un modèle
 */
export async function POST(
  request: Request,
  { params }: { params: { uid: string } }
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
    const { template_id, type_bail, loyer, charges_forfaitaires, depot_de_garantie, date_debut, date_fin, variables } = body;

    if (!type_bail || !loyer || !date_debut) {
      return NextResponse.json(
        { error: "type_bail, loyer et date_debut requis" },
        { status: 400 }
      );
    }

    // Récupérer l'unité
    const { data: unit } = await supabase
      .from("units")
      .select(`
        id,
        property:properties!inner(id, owner_id)
      `)
      .eq("id", params.uid)
      .single();

    if (!unit) {
      return NextResponse.json(
        { error: "Unité non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id as any)
      .single();

    const unitData = unit as any;
    if (unitData.property.owner_id !== profile?.id) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer le template si fourni
    let template = null;
    if (template_id) {
      const { data: templateData } = await supabase
        .from("lease_templates")
        .select("*")
        .eq("id", template_id)
        .eq("is_active", true)
        .single();
      template = templateData;
    }

    // Créer le bail
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .insert({
        unit_id: params.uid,
        type_bail,
        loyer,
        charges_forfaitaires: charges_forfaitaires || 0,
        depot_de_garantie: depot_de_garantie || 0,
        date_debut,
        date_fin: date_fin || null,
        statut: "draft",
      } as any)
      .select()
      .single();

    if (leaseError) throw leaseError;

    // Créer le draft depuis le template
    if (template) {
      const { data: draft, error: draftError } = await supabase
        .from("lease_drafts")
        .insert({
          lease_id: lease.id,
          template_id: template.id,
          version: 1,
          variables: variables || {},
        } as any)
        .select()
        .single();

      if (draftError) {
        console.error("Erreur création draft:", draftError);
        // Ne pas bloquer si le draft échoue
      } else {
        // Émettre un événement
        await supabase.from("outbox").insert({
          event_type: "Lease.Drafted",
          payload: {
            lease_id: lease.id,
            draft_id: draft.id,
            template_id: template.id,
          },
        } as any);
      }
    }

    // Ajouter le propriétaire comme signataire
    await supabase.from("lease_signers").insert({
      lease_id: lease.id,
      profile_id: profile.id,
      role: "proprietaire",
      signature_status: "pending",
    } as any);

    return NextResponse.json({ lease });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}





