import { numberToWords } from "@/lib/helpers/format";
import type { BailComplet } from "@/lib/templates/bail/types";
import type { LeaseDetails } from "@/app/app/owner/_data/fetchLeaseDetails";

interface OwnerProfile {
  id: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  type?: string;
  raison_sociale?: string;
}

export function mapLeaseToTemplate(
  details: LeaseDetails,
  ownerProfile?: OwnerProfile
): Partial<BailComplet> {
  const { lease, property, signers } = details;

  // Trouver les signataires
  const mainTenant = signers?.find((s: any) => s.role === "locataire_principal");
  const ownerSigner = signers?.find((s: any) => s.role === "proprietaire");
  const guarantor = signers?.find((s: any) => s.role === "garant");

  // S'assurer que surface > 0, sinon undefined pour afficher les pointillés
  // On utilise any car property peut ne pas avoir toutes les propriétés typées dans LeaseDetails
  const propAny = property as any;
  const surface = propAny.surface_habitable_m2 || propAny.surface;
  const surfaceValid = surface && surface > 0 ? surface : undefined;

  // ✅ SYNCHRONISATION : Les données financières viennent du BIEN (source unique)
  const getMaxDepotLegal = (typeBail: string, loyerHC: number): number => {
    switch (typeBail) {
      case "nu":
      case "etudiant":
        return loyerHC * 1;
      case "meuble":
      case "colocation":
        return loyerHC * 2;
      case "mobilite":
        return 0;
      case "saisonnier":
        return loyerHC * 2;
      default:
        return loyerHC;
    }
  };

  // ✅ LIRE depuis le BIEN (source unique)
  const loyer = propAny?.loyer_hc ?? propAny?.loyer_base ?? lease.loyer ?? 0;
  const charges = propAny?.charges_mensuelles ?? lease.charges_forfaitaires ?? 0;
  const depotGarantie = getMaxDepotLegal(lease.type_bail, loyer);

  // Calcul de la durée par défaut selon le type de bail
  // ✅ FIX: Prend en compte le type de bailleur (société = 6 ans pour bail nu)
  const getDureeMois = (type: string, bailleurType?: string): number => {
    switch (type) {
      case "meuble":
        return 12;
      case "nu":
        // 6 ans (72 mois) si bailleur personne morale, 3 ans sinon
        return bailleurType === "societe" ? 72 : 36;
      case "mobilite":
        return 10; // Max légal, souvent ajusté selon dates
      case "saisonnier":
        // Calculer la différence en mois si dates dispos
        if (lease.date_debut && lease.date_fin) {
            const start = new Date(lease.date_debut);
            const end = new Date(lease.date_fin);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            return Math.ceil(diffDays / 30);
        }
        return 1;
      default:
        return bailleurType === "societe" ? 72 : 36;
    }
  };

  // Déterminer le jour de paiement (par défaut 5)
  const jourPaiement = (lease as any).jour_paiement || 5;
  
  // ✅ FIX: Terme à échoir si jour ≤ 10 (paiement en début de période)
  const paiementAvance = jourPaiement <= 10;

  return {
    reference: lease.id ? lease.id.slice(0, 8).toUpperCase() : "DRAFT",
    date_signature: lease.created_at, // Ou signed_at si dispo
    lieu_signature: property.ville || "...",
    
    bailleur: {
      nom: ownerProfile?.type === "societe" && ownerProfile?.raison_sociale 
        ? ownerProfile.raison_sociale 
        : ownerProfile?.nom || "[NOM PROPRIÉTAIRE]",
      prenom: ownerProfile?.type === "societe" ? "" : ownerProfile?.prenom || "[PRÉNOM]",
      adresse: ownerProfile?.adresse || "[ADRESSE PROPRIÉTAIRE]",
      code_postal: "",
      ville: "",
      email: ownerProfile?.email || "",
      telephone: ownerProfile?.telephone || "",
      type: ownerProfile?.type === "societe" ? "societe" : "particulier",
      raison_sociale: ownerProfile?.raison_sociale || "",
      est_mandataire: false,
    },

    locataires: mainTenant ? [{
      nom: mainTenant.profile?.nom || "[NOM LOCATAIRE]",
      prenom: mainTenant.profile?.prenom || "[PRÉNOM]",
      email: mainTenant.profile?.email || "",
      telephone: mainTenant.profile?.telephone || "",
      date_naissance: mainTenant.profile?.date_naissance || "",
      lieu_naissance: mainTenant.profile?.lieu_naissance || "",
      nationalite: mainTenant.profile?.nationalite || "Française",
      adresse: mainTenant.profile?.adresse || "",
    }] : [],

    logement: {
      adresse_complete: property.adresse_complete || (property as any).adresse || "",
      code_postal: property.code_postal || "",
      ville: property.ville || "",
      type: property.type as any || "appartement",
      surface_habitable: surfaceValid || 0,
      nb_pieces_principales: (property as any).nb_pieces || 1,
      etage: (property as any).etage,
      // Mapper les champs étendus (si présents en DB via select *)
      epoque_construction: propAny.annee_construction ? String(propAny.annee_construction) as any : undefined,
      chauffage_type: propAny.chauffage_type || undefined,
      eau_chaude_type: propAny.eau_chaude_type || undefined,
      regime: "mono_propriete", // Valeur par défaut
      equipements_privatifs: [],
      annexes: [],
    },

    conditions: {
      type_bail: lease.type_bail || "nu",
      usage: "habitation_principale",
      date_debut: lease.date_debut,
      date_fin: lease.date_fin,
      // ✅ FIX: Passer le type de bailleur pour calcul durée correcte
      duree_mois: getDureeMois(lease.type_bail, ownerProfile?.type),
      // ✅ Utiliser les valeurs synchronisées (property pour draft, lease pour actif)
      loyer_hc: loyer,
      loyer_en_lettres: numberToWords(loyer),
      charges_montant: charges,
      // ✅ FIX: Ajouter le total loyer + charges en lettres
      loyer_total: loyer + charges,
      loyer_total_en_lettres: numberToWords(loyer + charges),
      depot_garantie: depotGarantie,
      depot_garantie_en_lettres: numberToWords(depotGarantie),
      mode_paiement: "virement",
      periodicite_paiement: "mensuelle",
      jour_paiement: jourPaiement,
      tacite_reconduction: ["nu", "meuble"].includes(lease.type_bail),
      charges_type: "provisions", // Default
      revision_autorisee: true,
      indice_reference: "IRL",
      // ✅ FIX: Terme à échoir si paiement en début de mois
      paiement_avance: paiementAvance,
    },
    
    diagnostics: {
      dpe: {
        date_realisation: "",
        date_validite: "",
        classe_energie: propAny.dpe_classe_energie || propAny.energie || undefined,
        classe_ges: propAny.dpe_classe_climat || propAny.ges || undefined,
        consommation_energie: propAny.dpe_consommation || 0,
        emissions_ges: 0,
      }
    },
    
    // Signatures électroniques
    signatures: {
      bailleur: {
        signed: ownerSigner?.signature_status === "signed",
        signed_at: ownerSigner?.signed_at || null,
        image: ownerSigner?.signature_image || null,
      },
      locataire: {
        signed: mainTenant?.signature_status === "signed",
        signed_at: mainTenant?.signed_at || null,
        image: mainTenant?.signature_image || null,
      },
      garant: guarantor ? {
        signed: guarantor?.signature_status === "signed",
        signed_at: guarantor?.signed_at || null,
        image: guarantor?.signature_image || null,
      } : null,
    },
  };
}
