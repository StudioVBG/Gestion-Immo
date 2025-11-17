import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/helpers/auth-helper";
import { leaseSchema } from "@/lib/validations";
import { z } from "zod";

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

/**
 * PATCH /api/leases/[id] - Mettre à jour un bail
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error, supabase } = await getAuthenticatedUser(request);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 401 }
      );
    }

    if (!user || !supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Valider le body
    const body = await request.json();
    const validated = leaseSchema.partial().parse(body);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY manquante. Configurez la clé service-role.",
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

    // Récupérer le profil
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const profileData = profile as any;

    // Vérifier l'accès au bail
    const { data: lease, error: leaseError } = await serviceClient
      .from("leases")
      .select("id, property_id")
      .eq("id", params.id as any)
      .single();

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 });
    }

    const leaseData = lease as any;

    // Vérifier les permissions (propriétaire ou admin uniquement)
    if (profileData.role !== "admin") {
      if (!leaseData.property_id) {
        return NextResponse.json(
          { error: "Bail invalide (pas de propriété associée)" },
          { status: 400 }
        );
      }

      const { data: property } = await serviceClient
        .from("properties")
        .select("owner_id")
        .eq("id", leaseData.property_id as any)
        .single();

      if (!property || (property as any).owner_id !== profileData.id) {
        return NextResponse.json(
          { error: "Vous n'êtes pas autorisé à modifier ce bail" },
          { status: 403 }
        );
      }
    }

    // Mettre à jour le bail
    const { data: updatedLease, error: updateError } = await serviceClient
      .from("leases")
      .update(validated as any)
      .eq("id", params.id as any)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating lease:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du bail" },
        { status: 500 }
      );
    }

    return NextResponse.json({ lease: updatedLease }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error in PATCH /api/leases/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leases/[id] - Supprimer un bail
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error, supabase } = await getAuthenticatedUser(request);

    if (error) {
      return NextResponse.json(
        { error: error.message },
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
            "SUPABASE_SERVICE_ROLE_KEY manquante. Configurez la clé service-role.",
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

    // Récupérer le profil
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const profileData = profile as any;

    // Vérifier l'accès au bail
    const { data: lease, error: leaseError } = await serviceClient
      .from("leases")
      .select("id, property_id, statut")
      .eq("id", params.id as any)
      .single();

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 });
    }

    const leaseData = lease as any;

    // Vérifier les permissions (propriétaire ou admin uniquement)
    if (profileData.role !== "admin") {
      if (!leaseData.property_id) {
        return NextResponse.json(
          { error: "Bail invalide (pas de propriété associée)" },
          { status: 400 }
        );
      }

      const { data: property } = await serviceClient
        .from("properties")
        .select("owner_id")
        .eq("id", leaseData.property_id as any)
        .single();

      if (!property || (property as any).owner_id !== profileData.id) {
        return NextResponse.json(
          { error: "Vous n'êtes pas autorisé à supprimer ce bail" },
          { status: 403 }
        );
      }
    }

    // Vérifier qu'il n'y a pas de baux actifs (sécurité)
    if (leaseData.statut === "active") {
      return NextResponse.json(
        { error: "Impossible de supprimer un bail actif. Terminez-le d'abord." },
        { status: 400 }
      );
    }

    // Supprimer le bail
    const { error: deleteError } = await serviceClient
      .from("leases")
      .delete()
      .eq("id", params.id as any);

    if (deleteError) {
      console.error("Error deleting lease:", deleteError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression du bail" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error in DELETE /api/leases/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
