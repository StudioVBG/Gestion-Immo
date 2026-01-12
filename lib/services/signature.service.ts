/**
 * Service centralisé de gestion des signatures de bail
 *
 * ✅ SOTA 2026: Single source of truth pour toutes les opérations de signature
 */

import { getServiceClient } from "@/lib/supabase/service-client";
import { isOwnerRole, isTenantRole, LEASE_STATUS } from "@/lib/constants/roles";

// Types
export interface SignerInfo {
  id: string;
  lease_id: string;
  profile_id: string | null;
  role: string;
  signature_status: "pending" | "signed";
  invited_email?: string | null;
  invited_name?: string | null;
  signed_at?: string | null;
}

export interface SignatureRights {
  canSign: boolean;
  reason?: string;
  signer?: SignerInfo;
  role?: string;
  needsAutoCreate?: boolean;
}

export interface LeaseSignatureStatus {
  leaseId: string;
  currentStatus: string;
  signers: SignerInfo[];
  allSigned: boolean;
  hasOwner: boolean;
  hasTenant: boolean;
  ownerSigned: boolean;
  tenantSigned: boolean;
  missingSignatures: string[];
}

/**
 * Vérifie les droits de signature d'un utilisateur sur un bail
 */
export async function checkSignatureRights(
  leaseId: string,
  profileId: string,
  email: string
): Promise<SignatureRights> {
  const serviceClient = getServiceClient();

  // 1. Chercher si l'utilisateur est déjà un signataire via profile_id
  const { data: existingSigner } = await serviceClient
    .from("lease_signers")
    .select("*")
    .eq("lease_id", leaseId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existingSigner) {
    if (existingSigner.signature_status === "signed") {
      return { canSign: false, reason: "Vous avez déjà signé ce bail" };
    }
    return {
      canSign: true,
      signer: existingSigner as SignerInfo,
      role: existingSigner.role,
      needsAutoCreate: false,
    };
  }

  // 2. Chercher si l'utilisateur est invité via email
  if (email) {
    const { data: invitedSigner } = await serviceClient
      .from("lease_signers")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("invited_email", email)
      .is("profile_id", null)
      .maybeSingle();

    if (invitedSigner) {
      if (invitedSigner.signature_status === "signed") {
        return { canSign: false, reason: "Vous avez déjà signé ce bail" };
      }
      // Lier le signataire invité au profil
      const { data: updated } = await serviceClient
        .from("lease_signers")
        .update({ profile_id: profileId })
        .eq("id", invitedSigner.id)
        .select()
        .single();

      if (updated) {
        return {
          canSign: true,
          signer: updated as SignerInfo,
          role: invitedSigner.role,
          needsAutoCreate: false,
        };
      }
    }

    // 2b. Chercher un signataire locataire placeholder
    const { data: placeholderSigner } = await serviceClient
      .from("lease_signers")
      .select("*")
      .eq("lease_id", leaseId)
      .is("profile_id", null)
      .in("role", ["locataire_principal", "locataire", "tenant", "colocataire"])
      .maybeSingle();

    if (placeholderSigner) {
      const { data: updated } = await serviceClient
        .from("lease_signers")
        .update({ profile_id: profileId, invited_email: email })
        .eq("id", placeholderSigner.id)
        .select()
        .single();

      if (updated) {
        return {
          canSign: true,
          signer: updated as SignerInfo,
          role: placeholderSigner.role,
          needsAutoCreate: false,
        };
      }
    }
  }

  // 3. Vérifier si c'est le propriétaire du bien
  const { data: lease } = await serviceClient
    .from("leases")
    .select("property:properties(owner_id)")
    .eq("id", leaseId)
    .single();

  if (lease && (lease as any).property?.owner_id === profileId) {
    const { data: ownerSigner } = await serviceClient
      .from("lease_signers")
      .select("*")
      .eq("lease_id", leaseId)
      .in("role", ["proprietaire", "owner", "bailleur"])
      .maybeSingle();

    if (ownerSigner) {
      if (ownerSigner.signature_status === "signed") {
        return { canSign: false, reason: "Vous avez déjà signé ce bail en tant que propriétaire" };
      }
      if (!ownerSigner.profile_id) {
        const { data: updated } = await serviceClient
          .from("lease_signers")
          .update({ profile_id: profileId })
          .eq("id", ownerSigner.id)
          .select()
          .single();

        if (updated) {
          return {
            canSign: true,
            signer: updated as SignerInfo,
            role: "proprietaire",
            needsAutoCreate: false,
          };
        }
      }
      return {
        canSign: true,
        signer: ownerSigner as SignerInfo,
        role: "proprietaire",
        needsAutoCreate: false,
      };
    }
    // Propriétaire sans signataire existant
    return {
      canSign: true,
      signer: undefined,
      role: "proprietaire",
      needsAutoCreate: true,
    };
  }

  return { canSign: false, reason: "Vous n'êtes pas autorisé à signer ce bail" };
}

/**
 * Crée automatiquement un signataire pour un bail
 */
