import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/helpers/auth-helper";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY manquante. Configurez la clé service-role pour consulter un bail.",
        },
        { status: 500 }
      );
    }

    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    const serviceClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const profileData = profile as any;

    const { data: lease, error: leaseError } = await serviceClient
      .from("leases")
      .select("*")
      .eq("id", params.id as any)
      .single();

    if (leaseError) throw leaseError;
    if (!lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 });
    }

    const leaseData = lease as any;

    if (profileData.role !== "admin") {
      let authorized = false;

      if (leaseData.property_id) {
        const { data: property, error: propertyError } = await serviceClient
          .from("properties")
          .select("owner_id")
          .eq("id", leaseData.property_id as any)
          .single();

        if (propertyError) throw propertyError;

        if (property && (property as any).owner_id === profileData.id) {
          authorized = true;
        }
      }

      if (!authorized) {
        const { data: signers, error: signersError } = await serviceClient
          .from("lease_signers")
          .select("profile_id")
          .eq("lease_id", params.id as any)
          .in("role", ["locataire_principal", "colocataire"]);

        if (signersError) throw signersError;

        authorized = (signers || []).some((s: any) => s.profile_id === profileData.id);
      }

      if (!authorized) {
        return NextResponse.json(
          { error: "Vous n'avez pas accès à ce bail" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ lease });
  } catch (error: any) {
    console.error("Error in GET /api/leases/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}





