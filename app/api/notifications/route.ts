import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/notifications - Liste des notifications de l'utilisateur
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id as any)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.is("read_at", null);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications - Marquer une notification comme lue
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id, read } = body;

    if (!notification_id) {
      return NextResponse.json(
        { error: "notification_id requis" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (read !== undefined) {
      updates.read_at = read ? new Date().toISOString() : null;
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .update(updates)
      .eq("id", notification_id)
      .eq("user_id", user.id as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notification });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

