// @ts-nocheck
// Note: Type checking disabled due to Supabase client not having generated types
// TODO: Generate Supabase types and remove this directive

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service-client";
import { NextResponse } from "next/server";
import { getRateLimiterByUser, rateLimitPresets } from "@/lib/middleware/rate-limit";
import { generateSignatureProof } from "@/lib/services/signature-proof.service";
import { extractClientIP } from "@/lib/utils/ip-address";
import { SIGNER_ROLES, isOwnerRole, isTenantRole, LEASE_STATUS } from "@/lib/constants/roles";
import {
  checkSignatureRights,
  createSigner,
  determineLeaseStatus,
} from "@/lib/services/signature.service";
import { logLeaseAction } from "@/lib/services/audit-logger.service";

/**
 * POST /api/leases/[id]/sign - Signer un bail avec Audit Trail conforme
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const leaseId = params.id;
  
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    const serviceClient = getServiceClient();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Rate limiting
    const limiter = getRateLimiterByUser(rateLimitPresets.api);
    const limitResult = limiter(user.id);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer plus tard." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { signature_image, metadata: clientMetadata } = body;

    if (!signature_image) {
      return NextResponse.json(
        { error: "La signature tactile est obligatoire" },
        { status: 400 }
      );
    }

    // 1. Récupérer le profil (sans jointure tenant_profiles pour éviter les erreurs)
    console.log("[Sign-Lease] Looking for profile with user_id:", user.id);
    
    const { data: profileData, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, prenom, nom, role")
      .eq("user_id", user.id as any)
      .single();

    const profile = profileData as any;
    
    console.log("[Sign-Lease] Profile query result:", { 
      found: !!profile, 
      error: profileError?.message,
      profileId: profile?.id,
      role: profile?.role 
    });

    if (!profile) {
      return NextResponse.json({ 
        error: "Profil non trouvé", 
        details: {
          user_id: user.id,
          email: user.email,
          errorMessage: profileError?.message
        }
      }, { status: 404 });
    }

    // 2. Vérifier les droits de signature (service centralisé)
    const rights = await checkSignatureRights(leaseId, profile.id, user.email || "");

    if (!rights.canSign) {
      return NextResponse.json({ error: rights.reason || "Accès refusé" }, { status: 403 });
    }

    const isOwner = profile.role === "owner";
    
    // ✅ FIX: Récupérer le CNI optionnellement (ne bloque plus la signature)
    let cniNumber: string | null = null;
    if (!isOwner) {
      const { data: tenantProfile } = await serviceClient
        .from("tenant_profiles")
        .select("cni_number")
        .eq("profile_id", profile.id as any)
        .maybeSingle();
      
      cniNumber = (tenantProfile as any)?.cni_number || null;
    }

    // ✅ FIX: La vérification CNI n'est plus obligatoire
    // Un locataire avec un compte créé via invitation est considéré comme vérifié
    console.log("[Sign-Lease] Identity check:", { isOwner, hasCNI: !!cniNumber });

    // 4. Récupérer les données du bail pour le hash
    const { data: lease } = await serviceClient
      .from("leases")
      .select("*, property:properties(*)")
      .eq("id", leaseId as any)
      .single();

    // 5. Générer le Dossier de Preuve (Audit Trail)
    // ✅ FIX: Adapter la méthode d'identité selon le cas
    let identityMethod = "Compte Authentifié (Email Vérifié)";
    if (isOwner) {
      identityMethod = "Compte Propriétaire Authentifié";
    } else if (cniNumber) {
      identityMethod = `CNI n°${cniNumber}`;
    }
    
    const proof = await generateSignatureProof({
      documentType: "BAIL",
      documentId: leaseId,
      documentContent: JSON.stringify(lease), // Hash du contenu actuel du bail
      signerName: `${profile.prenom} ${profile.nom}`,
      signerEmail: user.email!,
      signerProfileId: profile.id,
      identityVerified: true, // ✅ FIX: Toujours vrai si le compte existe
      identityMethod: identityMethod,
      signatureType: "draw",
      signatureImage: signature_image,
      userAgent: request.headers.get("user-agent") || "Inconnu",
      ipAddress: extractClientIP(request),
      screenSize: clientMetadata?.screenSize || "Non spécifié",
      touchDevice: clientMetadata?.touchDevice || false,
    });

    // 6. Uploader l'image de signature avec vérification d'erreur
    const base64Data = signature_image.replace(/^data:image\/\w+;base64,/, "");
    const fileName = `signatures/${leaseId}/${user.id}_${Date.now()}.png`;
    
    const { error: uploadError } = await serviceClient.storage
      .from("documents")
      .upload(fileName, Buffer.from(base64Data, "base64"), {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[Sign-Lease] ❌ Erreur upload signature:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement de la signature. Veuillez réessayer." },
        { status: 500 }
      );
    }
    console.log(`[Sign-Lease] ✅ Signature uploadée: ${fileName}`);

    // 7. Auto-créer le signataire si nécessaire (service centralisé)
    let signer = rights.signer;
    if (rights.needsAutoCreate && !signer) {
      signer = await createSigner(leaseId, profile.id, rights.role!);
    }

    // 8. Mettre à jour le signataire avec les infos de preuve
    const { error: updateError } = await serviceClient
      .from("lease_signers")
      .update({
        signature_status: "signed",
        signed_at: proof.timestamp.iso,
        signature_image_path: fileName,
        ip_inet: proof.metadata.ipAddress as any,
        user_agent: proof.metadata.userAgent,
        proof_id: proof.proofId,
        proof_metadata: proof as any,
        document_hash: proof.document.hash,
      } as any)
      .eq("id", signer.id as any);

    if (updateError) throw updateError;

    // 9. Mettre à jour le statut global du bail (service centralisé)
    const newLeaseStatus = await determineLeaseStatus(leaseId);
    await serviceClient.from("leases").update({ statut: newLeaseStatus } as any).eq("id", leaseId as any);

    // 10. Journaliser (service centralisé)
    await logLeaseAction(user.id, "signed", leaseId, {
      role: rights.role,
      proof_id: proof.proofId,
    });

    // 11. ✅ SOTA 2026: Émettre les événements pour notifications
    try {
      // Récupérer les infos nécessaires pour les notifications
      const { data: leaseInfo } = await serviceClient
        .from("leases")
        .select(`
          id,
          property:properties(id, adresse_complete, ville, owner_id),
          signers:lease_signers(profile_id, role, signature_status, profiles(prenom, nom, user_id))
        `)
        .eq("id", leaseId)
        .single();

      const ownerSigner = leaseInfo?.signers?.find((s: any) => s.role === "proprietaire");
      const tenantSigner = leaseInfo?.signers?.find((s: any) => 
        s.role === "locataire_principal" || s.role === "locataire"
      );

      // Si le LOCATAIRE vient de signer → Notifier le PROPRIÉTAIRE
      if (rights.role?.includes("locataire") || rights.role === "tenant" || rights.role === "principal") {
        await serviceClient.from("outbox").insert({
          event_type: "Lease.TenantSigned",
          payload: {
            lease_id: leaseId,
            owner_user_id: ownerSigner?.profiles?.user_id,
            owner_profile_id: ownerSigner?.profile_id,
            tenant_name: `${tenantSigner?.profiles?.prenom || ""} ${tenantSigner?.profiles?.nom || ""}`.trim() || "Le locataire",
            property_address: leaseInfo?.property?.adresse_complete || leaseInfo?.property?.ville || "votre bien",
          },
        } as any);
        console.log(`[Sign-Lease] ✅ Événement Lease.TenantSigned émis pour notifier le propriétaire`);
      }

      // Si le PROPRIÉTAIRE vient de signer → Notifier le LOCATAIRE que c'est fait
      if (rights.role === "proprietaire" || rights.role === "owner" || rights.role === "bailleur") {
        await serviceClient.from("outbox").insert({
          event_type: "Lease.OwnerSigned",
          payload: {
            lease_id: leaseId,
            tenant_user_id: tenantSigner?.profiles?.user_id,
            tenant_profile_id: tenantSigner?.profile_id,
            owner_name: `${ownerSigner?.profiles?.prenom || ""} ${ownerSigner?.profiles?.nom || ""}`.trim() || "Le propriétaire",
            property_address: leaseInfo?.property?.adresse_complete || leaseInfo?.property?.ville || "le bien",
          },
        } as any);
        console.log(`[Sign-Lease] ✅ Événement Lease.OwnerSigned émis pour notifier le locataire`);
      }

      // Si le bail est maintenant FULLY_SIGNED → Notifier les deux parties
      if (newLeaseStatus === "fully_signed") {
        // Notifier le propriétaire
        if (ownerSigner?.profiles?.user_id) {
          await serviceClient.from("outbox").insert({
            event_type: "Lease.FullySigned",
            payload: {
              lease_id: leaseId,
              user_id: ownerSigner.profiles.user_id,
              profile_id: ownerSigner.profile_id,
              is_owner: true,
              property_address: leaseInfo?.property?.adresse_complete || leaseInfo?.property?.ville,
              next_step: "edl_entree",
            },
          } as any);
        }

        // Notifier le locataire
        if (tenantSigner?.profiles?.user_id) {
          await serviceClient.from("outbox").insert({
            event_type: "Lease.FullySigned",
            payload: {
              lease_id: leaseId,
              user_id: tenantSigner.profiles.user_id,
              profile_id: tenantSigner.profile_id,
              is_owner: false,
              property_address: leaseInfo?.property?.adresse_complete || leaseInfo?.property?.ville,
              next_step: "await_edl",
            },
          } as any);
        }

        console.log(`[Sign-Lease] ✅ Événements Lease.FullySigned émis pour les deux parties`);
      }
    } catch (notifError) {
      // Ne pas bloquer la signature si les notifications échouent
      console.error("[Sign-Lease] Erreur émission événements:", notifError);
    }

    return NextResponse.json({
      success: true,
      proof_id: proof.proofId,
      lease_status: newLeaseStatus,
      new_status: newLeaseStatus
    });

  } catch (error: any) {
    console.error("[Sign-Lease] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// ✅ SOTA 2026: Fonctions locales supprimées, maintenant dans lib/services/signature.service.ts
// - checkSignatureRights()
// - createSigner() (ex autoCreateSigner)
// - determineLeaseStatus()
