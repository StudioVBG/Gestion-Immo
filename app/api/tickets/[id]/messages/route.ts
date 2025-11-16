import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/tickets/[id]/messages - Récupérer les messages d'un ticket
 */
export async function GET(
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

    const ticketId = params.id;

    // Vérifier l'accès au ticket
    const { data: ticket } = await supabase
      .from("tickets")
      .select("id, lease_id, created_by_profile_id")
      .eq("id", ticketId)
      .single();

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id as any)
      .single();

    const isOwnerOrAdmin = profile?.role === "owner" || profile?.role === "admin";
    const isCreator = ticket.created_by_profile_id === profile?.id;

    // Vérifier si membre du bail
    let hasAccess = isOwnerOrAdmin || isCreator;
    if (ticket.lease_id) {
      const { data: roommate } = await supabase
        .from("roommates")
        .select("id")
        .eq("lease_id", ticket.lease_id)
        .eq("user_id", user.id as any)
        .maybeSingle();
      hasAccess = hasAccess || !!roommate;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer les messages
    const { data: messages, error } = await supabase
      .from("ticket_messages")
      .select(`
        *,
        sender:profiles!ticket_messages_sender_user_fkey(prenom, nom, avatar_url)
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Filtrer les messages internes si l'utilisateur n'est pas owner/admin
    const filteredMessages = isOwnerOrAdmin
      ? messages
      : messages?.filter((m: any) => !m.is_internal);

    return NextResponse.json({ messages: filteredMessages });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets/[id]/messages - Envoyer un message dans un ticket
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

    const ticketId = params.id;
    const body = await request.json();
    const { body: messageBody, attachments = [], is_internal = false } = body;

    if (!messageBody) {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Vérifier l'accès au ticket (même logique que GET)
    const { data: ticket } = await supabase
      .from("tickets")
      .select("id, lease_id, created_by_profile_id")
      .eq("id", ticketId)
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

    const isOwnerOrAdmin = profile?.role === "owner" || profile?.role === "admin";
    const isCreator = ticket.created_by_profile_id === profile?.id;

    let hasAccess = isOwnerOrAdmin || isCreator;
    if (ticket.lease_id) {
      const { data: roommate } = await supabase
        .from("roommates")
        .select("id")
        .eq("lease_id", ticket.lease_id)
        .eq("user_id", user.id as any)
        .maybeSingle();
      hasAccess = hasAccess || !!roommate;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Seuls owner/admin peuvent envoyer des messages internes
    if (is_internal && !isOwnerOrAdmin) {
      return NextResponse.json(
        { error: "Seuls les propriétaires et admins peuvent envoyer des messages internes" },
        { status: 403 }
      );
    }

    // Créer le message
    const { data: message, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_user: user.id,
        body: messageBody,
        attachments,
        is_internal,
      } as any)
      .select()
      .single();

    if (error) throw error;

    // Émettre un événement
    await supabase.from("outbox").insert({
      event_type: "ticket.message.created",
      payload: {
        ticket_id: ticketId,
        message_id: message.id,
        sender_user: user.id,
      },
    } as any);

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}





