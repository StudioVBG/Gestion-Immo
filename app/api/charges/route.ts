import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chargeSchema } from "@/lib/validations";

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
      query = query.eq("property_id", propertyId as any);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ charges: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
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
      .insert(validated as any)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ charge });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}

