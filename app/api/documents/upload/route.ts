export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

// @ts-nocheck
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/helpers/auth-helper";
import { createClient } from "@supabase/supabase-js";
import {
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  validateFile,
  generateSecureFilename,
} from "@/lib/constants/file-upload";
import { isValidUUID } from "@/lib/utils/path-validation";

/**
 * POST /api/documents/upload - Upload un document
 * Route de compatibilité pour les anciens appels
 */
export async function POST(request: Request) {
  try {
    const { user, error, supabase } = await getAuthenticatedUser(request);

    if (error || !user || !supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const propertyId = formData.get("property_id") as string | null;
    const leaseId = formData.get("lease_id") as string | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // ✅ Utilisation des constantes centralisées
    const validation = validateFile(file, "DOCUMENTS");
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // ✅ Validation UUID centralisée
    if (propertyId && !isValidUUID(propertyId)) {
      return NextResponse.json({ error: "property_id invalide" }, { status: 400 });
    }
    if (leaseId && !isValidUUID(leaseId)) {
      return NextResponse.json({ error: "lease_id invalide" }, { status: 400 });
    }

    // Traitement de l'upload
    // ou implémenter la logique d'upload ici
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante" },
        { status: 500 }
      );
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Récupérer le profil
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    // ✅ Utiliser le générateur de nom de fichier centralisé
    const fileName = generateSecureFilename(file.name);
    const filePath = propertyId
      ? `properties/${propertyId}/${fileName}`
      : `documents/${fileName}`;

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[POST /api/documents/upload] Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Erreur lors de l'upload" },
        { status: 500 }
      );
    }

    // Créer l'entrée dans la table documents
    const { data: document, error: docError } = await serviceClient
      .from("documents")
      .insert({
        property_id: propertyId || null,
        lease_id: leaseId || null,
        type: type || "autre",
        storage_path: filePath,
        created_by_profile_id: profile.id,
      })
      .select()
      .single();

    if (docError) {
      console.error("[POST /api/documents/upload] Document creation error:", docError);
      // Nettoyer le fichier uploadé en cas d'erreur
      await serviceClient.storage.from("documents").remove([filePath]);
      return NextResponse.json(
        { error: docError.message || "Erreur lors de la création du document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/documents/upload] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

