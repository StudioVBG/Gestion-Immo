/**
 * Google Calendar OAuth Callback
 *
 * Handles the redirect from Google after user authorization
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTypedSupabaseClient } from "@/lib/helpers/supabase-client";

export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL}/api/visit-scheduling/calendar-connections/oauth/google/callback`;

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
}

/**
 * GET /api/visit-scheduling/calendar-connections/oauth/google/callback
 * Handle OAuth callback from Google
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${appUrl}/owner/visits?error=google_auth_failed`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/owner/visits?error=missing_params`
      );
    }

    // Verify state and extract user info
    let stateData: { userId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      return NextResponse.redirect(
        `${appUrl}/owner/visits?error=invalid_state`
      );
    }

    // Check state timestamp (5 min expiry)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(
        `${appUrl}/owner/visits?error=state_expired`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        `${appUrl}/owner/visits?error=token_exchange_failed`
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get primary calendar info
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=10",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    let primaryCalendar: GoogleCalendar | null = null;
    if (calendarResponse.ok) {
      const calendars = await calendarResponse.json();
      primaryCalendar = calendars.items?.find((c: GoogleCalendar) => c.primary) ||
        calendars.items?.[0];
    }

    // Save connection to database
    const supabase = await createClient();
    const client = getTypedSupabaseClient(supabase);

    // Get profile
    const { data: profile } = await client
      .from("profiles")
      .select("id")
      .eq("user_id", stateData.userId as any)
      .single();

    if (!profile) {
      return NextResponse.redirect(
        `${appUrl}/owner/visits?error=profile_not_found`
      );
    }

    // Upsert calendar connection
    const { error: upsertError } = await client
      .from("calendar_connections")
      .upsert({
        owner_id: (profile as any).id,
        provider: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        calendar_id: primaryCalendar?.id || "primary",
        calendar_name: primaryCalendar?.summary || "Google Calendar",
        sync_enabled: true,
      } as any, {
        onConflict: "owner_id,provider",
      });

    if (upsertError) {
      console.error("Failed to save connection:", upsertError);
      return NextResponse.redirect(
        `${appUrl}/owner/visits?error=save_failed`
      );
    }

    return NextResponse.redirect(
      `${appUrl}/owner/visits?success=google_connected`
    );
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/owner/visits?error=unknown`
    );
  }
}
