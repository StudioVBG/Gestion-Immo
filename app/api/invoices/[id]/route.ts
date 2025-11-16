import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { invoiceSchema } from "@/lib/validations";

/**
 * GET /api/invoices/[id] - Récupérer une facture par ID
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

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", params.id as any)
      .single();

    if (error) throw error;
    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invoices/[id] - Mettre à jour une facture
 */
export async function PUT(
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

    const body = await request.json();
    const validated = invoiceSchema.partial().parse(body);

    // Vérifier que l'utilisateur est propriétaire de la facture
    const { data: invoice } = await supabase
      .from("invoices")
      .select("owner_id")
      .eq("id", params.id as any)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile || !("role" in profile) || !("id" in profile) || ((profile as any).role !== "admin" && (profile as any).id !== (invoice as any).owner_id)) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de modifier cette facture" },
        { status: 403 }
      );
    }

    // Recalculer le montant total si nécessaire
    if (validated.montant_loyer !== undefined || validated.montant_charges !== undefined) {
      const { data: currentInvoice } = await supabase
        .from("invoices")
        .select("montant_loyer, montant_charges")
        .eq("id", params.id as any)
        .single();

      if (currentInvoice && "montant_loyer" in currentInvoice && "montant_charges" in currentInvoice) {
        const montant_loyer = validated.montant_loyer ?? (currentInvoice as any).montant_loyer;
        const montant_charges = validated.montant_charges ?? (currentInvoice as any).montant_charges;
        (validated as any).montant_total = montant_loyer + montant_charges;
      }
    }

    const { data: updatedInvoice, error } = await supabase
      .from("invoices")
      .update(validated as any)
      .eq("id", params.id as any)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ invoice: updatedInvoice });
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

/**
 * DELETE /api/invoices/[id] - Supprimer une facture
 */
export async function DELETE(
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

    // Vérifier que l'utilisateur est propriétaire de la facture
    const { data: invoice } = await supabase
      .from("invoices")
      .select("owner_id")
      .eq("id", params.id as any)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile || !("role" in profile) || !("id" in profile) || ((profile as any).role !== "admin" && (profile as any).id !== (invoice as any).owner_id)) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de supprimer cette facture" },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("invoices").delete().eq("id", params.id as any);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