export async function createSigner(
  leaseId: string,
  profileId: string,
  role: string
): Promise<SignerInfo> {
  const serviceClient = getServiceClient();

  const { data: newSigner, error } = await serviceClient
    .from("lease_signers")
    .insert({
      lease_id: leaseId,
      profile_id: profileId,
      role: role,
      signature_status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[SignatureService] Erreur création signataire:", error);
    throw new Error("Impossible de créer le signataire: " + error.message);
  }

  return newSigner as SignerInfo;
}

/**
 * Détermine le statut du bail en fonction des signatures
 */
export async function determineLeaseStatus(leaseId: string): Promise<string> {
  const serviceClient = getServiceClient();

  const { data: signers, error } = await serviceClient
    .from("lease_signers")
    .select("signature_status, role, profile_id")
    .eq("lease_id", leaseId);

  if (error || !signers || signers.length === 0) {
    console.warn("[SignatureService] Aucun signataire trouvé:", leaseId);
    return LEASE_STATUS.DRAFT;
  }

  const hasOwner = signers.some((s) => isOwnerRole(s.role));
  const hasTenant = signers.some((s) => isTenantRole(s.role));

  // Vérifier qu'on a au moins 2 signataires
  if (signers.length < 2 || !hasOwner || !hasTenant) {
    console.warn("[SignatureService] Signataires manquants:", {
      hasOwner,
      hasTenant,
      count: signers.length,
    });
    return signers.some((s) => s.signature_status === "signed")
      ? LEASE_STATUS.PENDING_SIGNATURE
      : LEASE_STATUS.DRAFT;
  }

  // Vérifier que le locataire a un profil lié
  const tenantSigner = signers.find((s) => isTenantRole(s.role));
  const allSigned = signers.every((s) => s.signature_status === "signed");

  if (allSigned) {
    if (!tenantSigner?.profile_id) {
      console.warn("[SignatureService] Tous signés mais locataire sans profile_id");
      return LEASE_STATUS.PENDING_SIGNATURE;
    }
    return LEASE_STATUS.FULLY_SIGNED;
  }

  return LEASE_STATUS.PENDING_SIGNATURE;
}

/**
 * Récupère le statut complet des signatures d'un bail
 */
export async function getLeaseSignatureStatus(
  leaseId: string
): Promise<LeaseSignatureStatus | null> {
  const serviceClient = getServiceClient();

  const { data: lease } = await serviceClient
    .from("leases")
    .select(`
      id,
      statut,
      signers:lease_signers(
        id,
        lease_id,
        profile_id,
        role,
        signature_status,
        invited_email,
        invited_name,
        signed_at
      )
    `)
    .eq("id", leaseId)
    .single();

  if (!lease) return null;

  const signers = ((lease as any).signers || []) as SignerInfo[];

  const hasOwner = signers.some((s) => isOwnerRole(s.role));
  const hasTenant = signers.some((s) => isTenantRole(s.role));
  const ownerSigned = signers.some(
    (s) => isOwnerRole(s.role) && s.signature_status === "signed"
  );
  const tenantSigned = signers.some(
    (s) => isTenantRole(s.role) && s.signature_status === "signed"
  );
  const allSigned = signers.every((s) => s.signature_status === "signed");

  const missingSignatures: string[] = [];
  if (!ownerSigned) missingSignatures.push("proprietaire");
  if (!tenantSigned) missingSignatures.push("locataire");

  return {
    leaseId,
    currentStatus: lease.statut,
    signers,
    allSigned,
    hasOwner,
    hasTenant,
    ownerSigned,
    tenantSigned,
    missingSignatures,
  };
}

/**
 * Vérifie si un bail peut être initié pour signature
 */
export async function canInitiateSignature(
  leaseId: string,
  ownerProfileId: string
): Promise<{ canInitiate: boolean; reason?: string }> {
  const serviceClient = getServiceClient();

  const { data: lease } = await serviceClient
    .from("leases")
    .select(`
      id,
      statut,
      property:properties(owner_id),
      signers:lease_signers(id, role)
    `)
    .eq("id", leaseId)
    .single();

  if (!lease) {
    return { canInitiate: false, reason: "Bail non trouvé" };
  }

  // Vérifier que l'utilisateur est le propriétaire
  if ((lease as any).property?.owner_id !== ownerProfileId) {
    return { canInitiate: false, reason: "Accès non autorisé" };
  }

  // Vérifier le statut
  if (lease.statut !== "draft" && lease.statut !== LEASE_STATUS.DRAFT) {
    return {
      canInitiate: false,
      reason: `Statut actuel: ${lease.statut} (draft requis)`,
    };
  }

  // Vérifier les signataires
  const signers = (lease as any).signers || [];
  if (signers.length < 2) {
    return {
      canInitiate: false,
      reason: "Au moins 2 signataires requis (propriétaire + locataire)",
    };
  }

  const hasOwner = signers.some((s: any) =>
    ["proprietaire", "owner", "bailleur"].includes(s.role)
  );
  const hasTenant = signers.some((s: any) =>
    ["locataire_principal", "locataire", "tenant", "colocataire"].includes(s.role)
  );

  if (!hasOwner || !hasTenant) {
    return {
      canInitiate: false,
      reason: "Un propriétaire et au moins un locataire requis",
    };
  }

  return { canInitiate: true };
}

export default {
  checkSignatureRights,
  createSigner,
  determineLeaseStatus,
  getLeaseSignatureStatus,
  canInitiateSignature,
};
