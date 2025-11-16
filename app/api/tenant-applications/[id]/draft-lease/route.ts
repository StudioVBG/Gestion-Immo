import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/tenant-applications/[id]/draft-lease - Générer un draft de bail pré-rempli
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

    const applicationId = params.id;

    // Vérifier que l'application appartient à l'utilisateur
    const { data: application, error: appError } = await supabase
      .from("tenant_applications")
      .select(`
        *,
        unit:units(*),
        property:properties(*),
        tenant_profile:profiles!tenant_applications_tenant_profile_id_fkey(*)
      `)
      .eq("id", applicationId)
      .eq("tenant_user", user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    const appData = application as any;

    if (appData.status !== "ready_to_sign") {
      return NextResponse.json(
        { error: "Le dossier doit être en statut 'ready_to_sign'" },
        { status: 400 }
      );
    }

    // Récupérer le template de bail approprié
    const propertyType = appData.property?.type || "appartement";
    const { data: template } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("type_bail", "meuble") // Par défaut, ajuster selon le contexte
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Préparer les variables pour le template
    const extractedFields = appData.extracted_json || {};
    const variables = {
      tenant_first_name: extractedFields.first_name || appData.tenant_profile?.prenom || "",
      tenant_last_name: extractedFields.last_name || appData.tenant_profile?.nom || "",
      tenant_email: user.email || "",
      property_address: appData.property?.adresse_complete || "",
      property_surface: appData.property?.surface || 0,
      property_rooms: appData.property?.nb_pieces || 0,
      ...extractedFields,
    };

    // Créer le draft
    const { data: draft, error: draftError } = await supabase
      .from("lease_drafts")
      .insert({
        application_id: applicationId,
        template_id: template?.id || null,
        version: 1,
        variables,
        pdf_url: null, // Sera généré par un job
      } as any)
      .select()
      .single();

    if (draftError) throw draftError;

    // Émettre un événement pour génération PDF
    await supabase.from("outbox").insert({
      event_type: "lease.draft.created",
      payload: {
        draft_id: draft.id,
        application_id: applicationId,
        template_id: template?.id,
      },
    } as any);

    // Mettre à jour le statut de l'application
    await supabase
      .from("tenant_applications")
      .update({ status: "ready_to_sign" } as any)
      .eq("id", applicationId);

    return NextResponse.json({ draft });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}





