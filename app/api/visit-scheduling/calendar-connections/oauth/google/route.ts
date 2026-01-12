/**
 * Google Calendar OAuth Flow
 *
 * GET: Initiate OAuth flow (redirect to Google)
 * Callback handled by /api/auth/callback/google
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTypedSupabaseClient } from "@/lib/helpers/supabase-client";

export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL}/api/visit-scheduling/calendar-connections/oauth/google/callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

/**
 * GET /api/visit-scheduling/calendar-connections/oauth/google
 * Initiate Google OAuth flow
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const client = getTypedSupabaseClient(supabase);
    const { data: { user } } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: "Configuration Google Calendar manquante" },
        { status: 500 }
      );
    }

    // Generate state token for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    })).toString("base64");

    // Build OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error: any) {
    console.error("Google OAuth init error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
