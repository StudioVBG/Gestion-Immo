import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/threads - Créer un fil de discussion
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { context_type, context_id, title } = body; // context_type: 'property' | 'unit' | 'ticket' | 'lease'

    if (!context_type || !context_id || !title) {
      return NextResponse.json(
        { error: "context_type, context_id et title requis" },
        { status: 400 }
      );
    }

    // Vérifier l'accès selon le contexte
    let hasAccess = false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id as any)
      .single();

    switch (context_type) {
      case "property": {
        const { data: property } = await supabase
          .from("properties")
          .select("owner_id")
          .eq("id", context_id)
          .single();
        hasAccess = property?.owner_id === profile?.id;
        break;
      }
      case "lease": {
        const { data: roommate } = await supabase
          .from("roommates")
          .select("id")
          .eq("lease_id", context_id)
          .eq("user_id", user.id as any)
          .maybeSingle();
        hasAccess = !!roommate;
        break;
      }
      case "ticket": {
        const { data: ticket } = await supabase
          .from("tickets")
          .select(`
            property:properties!inner(owner_id),
            lease:leases(roommates(user_id))
          `)
          .eq("id", context_id)
          .single();
        const ticketData = ticket as any;
        hasAccess = ticketData?.property?.owner_id === profile?.id ||
          ticketData?.lease?.roommates?.some((r: any) => r.user_id === user.id);
        break;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Créer le fil
    const { data: thread, error } = await supabase
      .from("chat_threads")
      .insert({
        context_type,
        context_id,
        title,
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ thread });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}





