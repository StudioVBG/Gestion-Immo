import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/edl/[id]/sections - Ajouter des sections/items à un EDL
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
    const { sections } = body; // Array de { room_name, items: Array<{ item_name, condition, notes }> }

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: "sections requis (array)" },
        { status: 400 }
      );
    }

    // Vérifier que l'EDL appartient à l'utilisateur
    const { data: edl } = await supabase
      .from("edl")
      .select("id, created_by")
      .eq("id", params.id as any)
      .single();

    if (!edl || !("created_by" in edl) || (edl as any).created_by !== user.id) {
      return NextResponse.json(
        { error: "EDL non trouvé ou non autorisé" },
        { status: 403 }
      );
    }

    // Insérer les items
    const itemsToInsert: Array<{
      edl_id: string;
      room_name: string;
      item_name: string;
      condition: string | null;
      notes: string | null;
    }> = [];

    sections.forEach((section: any) => {
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          itemsToInsert.push({
            edl_id: params.id,
            room_name: section.room_name,
            item_name: item.item_name,
            condition: item.condition || null,
            notes: item.notes || null,
          });
        });
      }
    });

    if (itemsToInsert.length === 0) {
      return NextResponse.json(
        { error: "Aucun item à insérer" },
        { status: 400 }
      );
    }

    const { data: insertedItems, error } = await supabase
      .from("edl_items")
      .insert(itemsToInsert as any)
      .select();

    if (error) throw error;

    // Mettre à jour le statut de l'EDL
    await supabase
      .from("edl")
      .update({ status: "in_progress" } as any)
      .eq("id", params.id as any);

    return NextResponse.json({ items: insertedItems });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

