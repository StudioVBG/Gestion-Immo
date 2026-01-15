/**
 * API Routes pour les propriétés d'une entité juridique
 * GET /api/owner/legal-entities/[entityId]/properties - Liste les biens de l'entité
 * POST /api/owner/legal-entities/[entityId]/properties - Affecte un bien à l'entité
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPropertiesByEntity,
  createPropertyOwnership,
  transferPropertyOwnership,
} from "@/features/legal-entities/services/legal-entities.service";
import type { CreatePropertyOwnershipDTO } from "@/lib/types/legal-entity";

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
  profileId?: string;
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

  return { authorized: true, profileId: profile.id };
}

/**
 * GET /api/owner/legal-entities/[entityId]/properties
 * Liste les biens détenus par l'entité
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

    const properties = await getPropertiesByEntity(entityId);

    // Calculer les totaux
    const totals = properties.reduce(
      (acc, p) => {
        const prop = p.property as Record<string, unknown> | undefined;
        return {
          count: acc.count + 1,
          totalValue: acc.totalValue + (p.prix_acquisition || 0),
          monthlyRent: acc.monthlyRent + ((prop?.loyer_hc as number) || 0),
          totalSurface: acc.totalSurface + ((prop?.surface as number) || 0),
        };
      },
      { count: 0, totalValue: 0, monthlyRent: 0, totalSurface: 0 }
    );

    return NextResponse.json({
      properties,
      totals,
    });
  } catch (error) {
    console.error("Error in GET entity properties:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/owner/legal-entities/[entityId]/properties
 * Affecte un bien existant à l'entité ou crée une détention
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

    const body: Omit<CreatePropertyOwnershipDTO, "legal_entity_id"> & {
      transfer?: boolean;
      fromEntityId?: string;
    } = await request.json();

    if (!body.property_id) {
      return NextResponse.json(
        { error: "property_id est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le bien appartient au propriétaire
    const supabase = await createClient();
    const { data: property } = await supabase
      .from("properties")
      .select("id, owner_id, legal_entity_id")
      .eq("id", body.property_id)
      .single();

    if (!property) {
      return NextResponse.json(
        { error: "Bien non trouvé" },
        { status: 404 }
      );
    }

    if (property.owner_id !== access.profileId) {
      return NextResponse.json(
        { error: "Ce bien ne vous appartient pas" },
        { status: 403 }
      );
    }

    // Si c'est un transfert d'une entité à une autre
    if (body.transfer && body.fromEntityId) {
      await transferPropertyOwnership(
        body.property_id,
        body.fromEntityId,
        entityId,
        {
          date_cession: body.date_acquisition || new Date().toISOString().split("T")[0],
          prix_acquisition: body.prix_acquisition,
          mode_acquisition: body.mode_acquisition,
          notaire_nom: body.notaire_nom,
          reference_acte: body.reference_acte,
        }
      );

      return NextResponse.json({
        message: "Bien transféré avec succès",
        transferred: true,
      });
    }

    // Sinon, créer une nouvelle détention
    const ownership = await createPropertyOwnership({
      property_id: body.property_id,
      legal_entity_id: entityId,
      detention_type: body.detention_type || "pleine_propriete",
      quote_part_numerateur: body.quote_part_numerateur,
      quote_part_denominateur: body.quote_part_denominateur,
      date_acquisition: body.date_acquisition,
      mode_acquisition: body.mode_acquisition,
      prix_acquisition: body.prix_acquisition,
      frais_acquisition: body.frais_acquisition,
      notaire_nom: body.notaire_nom,
      reference_acte: body.reference_acte,
      finance_par_emprunt: body.finance_par_emprunt,
      montant_emprunt: body.montant_emprunt,
      banque_emprunt: body.banque_emprunt,
    });

    return NextResponse.json(
      { ownership, message: "Bien affecté à l'entité" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST entity properties:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/owner/legal-entities/[entityId]/properties
 * Retire un bien de l'entité (transfert vers détention directe ou autre entité)
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
    const propertyId = searchParams.get("propertyId");
    const targetEntityId = searchParams.get("targetEntityId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId est requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (targetEntityId) {
      // Transfert vers une autre entité
      await transferPropertyOwnership(propertyId, entityId, targetEntityId, {
        date_cession: new Date().toISOString().split("T")[0],
        mode_cession: "apport_societe",
      });

      return NextResponse.json({
        message: "Bien transféré vers l'autre entité",
      });
    }

    // Sinon, retirer de l'entité (retour en détention directe)
    // Marquer l'ownership actuel comme non-current
    await supabase
      .from("property_ownership")
      .update({
        is_current: false,
        date_cession: new Date().toISOString().split("T")[0],
        mode_cession: "vente",
      })
      .eq("property_id", propertyId)
      .eq("legal_entity_id", entityId)
      .eq("is_current", true);

    // Mettre à jour la propriété
    await supabase
      .from("properties")
      .update({
        legal_entity_id: null,
        detention_mode: "direct",
      })
      .eq("id", propertyId);

    return NextResponse.json({
      message: "Bien retiré de l'entité (retour en détention directe)",
    });
  } catch (error) {
    console.error("Error in DELETE entity properties:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
