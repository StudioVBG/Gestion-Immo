export const runtime = 'nodejs';

// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getRateLimiterByUser, rateLimitPresets } from "@/lib/middleware/rate-limit";
import { decode } from "base64-arraybuffer";

/**
 * POST /api/edl/[id]/sign - Signer un EDL
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
    const { signature: signatureBase64 } = body;

    if (!signatureBase64) {
      return NextResponse.json(
        { error: "La signature tactile est obligatoire" },
        { status: 400 }
      );
    }

    // Rate limiting pour les signatures
    const limiter = getRateLimiterByUser(rateLimitPresets.api);
    const limitResult = limiter(user.id);
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: "Trop de requêtes. Veuillez réessayer plus tard.",
          resetAt: limitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitPresets.api.maxRequests.toString(),
            "X-RateLimit-Remaining": limitResult.remaining.toString(),
            "X-RateLimit-Reset": limitResult.resetAt.toString(),
          },
        }
      );
    }

    // Récupérer le profil pour déterminer le rôle
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    const signerRole = profile.role === "owner" ? "owner" : "tenant";

    // 1. Uploader l'image de signature dans Storage
    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
    // Chemin compatible avec la RLS : edl/{edl_id}/signatures/{user_id}_{timestamp}.png
    const fileName = `edl/${params.id}/signatures/${user.id}_${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, decode(base64Data), {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[sign-edl] Storage upload error:", uploadError);
      throw new Error("Erreur lors de l'enregistrement de l'image de signature");
    }

    // 2. Chercher une entrée de signature existante (créée lors de l'invitation)
    const { data: existingSignature } = await supabase
      .from("edl_signatures")
      .select("id")
      .eq("edl_id", params.id)
      .eq("signer_profile_id", profile.id)
      .maybeSingle();

    let signature;
    let error;

    if (existingSignature) {
      // Mettre à jour l'entrée existante
      const result = await supabase
        .from("edl_signatures")
        .update({
          signed_at: new Date().toISOString(),
          signature_image_path: fileName,
          ip_inet: request.headers.get("x-forwarded-for") || null,
          user_agent: request.headers.get("user-agent") || null,
        } as any)
        .eq("id", existingSignature.id)
        .select()
        .single();
      
      signature = result.data;
      error = result.error;
    } else {
      // Créer une nouvelle entrée si aucune n'existe
      const result = await supabase
        .from("edl_signatures")
        .insert({
          edl_id: params.id,
          signer_user: user.id,
          signer_role: signerRole,
          signer_profile_id: profile.id,
          signed_at: new Date().toISOString(),
          signature_image_path: fileName,
          ip_inet: request.headers.get("x-forwarded-for") || null,
          user_agent: request.headers.get("user-agent") || null,
        } as any)
        .select()
        .single();
      
      signature = result.data;
      error = result.error;
    }

    if (error) throw error;

    // 3. Vérifier si tous les signataires ont signé pour mettre à jour le statut
    const { data: allSignatures } = await supabase
      .from("edl_signatures")
      .select("signer_role, signature_image_path, signed_at")
      .eq("edl_id", params.id);

    // Vérifier que les signatures sont RÉELLES (avec image de signature)
    const hasOwner = allSignatures?.some(
      (s: any) => (s.signer_role === "owner" || s.signer_role === "proprietaire") 
        && s.signature_image_path && s.signed_at
    );
    const hasTenant = allSignatures?.some(
      (s: any) => (s.signer_role === "tenant" || s.signer_role === "locataire") 
        && s.signature_image_path && s.signed_at
    );

    if (hasOwner && hasTenant) {
      await supabase
        .from("edl")
        .update({ status: "signed" } as any)
        .eq("id", params.id);

      // Émettre un événement
      await supabase.from("outbox").insert({
        event_type: "Inspection.Signed",
        payload: {
          edl_id: params.id,
          all_signed: true,
        },
      } as any);
    }

    // Journaliser
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "edl_signed",
      entity_type: "edl",
      entity_id: params.id,
      metadata: { signer_role: signerRole, signature_path: fileName },
    } as any);

    return NextResponse.json({ signature });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

