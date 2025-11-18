import { NextResponse } from "next/server";
import { z } from "zod";
import { propertySchema } from "@/lib/validations";
import { validatePropertyData, safeValidatePropertyData } from "@/lib/validations/property-validator";
import { getAuthenticatedUser } from "@/lib/helpers/auth-helper";

// Configuration de timeout optimisée : 8 secondes max pour éviter la surconsommation CPU
const MAX_REQUEST_TIME = 8000;
const AUTH_TIMEOUT = 2000;
const QUERY_TIMEOUT = 3000;

/**
 * GET /api/properties - Récupérer les propriétés de l'utilisateur
 * Optimisé pour réduire la consommation CPU et éviter les timeouts
 * 
 * Configuration Vercel: maxDuration: 10s
 */
export const maxDuration = 10;

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Authentification avec timeout simple
    const authPromise = getAuthenticatedUser(request);
    const authTimeout = new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({ user: null, error: { message: "Auth timeout", status: 504 }, supabase: null });
      }, AUTH_TIMEOUT);
    });
    
    const { user, error, supabase } = await Promise.race([authPromise, authTimeout]);
    
    if (error || !user || !supabase) {
      return NextResponse.json({ 
        properties: [],
        error: error?.message || "Non authentifié"
      }, { status: error?.status || 401 });
    }

    // Vérifier le temps écoulé
    if (Date.now() - startTime > MAX_REQUEST_TIME - 2000) {
      return NextResponse.json({ 
        properties: [],
        error: "Request timeout"
      }, { status: 504 });
    }

    // Créer le service client une seule fois
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: "SUPABASE_SERVICE_ROLE_KEY manquante",
          properties: []
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

    // Récupérer le profil avec timeout simple
    const profilePromise = serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();
    
    const profileTimeout = new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({ data: null, error: { message: "Timeout" } });
      }, QUERY_TIMEOUT);
    });

    const { data: profile, error: profileError } = await Promise.race([profilePromise, profileTimeout]);

    if (profileError || !profile) {
      return NextResponse.json({ 
        properties: [],
        error: "Profil non trouvé"
      }, { status: 404 });
    }

    const profileData = profile as any;

    // Vérifier le temps écoulé avant les requêtes principales
    if (Date.now() - startTime > MAX_REQUEST_TIME - 3000) {
      return NextResponse.json({ 
        properties: [],
        error: "Request timeout"
      }, { status: 504 });
    }

    // Récupérer les propriétés selon le rôle - requêtes optimisées
    let properties: any[] = [];
    
    try {
      // Colonnes essentielles uniquement pour réduire le temps de traitement
      const essentialColumns = "id, owner_id, type, type_bien, adresse_complete, code_postal, ville, surface, nb_pieces, loyer_base, created_at, etat";
      
      if (profileData.role === "admin") {
        // Admins : limiter à 50 propriétés
        const queryPromise = serviceClient
          .from("properties")
          .select(essentialColumns)
          .order("created_at", { ascending: false })
          .limit(50);

        const { data, error: queryError } = await Promise.race([
          queryPromise,
          new Promise<any>((resolve) => {
            setTimeout(() => resolve({ data: [], error: { message: "Timeout" } }), QUERY_TIMEOUT);
          })
        ]);

        properties = (data || []);
      } else if (profileData.role === "owner") {
        // Propriétaires : leurs propriétés uniquement
        const { data, error } = await serviceClient
          .from("properties")
          .select(essentialColumns)
          .eq("owner_id", profileData.id as any)
          .order("created_at", { ascending: false })
          .limit(100); // Limite augmentée car requête filtrée

        if (error) {
          console.error("[GET /api/properties] Error:", error);
          properties = [];
        } else {
          properties = data || [];
        }
      } else {
        // Locataires : propriétés avec baux actifs
        // Requête optimisée : récupérer les lease_ids puis les property_ids en une seule requête
        const { data: signers, error: signersError } = await Promise.race([
          serviceClient
            .from("lease_signers")
            .select("lease_id")
            .eq("profile_id", profileData.id as any)
            .in("role", ["locataire_principal", "colocataire"] as any)
            .limit(50),
          new Promise<any>((resolve) => {
            setTimeout(() => resolve({ data: [], error: { message: "Timeout" } }), QUERY_TIMEOUT);
          })
        ]);

        if (signersError && signersError.message !== "Timeout") {
          console.error("[GET /api/properties] Error fetching signers:", signersError);
          properties = [];
        } else if (signers && signers.length > 0) {
          const leaseIds = signers.map((s: any) => s.lease_id).filter(Boolean);
          
          // Récupérer les property_ids des baux actifs
          const { data: leases, error: leasesError } = await Promise.race([
            serviceClient
              .from("leases")
              .select("property_id")
              .in("id", leaseIds)
              .eq("statut", "active" as any)
              .limit(50),
            new Promise<any>((resolve) => {
              setTimeout(() => resolve({ data: [], error: { message: "Timeout" } }), QUERY_TIMEOUT);
            })
          ]);

          if (leasesError && leasesError.message !== "Timeout") {
            console.error("[GET /api/properties] Error fetching leases:", leasesError);
            properties = [];
          } else if (leases && leases.length > 0) {
            const propertyIds = [...new Set(leases.map((l: any) => l.property_id).filter(Boolean))];
            
            // Récupérer les propriétés
            const { data, error } = await Promise.race([
              serviceClient
                .from("properties")
                .select(essentialColumns)
                .in("id", propertyIds)
                .limit(50),
              new Promise<any>((resolve) => {
                setTimeout(() => resolve({ data: [], error: { message: "Timeout" } }), QUERY_TIMEOUT);
              })
            ]);

            if (error && error.message !== "Timeout") {
              console.error("[GET /api/properties] Error fetching properties:", error);
              properties = [];
            } else {
              properties = data || [];
            }
          }
        }
      }
    } catch (queryError: any) {
      console.error("[GET /api/properties] Query error:", queryError);
      properties = [];
    }

    const elapsedTime = Date.now() - startTime;
    
    // Log uniquement si > 3 secondes pour réduire les logs
    if (elapsedTime > 3000) {
      console.warn(`[GET /api/properties] Slow request: ${elapsedTime}ms, role: ${profileData.role}, count: ${properties.length}`);
    }
    
    // Retourner une erreur si trop lent
    if (elapsedTime > MAX_REQUEST_TIME) {
      return NextResponse.json(
        { 
          error: "La requête a pris trop de temps",
          properties: []
        },
        { status: 504 }
      );
    }

    // Ajouter des headers de cache pour réduire la charge CPU
    return NextResponse.json(
      { properties: properties || [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    console.error("[GET /api/properties] Error:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Erreur serveur",
        properties: []
      },
      { status: 500 }
    );
  }
}

