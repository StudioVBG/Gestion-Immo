import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/tickets/[tid]/quotes/[qid]/reject - Rejeter un devis
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est propriétaire du logement
    const { data: ticket } = await supabase
      .from("tickets")
      .select(`
        id,
        property:properties!inner(owner_id)
      `)
      .eq("id", params.id)
      .single();

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket non trouvé" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    const ticketData = ticket as any;
    const isAdmin = profile?.role === "admin";
    const isOwner = ticketData.property?.owner_id === profile?.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut rejeter un devis" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    // Vérifier que le devis existe et est en attente
    const { data: quote } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", params.qid)
      .eq("ticket_id", params.id)
      .single();

    if (!quote) {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }

    if ((quote as any).status !== "pending") {
      return NextResponse.json(
        { error: "Ce devis a déjà été traité" },
        { status: 400 }
      );
    }

    // Rejeter le devis
    const { data: updatedQuote, error } = await supabase
      .from("quotes")
      .update({
        status: "rejected",
        rejected_reason: reason || null,
      } as any)
      .eq("id", params.qid)
      .select()
      .single();

    if (error) throw error;

    // Émettre un événement
    await supabase.from("outbox").insert({
      event_type: "Quote.Rejected",
      payload: {
        quote_id: params.qid,
        ticket_id: params.id,
        rejected_by: user.id,
        reason,
      },
    } as any);

    // Journaliser
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "quote_rejected",
      entity_type: "quote",
      entity_id: params.qid,
      metadata: { ticket_id: params.id, reason },
    } as any);

    return NextResponse.json({ quote: updatedQuote });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

