export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { messagingAiService } from "@/features/tickets/services/messaging-ai.service";
import { getAuthenticatedUser } from "@/lib/helpers/auth-helper";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error } = await getAuthenticatedUser(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const draft = await messagingAiService.suggestTicketReply(id, user.id);
    
    return NextResponse.json({ draft });
  } catch (error: unknown) {
    console.error("[API] Draft generation failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Une erreur est survenue" }, { status: 500 });
  }
}

