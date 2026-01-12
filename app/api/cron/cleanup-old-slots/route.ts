/**
 * Cron Job: Cleanup Old Visit Slots
 *
 * Removes old visit slots that are past their date.
 * Runs daily at 3 AM.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Call the database function to cleanup old slots
    const { data, error } = await supabase.rpc("cleanup_old_visit_slots");

    if (error) {
      console.error("[Cleanup Slots] Error:", error);
      return NextResponse.json(
        { error: "Cleanup failed", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[Cleanup Slots] Removed ${data} old slots`);

    return NextResponse.json({
      success: true,
      slotsRemoved: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cleanup Slots] Fatal error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