async function fetchPropertyMedia(
  serviceClient: any,
  propertyIds: string[]
): Promise<Map<string, { cover_document_id: string | null; cover_url: string | null; documents_count: number }>> {
  const result = new Map<string, { cover_document_id: string | null; cover_url: string | null; documents_count: number }>();

  if (propertyIds.length === 0) {
    return result;
  }

  // Limiter le nombre de propriétés pour éviter les timeouts
  const limitedPropertyIds = propertyIds.slice(0, 50);
  
  try {
    // Essayer d'abord avec la requête complète
    const primaryQuery = serviceClient
      .from("documents")
      .select("id, property_id, preview_url, storage_path, is_cover, position")
      .in("property_id", limitedPropertyIds)
      .eq("collection", "property_media")
      .limit(500); // Limiter le nombre de résultats

    let mediaDocs: any[] | null = null;
    let mediaError: any = null;

    const attempt = await Promise.race([
      primaryQuery,
      new Promise<any>((resolve) => {
        setTimeout(() => {
          resolve({ data: null, error: { message: "Timeout" } });
        }, 3000); // Timeout de 3 secondes
      })
    ]);
    
    mediaDocs = attempt.data;
    mediaError = attempt.error;

    if (mediaError) {
      const message = mediaError.message?.toLowerCase() ?? "";
      const missingColumn =
        message.includes("collection") ||
        message.includes("position") ||
        message.includes("is_cover") ||
        message.includes("timeout");

      if (!missingColumn && message !== "timeout") {
        console.error("[fetchPropertyMedia] Error fetching property media:", mediaError);
        return result;
      }

      // Fallback : requête simplifiée sans les colonnes optionnelles
      try {
        const fallback = await Promise.race([
          serviceClient
            .from("documents")
            .select("id, property_id, preview_url, storage_path, created_at")
            .in("property_id", limitedPropertyIds)
            .limit(500),
          new Promise<any>((resolve) => {
            setTimeout(() => {
              resolve({ data: null, error: { message: "Timeout" } });
            }, 3000);
          })
        ]);

        mediaDocs = fallback.data;
        mediaError = fallback.error;
      } catch (fallbackError: any) {
        console.error("[fetchPropertyMedia] Fallback query failed:", fallbackError);
        return result;
      }
    }

    if (mediaError || !mediaDocs) {
      if (mediaError && mediaError.message !== "Timeout") {
        console.error("[fetchPropertyMedia] Error fetching property media:", mediaError);
      }
      return result;
    }

    mediaDocs.forEach((doc: any) => {
      if (!doc.property_id) return;
      const current = result.get(doc.property_id) ?? {
        cover_document_id: null,
        cover_url: null,
        documents_count: 0,
      };

      current.documents_count += 1;
      const isCover = doc.is_cover || (!current.cover_document_id && current.documents_count === 1);
      if (isCover) {
        current.cover_document_id = doc.id ?? null;
        current.cover_url = doc.preview_url ?? null;
      }

      result.set(doc.property_id, current);
    });

    return result;
  } catch (error: any) {
    console.error("[fetchPropertyMedia] Unexpected error:", error);
    return result;
  }
}

