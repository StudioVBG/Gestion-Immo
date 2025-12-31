import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service-client";
import { NextResponse } from "next/server";
import { LeaseTemplateService } from "@/lib/templates/bail";
import type { TypeBail, BailComplet } from "@/lib/templates/bail/types";

/**
 * GET /api/leases/[id]/html - Récupérer le HTML d'un bail (signé ou non)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const leaseId = params.id;
    const serviceClient = getServiceClient();

    // 1. Récupérer les données complètes du bail
    const { data: lease, error: leaseError } = await serviceClient
      .from("leases")
      .select(`
        *,
        property:properties (*),
        signers:lease_signers (*, profile:profiles(*))
      `)
      .eq("id", leaseId)
      .single();

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 });
    }

    // 2. Récupérer les infos du propriétaire
    const { data: ownerProfile } = await serviceClient
      .from("owner_profiles")
      .select("*, profile:profiles(*)")
      .eq("profile_id", lease.property.owner_id)
      .single();

    const typeBail = (lease.type_bail || "meuble") as TypeBail;
    
    // 3. Préparer les données pour le template
    // Note: On réutilise la logique de mapping existante ou on la simplifie ici
    const tenantSigner = lease.signers?.find((s: any) => s.role === "locataire_principal" || s.role === "locataire");
    const tenant = tenantSigner?.profile;

    const bailData: Partial<BailComplet> = {
      reference: lease.id.slice(0, 8).toUpperCase(),
      date_signature: lease.date_signature || lease.created_at,
      lieu_signature: lease.property?.ville || "N/A",
      bailleur: {
        nom: ownerProfile?.raison_sociale || ownerProfile?.profile?.nom || "",
        prenom: ownerProfile?.type === 'societe' ? "" : (ownerProfile?.profile?.prenom || ""),
        adresse: ownerProfile?.adresse_facturation || lease.property?.adresse_complete || "",
        type: ownerProfile?.type || "particulier",
        est_mandataire: false,
      },
      locataires: tenant ? [{
        nom: tenant.nom || "",
        prenom: tenant.prenom || "",
        email: tenant.email || "",
        telephone: tenant.telephone || "",
      }] : [],
      logement: {
        adresse_complete: lease.property?.adresse_complete || "",
        code_postal: lease.property?.code_postal || "",
        ville: lease.property?.ville || "",
        type: lease.property?.type || "appartement",
        surface_habitable: lease.property?.surface || 0,
        nb_pieces_principales: lease.property?.nb_pieces || 1,
      },
      conditions: {
        date_debut: lease.date_debut,
        loyer_hc: lease.loyer,
        charges_montant: lease.charges_forfaitaires,
        depot_garantie: lease.depot_de_garantie,
      } as any,
      signers: lease.signers,
    };

    // 4. Générer le HTML
    const html = LeaseTemplateService.generateHTML(typeBail, bailData);

    return NextResponse.json({
      html,
      fileName: `Bail_${typeBail}_${lease.property?.ville || "document"}.pdf`
    });
  } catch (error: any) {
    console.error("[Lease HTML] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

