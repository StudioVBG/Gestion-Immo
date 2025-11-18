import { NextResponse } from "next/server";
import { ticketSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/helpers/auth-helper";
import { handleApiError } from "@/lib/helpers/api-error";
import { createClient } from "@supabase/supabase-js";
import type { ProfileRow, TicketRow } from "@/lib/supabase/typed-client";

/**
 * GET /api/tickets - Récupérer les tickets de l'utilisateur
 * Configuration Vercel: maxDuration: 10s
 */
export const maxDuration = 10;

export async function GET(request: Request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);

    if (error) {
      return NextResponse.json(
        { error: error.message, details: (error as any).details },
        { status: error.status || 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Utiliser le service client pour éviter les problèmes RLS
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY manquante" },
        { status: 500 }
      );
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Récupérer le profil avec service client
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const profileData = profile as any;

    // Récupérer les tickets selon le rôle avec service client
    let tickets: TicketRow[] | undefined;
    if (profileData.role === "admin") {
      // Les admins voient tous les tickets
      const { data, error } = await serviceClient
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      tickets = (data as TicketRow[] | null) ?? undefined;
    } else if (profileData.role === "owner") {
      // Les propriétaires voient les tickets de leurs propriétés
      const { data: properties, error: propertiesError } = await serviceClient
        .from("properties")
        .select("id")
        .eq("owner_id", profileData.id);

      if (propertiesError) throw propertiesError;
      if (!properties || properties.length === 0) {
        tickets = [];
      } else {
        const propertyIds = properties.map((p) => p.id);
        const { data, error } = await serviceClient
          .from("tickets")
          .select("*")
          .in("property_id", propertyIds)
          .order("created_at", { ascending: false });

        if (error) throw error;
        tickets = data ? (data as TicketRow[]) : undefined;
      }
    } else if (profileData.role === "tenant") {
      // Les locataires voient les tickets de leurs baux ou créés par eux
      const { data: signers, error: signersError } = await serviceClient
        .from("lease_signers")
        .select("lease_id")
        .eq("profile_id", profileData.id)
        .in("role", ["locataire_principal", "colocataire"]);

      if (signersError) throw signersError;
      if (!signers || signers.length === 0) {
        // Pas de baux, seulement les tickets créés par le locataire
        const { data, error } = await serviceClient
          .from("tickets")
          .select("*")
          .eq("created_by_profile_id", profileData.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        tickets = data ? (data as TicketRow[]) : undefined;
      } else {
        const leaseIds = signers.map((s) => s.lease_id);
        const { data, error } = await serviceClient
          .from("tickets")
          .select("*")
          .or(`lease_id.in.(${leaseIds.join(",")}),created_by_profile_id.eq.${profileData.id}`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        tickets = data ? (data as TicketRow[]) : undefined;
      }
    } else {
      tickets = [];
    }

    // Ajouter des headers de cache pour réduire la charge CPU
    return NextResponse.json(
      { tickets: tickets || [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error("[GET /api/tickets] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets - Créer un nouveau ticket
 */
export async function POST(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);

    if (authError) {
      return NextResponse.json(
        { error: authError.message, details: (authError as any).details },
        { status: authError.status || 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validated = ticketSchema.parse(body);

    // Utiliser le service client pour éviter les problèmes RLS
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY manquante" },
        { status: 500 }
      );
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Récupérer le profil avec service client
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const profileData = profile as any;

    // Créer le ticket avec service client
    const { data: ticket, error: insertError } = await serviceClient
      .from("tickets")
      .insert({
        ...validated,
        created_by_profile_id: profileData.id,
        statut: "open",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Émettre un événement
    await serviceClient.from("outbox").insert({
      event_type: "Ticket.Opened",
      payload: {
        ticket_id: ticket.id,
        property_id: validated.property_id,
        priority: validated.priorite,
      },
    } as any);

    // Journaliser
    await serviceClient.from("audit_log").insert({
      user_id: user.id,
      action: "ticket_created",
      entity_type: "ticket",
      entity_id: ticket.id,
      metadata: { priority: validated.priorite },
    } as any);

    return NextResponse.json({ ticket });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

