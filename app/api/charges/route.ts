export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/helpers/api-error";
import { z } from "zod";

// Schéma de validation défini localement pour éviter les problèmes de bundling
const chargeSchema = z.object({
  property_id: z.string().uuid(),
  type: z.enum([
    "eau",
    "electricite",
    "copro",
    "taxe",
    "ordures",
    "assurance",
    "travaux",
    "energie",
    "autre",
  ]),
  montant: z.number().positive(),
  periodicite: z.enum(["mensuelle", "trimestrielle", "annuelle"]),
  refacturable_locataire: z.boolean(),
  categorie_charge: z
    .enum([
      "charges_locatives",
      "charges_non_recuperables",
      "taxes",
      "travaux_proprietaire",
      "travaux_locataire",
      "assurances",
      "energie",
    ])
    .optional(),
  eligible_pinel: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id");

    let query = supabase.from("charges").select("*").order("created_at", { ascending: false });

    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ charges: data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validated = chargeSchema.parse(body);

    const { data: charge, error } = await supabase
      .from("charges")
      .insert(validated)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ charge });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