async function generateUniquePropertyCode(serviceClient: any): Promise<string> {
  const { generateCode } = await import("@/lib/helpers/code-generator");
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = await generateCode();
    const { data } = await serviceClient
      .from("properties")
      .select("id")
      .eq("unique_code", candidate)
      .maybeSingle();
    if (!data) {
      return candidate;
    }
  }
  throw new Error("Impossible de générer un code unique");
}

const OPTIONAL_COLUMNS = [
  "charges_mensuelles",
  "commercial_previous_activity",
  "complement_justification",
  "complement_loyer",
] as const;

function getMissingOptionalColumn(
  error: { message?: string } | null | undefined,
  payload: Record<string, unknown>
) {
  const rawMessage = error?.message ?? "";
  const message = rawMessage.toLowerCase();

  const fromOptionalList = OPTIONAL_COLUMNS.find((column) => message.includes(column));
  if (fromOptionalList) {
    return fromOptionalList;
  }

  const detectionRegexes = [
    /column\s+"?([\w]+)"?\s+of\s+relation\s+"properties"/i,
    /could not find the '([\w]+)' column/i,
    /column\s+"?([\w]+)"?\s+does not exist/i,
  ];

  for (const regex of detectionRegexes) {
    const match = rawMessage.match(regex);
    const column = match?.[1];
    if (column && Object.prototype.hasOwnProperty.call(payload, column)) {
      return column;
    }
  }

  return undefined;
}

async function insertPropertyRecord(
  serviceClient: any,
  payload: Record<string, unknown>
): Promise<{ data: any; warning?: string }> {
  const sanitizedPayload = { ...payload };
  const warnings: string[] = [];

  while (true) {
    const attempt = await serviceClient.from("properties").insert(sanitizedPayload as any).select().single();
    if (!attempt.error && attempt.data) {
      return { data: attempt.data, warning: warnings[0] };
    }

    const missingColumn = getMissingOptionalColumn(attempt.error, sanitizedPayload);
    if (!missingColumn) {
      throw attempt.error ?? new Error("Insertion impossible");
    }

    console.warn(
      `[api/properties] Colonne optionnelle absente (${missingColumn}). Insertion sans ce champ sur cette base.`
    );
    warnings.push(`${missingColumn}_non_pris_en_compte`);
    delete (sanitizedPayload as any)[missingColumn];
  }
}

