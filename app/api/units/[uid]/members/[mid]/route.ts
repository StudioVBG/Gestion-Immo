import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/units/[uid]/members/[mid] - Changer le rôle d'un membre de la colocation
 */
export async function PATCH(
  request: Request,
  { params }: { params: { uid: string; mid: string } }
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
    const { role } = body;

    if (!role || !["principal", "tenant", "occupant", "garant"].includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Récupérer le membre
    const { data: member } = await supabase
      .from("roommates")
      .select(`
        *,
        lease:leases!inner(
          id,
          property:properties!inner(owner_id)
        )
      `)
      .eq("id", params.mid)
      .eq("lease_id", (await supabase.from("units").select("property_id").eq("id", params.uid).single()).data?.property_id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id as any)
      .single();

    const memberData = member as any;
    if (memberData.lease?.property?.owner_id !== profile?.id) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier les contraintes (max 2 principaux)
    if (role === "principal") {
      const { data: principals } = await supabase
        .from("roommates")
        .select("id")
        .eq("lease_id", memberData.lease_id)
        .eq("role", "principal")
        .neq("id", params.mid)
        .is("left_on", null);

      if (principals && principals.length >= 2) {
        return NextResponse.json(
          { error: "Maximum 2 colocataires principaux autorisés" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le rôle
    const { data: updated, error } = await supabase
      .from("roommates")
      .update({ role } as any)
      .eq("id", params.mid)
      .select()
      .single();

    if (error) throw error;

    // Émettre un événement
    await supabase.from("outbox").insert({
      event_type: "Cohousing.RoleUpdated",
      payload: {
        roommate_id: params.mid,
        lease_id: memberData.lease_id,
        old_role: memberData.role,
        new_role: role,
      },
    } as any);

    // Journaliser
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "role_updated",
      entity_type: "roommate",
      entity_id: params.mid,
      before_state: { role: memberData.role },
      after_state: { role },
    } as any);

    return NextResponse.json({ member: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}





