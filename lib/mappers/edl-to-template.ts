/**
 * Mapper pour transformer les données brutes de la BDD vers le format EDLComplet
 */

import { EDLComplet, EDLItem, EDLMeterReading, EDLSignature } from "@/lib/templates/edl/types";

function getPublicUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return path;
  
  // Les photos sont stockées dans le bucket 'documents'
  return `${supabaseUrl}/storage/v1/object/public/documents/${path}`;
}

interface RawEDL {
  id: string;
  lease_id: string;
  type: "entree" | "sortie";
  status: string;
  scheduled_at?: string | null;
  scheduled_date?: string | null;
  completed_date?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  general_notes?: string | null;
  lease?: RawLease;
}

interface RawLease {
  id: string;
  type_bail: string;
  loyer: number;
  charges_forfaitaires: number;
  date_debut: string;
  date_fin?: string | null;
  property?: RawProperty;
  signers?: RawSigner[];
}

interface RawProperty {
  id: string;
  adresse_complete: string;
  code_postal: string;
  ville: string;
  type: string;
  surface?: number | null;
  nb_pieces?: number | null;
  etage?: string | null;
  numero_lot?: string | null;
  owner_id: string;
}

interface RawSigner {
  profile_id: string;
  role: string;
  profile?: {
    id: string;
    nom: string;
    prenom: string;
    email?: string | null;
    telephone?: string | null;
    date_naissance?: string | null;
    lieu_naissance?: string | null;
    tenant_profile?: {
      locataire_type: string;
      raison_sociale?: string | null;
      representant_legal?: string | null;
      siren?: string | null;
    } | null;
  };
}

interface RawOwnerProfile {
  id: string;
  profile_id: string;
  type: "particulier" | "societe";
  raison_sociale?: string | null;
  representant_nom?: string | null;
  representant_qualite?: string | null;
  siret?: string | null;
  adresse_facturation?: string | null;
  profile?: {
    nom: string;
    prenom: string;
    email?: string | null;
    telephone?: string | null;
  };
}

interface RawEDLItem {
  id: string;
  edl_id: string;
  room_name: string;
  item_name: string;
  condition?: string | null;
  notes?: string | null;
}

interface RawEDLMedia {
  id: string;
  edl_id: string;
  item_id?: string | null;
  file_path: string;
  type: string;
}

interface RawMeterReading {
  type: string;
  meter_number?: string | null;
  reading: string;
  unit: string;
  photo_url?: string | null;
}

interface RawEDLSignature {
  id: string;
  edl_id: string;
  signer_type: string;
  signer_profile_id: string;
  signature_image?: string | null;
  signature_image_path?: string | null;
  signed_at?: string | null;
  ip_address?: string | null;
  invitation_sent_at?: string | null;
  invitation_token?: string | null;
  profile?: {
    nom: string;
    prenom: string;
  };
}

interface RawKeys {
  type: string;
  quantity: number;
  notes?: string | null;
}

/**
 * Mappe les données brutes de la BDD vers le format EDLComplet
 */
