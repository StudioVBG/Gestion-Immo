import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Fonction pour chiffrer une clé API avec AES-256-GCM
function encryptAPIKey(apiKey: string, masterKey: string): string {
  const algorithm = "aes-256-gcm";
  const key = crypto.scryptSync(masterKey, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

/**
 * POST /api/admin/api-keys/[id]/rotate - Rotater une clé API
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id as any)
      .single();

    const profileData = profile as any;
    if (profileData?.role !== "admin") {
      return NextResponse.json(
        { error: "Seul l'admin peut rotater des clés API" },
        { status: 403 }
      );
    }

    // Récupérer la clé existante
    const { data: existingKey } = await supabase
      .from("api_credentials")
      .select("*")
      .eq("id", params.id as any)
      .single();

    if (!existingKey) {
      return NextResponse.json(
        { error: "Clé API non trouvée" },
        { status: 404 }
      );
    }

    // Générer une nouvelle clé
    const newApiKey = `sk_${crypto.randomBytes(32).toString("hex")}`;
    const newHashedKey = crypto.createHash("sha256").update(newApiKey).digest("hex");

    // Chiffrer la nouvelle clé
    const masterKey = process.env.API_KEY_MASTER_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 32) || "default-master-key-32-chars!!";
    const encryptedKey = encryptAPIKey(newApiKey, masterKey);

    // Mettre à jour la clé (garder l'ancienne dans l'historique si nécessaire)
    const { data: updated, error } = await supabase
      .from("api_credentials")
      .update({
        key_hash: newHashedKey,
        encrypted_key: encryptedKey,
        rotated_at: new Date().toISOString(),
        rotated_by: user.id,
      } as any)
      .eq("id", params.id as any)
      .select()
      .single();

    if (error) throw error;

    // Émettre un événement
    await supabase.from("outbox").insert({
      event_type: "API.KeyRotated",
      payload: {
        credential_id: params.id,
        rotated_by: user.id,
      },
    } as any);

    // Journaliser
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "api_key_rotated",
      entity_type: "api_credential",
      entity_id: params.id,
    } as any);

    return NextResponse.json({
      credential: updated,
      api_key: newApiKey, // À afficher une seule fois
      warning: "Cette clé ne sera plus affichée. Veuillez la sauvegarder.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

