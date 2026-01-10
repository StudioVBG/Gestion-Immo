export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/helpers/auth-helper";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/dlq - Liste des événements dans la Dead Letter Queue
 */
export async function GET(request: Request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Vérifier que l'utilisateur est admin
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";
    const eventType = url.searchParams.get("event_type");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Récupérer les événements
    let query = serviceClient
      .from("failed_events")
      .select("*", { count: "exact" })
      .eq("resolution_status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    const { data: events, error: fetchError, count } = await query;

    if (fetchError) {
      console.error("[GET /api/admin/dlq] Error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Récupérer les statistiques
    const { data: stats } = await serviceClient.rpc("get_dlq_statistics");

    return NextResponse.json({
      events,
      total: count,
      statistics: stats,
      pagination: {
        limit,
        offset,
        hasMore: count ? offset + limit < count : false
      }
    });
  } catch (error: any) {
    console.error("[GET /api/admin/dlq] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/dlq - Actions sur les événements DLQ (retry, ignore, escalate)
 */
export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Vérifier que l'utilisateur est admin
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { action, eventId, notes } = body;

    if (!action || !eventId) {
      return NextResponse.json(
        { error: "action et eventId sont requis" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "retry":
        const { data: retryResult, error: retryError } = await serviceClient.rpc(
          "retry_failed_event",
          { p_failed_event_id: eventId, p_admin_id: profile.id }
        );
        if (retryError) throw retryError;
        result = { success: true, newEventId: retryResult };
        break;

      case "ignore":
        const { data: ignoreResult, error: ignoreError } = await serviceClient.rpc(
          "ignore_failed_event",
          { p_failed_event_id: eventId, p_admin_id: profile.id, p_notes: notes }
        );
        if (ignoreError) throw ignoreError;
        result = { success: ignoreResult };
        break;

      case "escalate":
        if (!notes) {
          return NextResponse.json(
            { error: "notes requises pour escalader" },
            { status: 400 }
          );
        }
        const { data: escalateResult, error: escalateError } = await serviceClient.rpc(
          "escalate_failed_event",
          { p_failed_event_id: eventId, p_admin_id: profile.id, p_notes: notes }
        );
        if (escalateError) throw escalateError;
        result = { success: escalateResult };
        break;

      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 }
        );
    }

    // Log l'action admin
    await serviceClient.from("audit_log").insert({
      profile_id: profile.id,
      action: `dlq_${action}`,
      entity_type: "failed_event",
      entity_id: eventId,
      metadata: { notes }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/admin/dlq] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