export function mapRawEDLToTemplate(
  edl: RawEDL,
  ownerProfile: RawOwnerProfile | null,
  items: RawEDLItem[],
  media: RawEDLMedia[],
  meterReadings: RawMeterReading[],
  signatures: RawEDLSignature[],
  keys: RawKeys[]
): EDLComplet {
  const lease = edl.lease;
  const property = lease?.property || (edl as any).property || (edl as any).property_details;

  // Grouper les items par pièce
  const roomsMap = new Map<string, EDLItem[]>();
  items.forEach((item) => {
    const roomItems = roomsMap.get(item.room_name) || [];
    
    // Trouver les photos associées à cet item
    const itemPhotos = media
      .filter((m) => m.item_id === item.id && m.type === "photo")
      .map((m) => getPublicUrl(m.file_path));

    roomItems.push({
      id: item.id,
      room_name: item.room_name,
      item_name: item.item_name,
      condition: item.condition as EDLItem["condition"],
      notes: item.notes || undefined,
      photos: itemPhotos.length > 0 ? itemPhotos : undefined,
    });
    roomsMap.set(item.room_name, roomItems);
  });

  // Convertir la Map en tableau
  const pieces = Array.from(roomsMap.entries()).map(([nom, items]) => ({
    nom,
    items,
  }));

  // Extraire les locataires des signataires
  const locataires =
    lease?.signers
      ?.filter(
        (s) =>
          // Rôles en anglais (base de données)
          s.role === "tenant" ||
          s.role === "principal" ||
          // Rôles en français (legacy)
          s.role === "locataire_principal" ||
          s.role === "colocataire" ||
          s.role === "locataire"
      )
      .map((s) => {
        const nom = s.profile?.nom || "";
        const prenom = s.profile?.prenom || "";
        const tp = s.profile?.tenant_profile;
        
        // Logique Société
        let nomComplet = (prenom || nom) ? `${prenom} ${nom}`.trim() : "Locataire à définir";
        if (tp && tp.locataire_type === "entreprise" && tp.raison_sociale) {
          nomComplet = `${tp.raison_sociale} (Représentée par ${tp.representant_legal || nomComplet})`;
        }

        return {
          nom,
          prenom,
          nom_complet: nomComplet,
          date_naissance: s.profile?.date_naissance || undefined,
          lieu_naissance: s.profile?.lieu_naissance || undefined,
          telephone: s.profile?.telephone || undefined,
          email: s.profile?.email || undefined,
        };
      }) || [];

  // Construire le bailleur
  const bailleur = {
    type: ownerProfile?.type || "particulier",
    nom_complet:
      ownerProfile?.type === "societe"
        ? ownerProfile?.raison_sociale || ""
        : `${ownerProfile?.profile?.prenom || ""} ${ownerProfile?.profile?.nom || ""}`.trim(),
    raison_sociale: ownerProfile?.raison_sociale || undefined,
    representant: ownerProfile?.representant_nom || undefined,
    adresse: ownerProfile?.adresse_facturation || undefined,
    telephone: ownerProfile?.profile?.telephone || undefined,
    email: ownerProfile?.profile?.email || undefined,
  };

  // Convertir les compteurs
  const compteurs: EDLMeterReading[] = meterReadings.map((m) => ({
    type: m.type as EDLMeterReading["type"],
    meter_number: m.meter_number || undefined,
    reading: m.reading,
    unit: m.unit,
    photo_url: m.photo_url ? getPublicUrl(m.photo_url) : undefined,
  }));

  // Convertir les signatures
  // Priorité: URL signée (pour buckets privés) > signature_image > signature_image_path
  const edlSignatures: EDLSignature[] = signatures.map((s) => ({
    signer_type: s.signer_type as EDLSignature["signer_type"],
    signer_profile_id: s.signer_profile_id,
    signer_name: s.profile 
      ? `${s.profile.prenom || ""} ${s.profile.nom || ""}`.trim()
      : s.signer_type === "owner" ? "Bailleur" : "Locataire",
    // Utiliser l'URL signée si disponible (générée côté serveur pour le bucket privé)
    signature_image: s.signature_image_url || 
      (s.signature_image?.startsWith("data:") || s.signature_image?.startsWith("http") ? s.signature_image : undefined) ||
      ((s.signature_image || s.signature_image_path) ? getPublicUrl(s.signature_image || s.signature_image_path || "") : undefined),
    signed_at: s.signed_at || undefined,
    ip_address: s.ip_address || undefined,
    invitation_sent_at: s.invitation_sent_at || undefined,
    invitation_token: s.invitation_token || undefined,
  }));

  // Convertir les clés
  const clesRemises = keys.map((k) => ({
    type: k.type,
    quantite: k.quantity,
    notes: k.notes || undefined,
  }));

  // Déterminer si l'EDL est complet et signé
  const isComplete = edl.status === "completed" || edl.status === "signed";
  const isSigned =
    edl.status === "signed" ||
    (edlSignatures.filter((s) => s.signed_at).length >= 2);

  return {
    id: edl.id,
    reference: `EDL-${edl.id.slice(0, 8).toUpperCase()}`,
    type: edl.type,
    scheduled_date: edl.scheduled_at || edl.scheduled_date || undefined,
    completed_date: edl.completed_date || undefined,
    created_at: edl.created_at,

    logement: {
      adresse_complete: property?.adresse_complete || "",
      code_postal: property?.code_postal || "",
      ville: property?.ville || "",
      type_bien: property?.type || "",
      surface: property?.surface || undefined,
      nb_pieces: property?.nb_pieces || undefined,
      etage: property?.etage || undefined,
      numero_lot: property?.numero_lot || undefined,
    },

    bailleur,
    locataires,

    bail: {
      id: lease?.id || "",
      reference: lease?.id ? `BAIL-${lease.id.slice(0, 8).toUpperCase()}` : undefined,
      type_bail: lease?.type_bail || "",
      date_debut: lease?.date_debut || "",
      date_fin: lease?.date_fin || undefined,
      loyer_hc: lease?.loyer || 0,
      charges: lease?.charges_forfaitaires || 0,
    },

    compteurs,
    pieces,
    observations_generales: edl.general_notes || undefined,
    cles_remises: clesRemises.length > 0 ? clesRemises : undefined,
    signatures: edlSignatures,
    is_complete: isComplete,
    is_signed: isSigned,
    status: edl.status as EDLComplet["status"],
  };
}

/**
 * Génère une référence unique pour l'EDL
 */
export function generateEDLReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EDL-${timestamp}-${random}`;
}

export default mapRawEDLToTemplate;


