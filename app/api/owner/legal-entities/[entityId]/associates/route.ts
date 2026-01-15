/**
 * API Routes pour les associés d'une entité juridique
 * GET /api/owner/legal-entities/[entityId]/associates - Liste les associés
 * POST /api/owner/legal-entities/[entityId]/associates - Ajoute un associé
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getEntityAssociates,
  createEntityAssociate,
  updateEntityAssociate,
  removeEntityAssociate,
} from "@/features/legal-entities/services/legal-entities.service";
import type { CreateEntityAssociateDTO } from "@/lib/types/legal-entity";
import { ENTITIES_MIN_2_ASSOCIATES } from "@/lib/types/legal-entity";

interface RouteParams {
  params: Promise<{ entityId: string }>;
}

/**
 * Vérifie l'accès à l'entité
 */
async function verifyAccess(entityId: string): Promise<{
  authorized: boolean;
  error?: string;
  status?: number;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: "Non authentifié", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return { authorized: false, error: "Accès réservé aux propriétaires", status: 403 };
  }

  const { data: entity } = await supabase
    .from("legal_entities")
    .select("owner_profile_id")
    .eq("id", entityId)
    .single();

  if (!entity) {
    return { authorized: false, error: "Entité non trouvée", status: 404 };
  }

  if (entity.owner_profile_id !== profile.id) {
    return { authorized: false, error: "Accès non autorisé", status: 403 };
  }

  return { authorized: true };
}

/**
 * GET /api/owner/legal-entities/[entityId]/associates
 * Liste les associés d'une entité
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { entityId } = await params;

    const access = await verifyAccess(entityId);
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const currentOnly = searchParams.get("current") !== "false";
    const gerantsOnly = searchParams.get("gerants") === "true";

    const associates = await getEntityAssociates(entityId, {
      currentOnly,
      gerantsOnly,
    });

    // Calculer les totaux
    const totalParts = associates.reduce((sum, a) => sum + a.nombre_parts, 0);
    const totalPourcentage = associates.reduce(
      (sum, a) => sum + (a.pourcentage_capital || 0),
      0
    );

    return NextResponse.json({
      associates,
      count: associates.length,
      totals: {
        parts: totalParts,
        pourcentage: totalPourcentage,
      },
    });
  } catch (error) {
    console.error("Error in GET associates:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/owner/legal-entities/[entityId]/associates
 * Ajoute un nouvel associé
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { entityId } = await params;

    const access = await verifyAccess(entityId);
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const body: Omit<CreateEntityAssociateDTO, "legal_entity_id"> =
      await request.json();

    // Validation
    if (!body.nombre_parts || body.nombre_parts <= 0) {
      return NextResponse.json(
        { error: "Le nombre de parts doit être positif" },
        { status: 400 }
      );
    }

    // Vérifier qu'on a une identité
    const hasIdentity =
      body.profile_id ||
      body.parent_entity_id ||
      (body.nom && body.prenom) ||
      body.denomination_sociale;

    if (!hasIdentity) {
      return NextResponse.json(
        { error: "Une identité est requise (profil, entité parente ou nom/prénom)" },
        { status: 400 }
      );
    }

    const associate = await createEntityAssociate({
      legal_entity_id: entityId,
      ...body,
    });

    return NextResponse.json(
      { associate, message: "Associé ajouté avec succès" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST associates:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/owner/legal-entities/[entityId]/associates
 * Met à jour un associé (associateId dans le body)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { entityId } = await params;

    const access = await verifyAccess(entityId);
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const body = await request.json();
    const { associateId, ...updateData } = body;

    if (!associateId) {
      return NextResponse.json(
        { error: "associateId est requis" },
        { status: 400 }
      );
    }

    const associate = await updateEntityAssociate(associateId, updateData);

    return NextResponse.json({
      associate,
      message: "Associé mis à jour",
    });
  } catch (error) {
    console.error("Error in PATCH associates:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/owner/legal-entities/[entityId]/associates
 * Retire un associé (associateId en query param)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { entityId } = await params;

    const access = await verifyAccess(entityId);
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const associateId = searchParams.get("associateId");
    const motif = searchParams.get("motif") || undefined;

    if (!associateId) {
      return NextResponse.json(
        { error: "associateId est requis" },
        { status: 400 }
      );
    }

    // Vérifier qu'il restera au moins 2 associés si nécessaire
    const supabase = await createClient();
    const { data: entity } = await supabase
      .from("legal_entities")
      .select("entity_type")
      .eq("id", entityId)
      .single();

    if (entity && ENTITIES_MIN_2_ASSOCIATES.includes(entity.entity_type)) {
      const { count } = await supabase
        .from("entity_associates")
        .select("id", { count: "exact", head: true })
        .eq("legal_entity_id", entityId)
        .eq("is_current", true);

      if (count && count <= 2) {
        return NextResponse.json(
          {
            error: `Une ${entity.entity_type.toUpperCase()} doit avoir au minimum 2 associés`,
          },
          { status: 400 }
        );
      }
    }

    await removeEntityAssociate(associateId, motif);

    return NextResponse.json({
      message: "Associé retiré avec succès",
    });
  } catch (error) {
    console.error("Error in DELETE associates:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
