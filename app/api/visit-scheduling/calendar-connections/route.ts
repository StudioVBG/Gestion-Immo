/**
 * API: Calendar Connections
 *
 * Manage external calendar connections (Google Calendar, Outlook)
 * for syncing visit slots with owner's personal calendar.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTypedSupabaseClient } from "@/lib/helpers/supabase-client";
import { createCalendarConnectionSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/**
 * GET /api/visit-scheduling/calendar-connections
 * List all calendar connections for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const client = getTypedSupabaseClient(supabase);
    const { data: { user } } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await client
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile || (profile as any).role !== "owner") {
      return NextResponse.json(
        { error: "Accès réservé aux propriétaires" },
        { status: 403 }
      );
    }

    // Get calendar connections
    const { data: connections, error } = await client
      .from("calendar_connections")
      .select("*")
      .eq("owner_id", (profile as any).id as any)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Mask sensitive tokens
    const safeConnections = (connections || []).map((conn: any) => ({
      id: conn.id,
      provider: conn.provider,
      calendar_id: conn.calendar_id,
      calendar_name: conn.calendar_name,
      sync_enabled: conn.sync_enabled,
      last_sync_at: conn.last_sync_at,
      created_at: conn.created_at,
      // Don't expose tokens
    }));

    return NextResponse.json({ connections: safeConnections });
  } catch (error: any) {
    console.error("GET /api/calendar-connections error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/visit-scheduling/calendar-connections
 * Create a new calendar connection (after OAuth flow)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const client = getTypedSupabaseClient(supabase);
    const { data: { user } } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await client
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile || (profile as any).role !== "owner") {
      return NextResponse.json(
        { error: "Accès réservé aux propriétaires" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createCalendarConnectionSchema.parse(body);

    // Check if connection already exists for this provider
    const { data: existing } = await client
      .from("calendar_connections")
      .select("id")
      .eq("owner_id", (profile as any).id as any)
      .eq("provider", validated.provider as any)
      .single();

    if (existing) {
      // Update existing connection
      const { data: updated, error } = await client
        .from("calendar_connections")
        .update({
          access_token: validated.access_token,
          refresh_token: validated.refresh_token,
          token_expires_at: validated.token_expires_at,
          calendar_id: validated.calendar_id,
          calendar_name: validated.calendar_name,
          sync_enabled: true,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", (existing as any).id as any)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        connection: {
          id: (updated as any).id,
          provider: (updated as any).provider,
          calendar_name: (updated as any).calendar_name,
          sync_enabled: (updated as any).sync_enabled,
        },
        message: "Connexion mise à jour",
      });
    }

    // Create new connection
    const { data: connection, error } = await client
      .from("calendar_connections")
      .insert({
        owner_id: (profile as any).id,
        provider: validated.provider,
        access_token: validated.access_token,
        refresh_token: validated.refresh_token,
        token_expires_at: validated.token_expires_at,
        calendar_id: validated.calendar_id,
        calendar_name: validated.calendar_name,
        sync_enabled: true,
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      connection: {
        id: (connection as any).id,
        provider: (connection as any).provider,
        calendar_name: (connection as any).calendar_name,
        sync_enabled: (connection as any).sync_enabled,
      },
      message: "Calendrier connecté avec succès",
    });
  } catch (error: any) {
    console.error("POST /api/calendar-connections error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/visit-scheduling/calendar-connections
 * Remove a calendar connection
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const client = getTypedSupabaseClient(supabase);
    const { data: { user } } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("id");

    if (!connectionId) {
      return NextResponse.json(
        { error: "ID de connexion requis" },
        { status: 400 }
      );
    }

    // Get profile
    const { data: profile } = await client
      .from("profiles")
      .select("id")
      .eq("user_id", user.id as any)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    // Delete connection (RLS will ensure ownership)
    const { error } = await client
      .from("calendar_connections")
      .delete()
      .eq("id", connectionId as any)
      .eq("owner_id", (profile as any).id as any);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Connexion supprimée",
    });
  } catch (error: any) {
    console.error("DELETE /api/calendar-connections error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