async function createDraftProperty({
  payload,
  profileId,
  serviceClient,
}: {
  payload: z.infer<typeof propertyDraftSchema>;
  profileId: string;
  serviceClient: any;
}) {
  const uniqueCode = await generateUniquePropertyCode(serviceClient);
  const insertPayload: Record<string, unknown> = {
    owner_id: profileId,
    // Support V3 : type_bien (nouveau champ)
    type_bien: payload.type_bien,
    // Support Legacy : type (pour rétrocompatibilité)
    type: payload.type_bien,
    usage_principal: payload.usage_principal ?? "habitation",
    adresse_complete: "Adresse à compléter",
    code_postal: "00000",
    ville: "Ville à préciser",
    departement: "00",
    surface: 0,
    nb_pieces: 0,
    nb_chambres: 0,
    ascenseur: false,
    energie: null,
    ges: null,
    loyer_base: 0,
    loyer_hc: 0,
    charges_mensuelles: 0,
    depot_garantie: 0,
    zone_encadrement: false,
    encadrement_loyers: false,
    unique_code: uniqueCode,
    // État par défaut pour un draft
    etat: "draft",
  };

  const { data } = await insertPropertyRecord(serviceClient, insertPayload);
  console.log(`[createDraftProperty] Draft créé: id=${data.id}, type_bien=${payload.type_bien}`);
  return data;
}

/**
 * POST /api/properties - Créer une nouvelle propriété
 */
const typeBienEnum = z.enum([
  "appartement",
  "maison",
  "studio",
  "colocation",
  "saisonnier",
  "local_commercial",
  "bureaux",
  "entrepot",
  "parking",
  "box",
  "fonds_de_commerce",
]);

const usagePrincipalEnum = z.enum([
  "habitation",
  "local_commercial",
  "bureaux",
  "entrepot",
  "parking",
  "fonds_de_commerce",
]);

const propertyDraftSchema = z.object({
  type_bien: typeBienEnum,
  usage_principal: usagePrincipalEnum.optional(),
});

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
    const draftPayload = propertyDraftSchema.safeParse(body);

    // Récupérer le profil
    const supabaseClientPost = supabase as any;
    const { data: profile } = await supabaseClientPost
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const profileData = profile as any;

    if (profileData.role !== "owner") {
      return NextResponse.json(
        { error: "Seuls les propriétaires peuvent créer des propriétés" },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY manquante. Configurez la clé service-role pour créer des logements.",
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

    if (draftPayload.success) {
      console.log(`[POST /api/properties] Création d'un draft avec type_bien=${draftPayload.data.type_bien}`);
      const property = await createDraftProperty({
        payload: draftPayload.data,
        profileId: profileData.id as string,
        serviceClient,
      });
      console.log(`[POST /api/properties] Draft créé avec succès: id=${property.id}, owner_id=${property.owner_id}`);
      return NextResponse.json({ property }, { status: 201 });
    }

    // Utiliser le validator avec détection automatique V3 vs Legacy
    const validationResult = safeValidatePropertyData(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    const validated = validationResult.data;

    const uniqueCode = await generateUniquePropertyCode(serviceClient);

    // Créer la propriété avec le code unique
    const { data: property } = await insertPropertyRecord(serviceClient, {
      ...validated,
      owner_id: profileData.id as any,
      unique_code: uniqueCode,
    });

    // Émettre un événement
    await serviceClient.from("outbox").insert({
      event_type: "Property.Created",
      payload: {
        property_id: property.id,
        owner_id: profileData.id,
        unique_code: uniqueCode,
      },
    } as any);

    // Journaliser
    await serviceClient.from("audit_log").insert({
      user_id: user.id,
      action: "property_created",
      entity_type: "property",
      entity_id: property.id,
      metadata: { unique_code: uniqueCode },
    } as any);

    return NextResponse.json({ property });
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
