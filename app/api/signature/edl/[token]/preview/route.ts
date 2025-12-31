export const runtime = "nodejs";

import { getServiceClient } from "@/lib/supabase/service-client";
import { NextResponse } from "next/server";
import {
  generateEDLHTML,
  EDLComplet,
} from "@/lib/templates/edl";

/**
 * POST /api/signature/edl/[token]/preview
 * Génère l'aperçu HTML d'un EDL via token (sans auth requise)
 */
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params;
    const serviceClient = getServiceClient();

    // 1. Trouver la signature par token
    const { data: signatureEntry, error: sigError } = await serviceClient
      .from("edl_signatures")
      .select("*, edl:edl_id(*)")
      .eq("invitation_token", token)
      .single();

    if (sigError || !signatureEntry) {
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
    }

    const edlId = signatureEntry.edl_id;

    // 2. Récupérer les données complètes (copié de /api/edl/preview)
    const { data: edl, error } = await serviceClient
      .from("edl")
      .select(`
        *,
        lease:lease_id(
          *,
          property:properties(*),
          signers:lease_signers(
            *,
            profile:profiles(*)
          )
        )
      `)
      .eq("id", edlId)
      .single();

    if (error || !edl) {
      return NextResponse.json({ error: "EDL non trouvé" }, { status: 404 });
    }

    // Récupérer les items, médias et signatures
    const [
      { data: items },
      { data: media },
      { data: signaturesRaw },
      { data: ownerProfile }
    ] = await Promise.all([
      serviceClient.from("edl_items").select("*").eq("edl_id", edlId),
      serviceClient.from("edl_media").select("*").eq("edl_id", edlId),
      serviceClient.from("edl_signatures").select("*, profile:profiles(*)").eq("edl_id", edlId),
      serviceClient.from("owner_profiles").select("*, profile:profiles(*)").eq("profile_id", edl.lease?.property?.owner_id || edl.property_id).single()
    ]);

    // Mapper les données (on pourrait exporter mapDatabaseToEDLComplet mais ici on simplifie)
    const fullEdlData = mapDatabaseToEDLComplet(
      edl,
      ownerProfile,
      items || [],
      media || [],
      signaturesRaw || []
    );

    const html = generateEDLHTML(fullEdlData);

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error("[EDL Token Preview] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la génération de l'aperçu" },
      { status: 500 }
    );
  }
}

// Fonction utilitaire identique à celle de /api/edl/preview (devrait idéalement être partagée)
function mapDatabaseToEDLComplet(
  edl: any,
  ownerProfile: any,
  items: any[],
  media: any[],
  signatures: any[] = []
): EDLComplet {
  const lease = edl.lease;
  const property = lease?.property || edl.property_details;

  const roomsMap = new Map<string, any[]>();
  items.forEach((item) => {
    const roomItems = roomsMap.get(item.room_name) || [];
    roomItems.push({
      ...item,
      photos: media.filter((m) => m.item_id === item.id).map((m) => m.storage_path)
    });
    roomsMap.set(item.room_name, roomItems);
  });

  const pieces = Array.from(roomsMap.entries()).map(([nom, items]) => ({
    nom,
    items,
  }));

  const locataires = lease?.signers
    ?.filter((s: any) => ["tenant", "principal", "locataire_principal", "colocataire", "locataire"].includes(s.role))
    .map((s: any) => ({
      nom: s.profile?.nom || "",
      prenom: s.profile?.prenom || "",
      nom_complet: `${s.profile?.prenom || ""} ${s.profile?.nom || ""}`.trim() || s.invited_name || "Locataire",
      email: s.profile?.email || s.invited_email,
      telephone: s.profile?.telephone,
    })) || [];

  const bailleur = {
    type: ownerProfile?.type || "particulier",
    nom_complet: ownerProfile?.type === "societe" ? ownerProfile.raison_sociale : `${ownerProfile?.profile?.prenom || ""} ${ownerProfile?.profile?.nom || ""}`.trim(),
    adresse: ownerProfile?.adresse_facturation,
    email: ownerProfile?.profile?.email,
  };

  const mappedSignatures = signatures.map((sig: any) => ({
    signer_type: ["owner", "proprietaire"].includes(sig.signer_role) ? "proprietaire" : "locataire",
    signer_name: sig.signer_name || `${sig.profile?.prenom || ""} ${sig.profile?.nom || ""}`.trim() || "Signataire",
    signed_at: sig.signed_at,
    signature_image: sig.signature_image_path,
  }));

  return {
    id: edl.id,
    type: edl.type,
    scheduled_date: edl.scheduled_at,
    completed_date: edl.completed_date,
    logement: {
      adresse_complete: property?.adresse_complete || "",
      ville: property?.ville || "",
      code_postal: property?.code_postal || "",
      type_bien: property?.type || "",
      surface: property?.surface,
      nb_pieces: property?.nb_pieces,
    },
    bailleur,
    locataires,
    compteurs: edl.meter_readings || [],
    pieces,
    signatures: mappedSignatures,
  };
}

