import { NextResponse } from "next/server";
import { invoiceSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/helpers/auth-helper";

/**
 * GET /api/invoices - Récupérer les factures de l'utilisateur
 */
export async function GET(request: Request) {
  try {
    const { user, error, supabase } = await getAuthenticatedUser(request);

    if (error) {
      return NextResponse.json(
        { error: error.message, details: (error as any).details },
        { status: error.status || 401 }
      );
    }

    if (!user || !supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer le profil
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile || !("role" in profile)) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    // Récupérer les factures selon le rôle
    let invoices: any[] | undefined;
    const supabaseClient = supabase as any;
    if ((profile as any).role === "admin") {
      // Les admins voient toutes les factures
      const { data, error } = await supabaseClient
        .from("invoices")
        .select("*")
        .order("periode", { ascending: false });

      if (error) throw error;
      invoices = data;
    } else if ((profile as any).role === "owner") {
      // Les propriétaires voient leurs factures
      const { data, error } = await supabaseClient
        .from("invoices")
        .select("*")
        .eq("owner_id", (profile as any).id)
        .order("periode", { ascending: false });

      if (error) throw error;
      invoices = data;
    } else if ((profile as any).role === "tenant") {
      // Les locataires voient leurs factures
      const { data, error } = await supabaseClient
        .from("invoices")
        .select("*")
        .eq("tenant_id", (profile as any).id)
        .order("periode", { ascending: false });

      if (error) throw error;
      invoices = data;
    } else {
      invoices = [];
    }

    return NextResponse.json({ invoices: invoices || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices - Créer une nouvelle facture
 */
export async function POST(request: Request) {
  try {
    const { user, error, supabase } = await getAuthenticatedUser(request);

    if (error) {
      return NextResponse.json(
        { error: error.message, details: (error as any).details },
        { status: error.status || 401 }
      );
    }

    if (!user || !supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validated = invoiceSchema.parse(body);

    // Récupérer le profil
    const supabaseClient = supabase as any;
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile || !("role" in profile) || (profile as any).role !== "owner") {
      return NextResponse.json(
        { error: "Seuls les propriétaires peuvent créer des factures" },
        { status: 403 }
      );
    }

    // Récupérer le bail
    const { data: lease, error: leaseError } = await supabaseClient
      .from("leases")
      .select("*")
      .eq("id", validated.lease_id as any)
      .single();

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 });
    }

    // Récupérer la propriété pour obtenir le propriétaire
    if (!lease || !("property_id" in lease) || !(lease as any).property_id) {
      return NextResponse.json(
        { error: "Le bail n'a pas de propriété associée" },
        { status: 400 }
      );
    }

    const { data: property, error: propertyError } = await supabaseClient
      .from("properties")
      .select("owner_id")
      .eq("id", (lease as any).property_id as any)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Propriété non trouvée" }, { status: 404 });
    }

    // Vérifier que le propriétaire correspond
    if ((property as any).owner_id !== (profile as any).id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas propriétaire de ce bail" },
        { status: 403 }
      );
    }

    // Trouver le locataire principal
    const { data: signers, error: signersError } = await supabaseClient
      .from("lease_signers")
      .select("profile_id")
      .eq("lease_id", validated.lease_id as any)
      .eq("role", "locataire_principal" as any)
      .single();

    if (signersError || !signers) {
      return NextResponse.json(
        { error: "Locataire principal non trouvé" },
        { status: 404 }
      );
    }

    // Calculer le montant total
    const montant_total = validated.montant_loyer + validated.montant_charges;

    // Créer la facture
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .insert({
        lease_id: validated.lease_id,
        owner_id: (property as any).owner_id,
        tenant_id: (signers as any).profile_id,
        periode: validated.periode,
        montant_loyer: validated.montant_loyer,
        montant_charges: validated.montant_charges,
        montant_total,
        statut: "draft",
      } as any)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Émettre un événement
    await supabaseClient.from("outbox").insert({
      event_type: "Rent.InvoiceIssued",
      payload: {
        invoice_id: invoice.id,
        lease_id: validated.lease_id,
        periode: validated.periode,
        montant_total: montant_total,
      },
    } as any);

    // Journaliser
    await supabaseClient.from("audit_log").insert({
      user_id: user.id,
      action: "invoice_created",
      entity_type: "invoice",
      entity_id: invoice.id,
      metadata: { periode: validated.periode, montant_total: montant_total },
    } as any);

    return NextResponse.json({ invoice });
  } catch (error: any) {
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

