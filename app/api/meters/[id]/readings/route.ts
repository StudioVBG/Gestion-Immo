export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/meters/[id]/readings - Ajouter un relevé de compteur
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: params must be awaited
    const { id: meterId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le compteur existe et récupérer ses infos
    const { data: meter, error: meterError } = await supabase
      .from("meters")
      .select("id, lease_id, property_id")
      .eq("id", meterId)
      .single();

    if (meterError || !meter) {
      return NextResponse.json(
        { error: "Compteur non trouvé" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const readingValue = parseFloat(formData.get("reading_value") as string);
    const readingDate = formData.get("reading_date") as string;
    const photoFile = formData.get("photo") as File | null;

    if (isNaN(readingValue) || !readingDate) {
      return NextResponse.json(
        { error: "reading_value et reading_date requis" },
        { status: 400 }
      );
    }

    let photoUrl: string | null = null;

    // Si une photo est fournie, l'uploader
    if (photoFile && photoFile.size > 0) {
      const fileName = `meters/${meterId}/${Date.now()}_${photoFile.name}`;
      const { data: uploadData, error: uploadError } =
        await supabase.storage.from("documents").upload(fileName, photoFile, {
          contentType: photoFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        // Continue sans photo si l'upload échoue
      } else {
        photoUrl = uploadData.path;
      }
    }

    // Créer le relevé
    const { data: reading, error } = await supabase
      .from("meter_readings")
      .insert({
        meter_id: meterId,
        reading_value: readingValue,
        reading_date: readingDate,
        photo_url: photoUrl,
        source: photoFile && photoFile.size > 0 ? "ocr" : "manual",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: error.message || "Erreur lors de la création du relevé" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reading });
  } catch (error: unknown) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

