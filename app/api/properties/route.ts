import { NextResponse } from "next/server";
import { z } from "zod";
import { propertySchema } from "@/lib/validations";
import { validatePropertyData, safeValidatePropertyData } from "@/lib/validations/property-validator";
import { getAuthenticatedUser } from "@/lib/helpers/auth-helper";
import { requireAdmin } from "@/lib/helpers/auth-helper";

/**
 * GET /api/properties - Récupérer les propriétés de l'utilisateur
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  
  // Timeout global de sécurité : si la requête prend plus de 25 secondes, retourner une erreur
  const globalTimeout = setTimeout(() => {
    console.error("[GET /api/properties] Global timeout reached (25s), aborting");
  }, 25000);
  
  try {
    const { user, error, supabase } = await getAuthenticatedUser(request);

    if (error) {
      clearTimeout(globalTimeout);
      console.error("[GET /api/properties] Auth error:", error.message);
      return NextResponse.json(
        { error: error.message, details: (error as any).details },
        { status: error.status || 401 }
      );
    }

    if (!user || !supabase) {
      clearTimeout(globalTimeout);
      console.error("[GET /api/properties] No user or supabase client");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    console.log(`[GET /api/properties] Auth successful, elapsed: ${Date.now() - startTime}ms`);

    // Utiliser directement le service client pour éviter les problèmes d'authentification
    // et contourner RLS pour améliorer les performances
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY manquante. Configurez la clé service-role pour lister les logements.",
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

    // Récupérer le profil avec le service client pour éviter les problèmes RLS
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id as any)
      .single();

    if (profileError || !profile) {
      console.error("[GET /api/properties] Error fetching profile:", profileError);
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const profileData = profile as any;
    console.log(`[GET /api/properties] Profile found: id=${profileData.id}, role=${profileData.role}, elapsed: ${Date.now() - startTime}ms`);

    // Récupérer les propriétés selon le rôle avec timeout de sécurité
    const queryStartTime = Date.now();
    let properties: any[] = [];
    
    try {
      if (profileData.role === "admin") {
        // Les admins voient toutes les propriétés
        const queryPromise = serviceClient
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100); // Limiter à 100 propriétés pour éviter les timeouts

        const { data, error: queryError } = await Promise.race([
          queryPromise,
          new Promise<any>((resolve) => {
            setTimeout(() => {
              console.warn("[GET /api/properties] Admin query timeout");
              resolve({ data: [], error: { message: "Timeout" } });
            }, 10000); // Timeout de 10 secondes
          })
        ]);

        if (queryError && queryError.message !== "Timeout") {
          console.error("[GET /api/properties] Admin query error:", queryError);
          throw queryError;
        }
        properties = data || [];
        console.log(`[GET /api/properties] Admin query completed: ${properties.length} properties, elapsed: ${Date.now() - queryStartTime}ms`);
      } else if (profileData.role === "owner") {
        // Les propriétaires voient leurs propriétés
        // Sélectionner uniquement les colonnes essentielles pour réduire le temps de réponse
        const queryPromise = serviceClient
          .from("properties")
          .select("id, owner_id, type, type_bien, adresse_complete, code_postal, ville, surface, nb_pieces, loyer_base, created_at, etat")
          .eq("owner_id", profileData.id as any)
          .order("created_at", { ascending: false })
          .limit(50); // Réduire à 50 pour éviter les timeouts

        const { data, error } = await Promise.race([
          queryPromise,
          new Promise<any>((resolve) => {
            setTimeout(() => {
              console.warn("[GET /api/properties] Owner query timeout");
              resolve({ data: [], error: { message: "Timeout" } });
            }, 5000); // Réduire le timeout à 5 secondes
          })
        ]);

        if (error && error.message !== "Timeout") {
          console.error("[GET /api/properties] Error fetching properties:", error);
          console.error("[GET /api/properties] Error details:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            ownerId: profileData.id,
            role: profileData.role
          });
          
          // Si erreur RLS (permission denied), retourner un tableau vide plutôt qu'une erreur 500
          if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("row-level security")) {
            console.warn("[GET /api/properties] RLS error detected, returning empty array");
            properties = [];
          } else {
            // Pour toute autre erreur, logger et retourner un tableau vide pour éviter l'erreur 500 côté client
            console.error("[GET /api/properties] Unexpected error, returning empty array to prevent 500");
            properties = [];
          }
        } else {
          properties = data || [];
        }
        console.log(`[GET /api/properties] Owner query completed: ${properties.length} properties, elapsed: ${Date.now() - queryStartTime}ms`);
      } else {
        // Les autres rôles voient les propriétés où ils ont un bail actif
        const leasesQueryPromise = serviceClient
          .from("lease_signers")
          .select("lease_id")
          .eq("profile_id", profileData.id as any)
          .in("role", ["locataire_principal", "colocataire"] as any)
          .limit(100);

        const { data: leases, error: leasesError } = await Promise.race([
          leasesQueryPromise,
          new Promise<any>((resolve) => {
            setTimeout(() => {
              console.warn("[GET /api/properties] Leases query timeout");
              resolve({ data: [], error: { message: "Timeout" } });
            }, 5000);
          })
        ]);

        if (leasesError && leasesError.message !== "Timeout") {
          console.error("[GET /api/properties] Error fetching leases:", leasesError);
          properties = [];
        } else if (!leases || leases.length === 0) {
          properties = [];
        } else {
          const leasesArray = leases as any[];
          const leaseIds = leasesArray.map((l) => l.lease_id).slice(0, 50); // Limiter à 50 baux
          
          const leasesDataQueryPromise = serviceClient
            .from("leases")
            .select("property_id")
            .in("id", leaseIds as any)
            .eq("statut", "active" as any)
            .limit(50);

          const { data: leasesData, error: leasesDataError } = await Promise.race([
            leasesDataQueryPromise,
            new Promise<any>((resolve) => {
              setTimeout(() => {
                console.warn("[GET /api/properties] Leases data query timeout");
                resolve({ data: [], error: { message: "Timeout" } });
              }, 5000);
            })
          ]);

          if (leasesDataError && leasesDataError.message !== "Timeout") {
            console.error("[GET /api/properties] Error fetching leases data:", leasesDataError);
            properties = [];
          } else if (!leasesData || leasesData.length === 0) {
            properties = [];
          } else {
            const leasesDataArray = leasesData as any[];
            const propertyIds = [...new Set(leasesDataArray.map((l) => l.property_id).filter(Boolean))].slice(0, 50);
            
            const propertiesQueryPromise = serviceClient
              .from("properties")
              .select("*")
              .in("id", propertyIds)
              .order("created_at", { ascending: false })
              .limit(50);

            const { data, error } = await Promise.race([
              propertiesQueryPromise,
              new Promise<any>((resolve) => {
                setTimeout(() => {
                  console.warn("[GET /api/properties] Properties query timeout");
                  resolve({ data: [], error: { message: "Timeout" } });
                }, 10000);
              })
            ]);

            if (error && error.message !== "Timeout") {
              console.error("[GET /api/properties] Error fetching tenant properties:", error);
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

    // TEMPORAIREMENT DÉSACTIVÉ : Récupération des médias pour éviter les timeouts
    // TODO: Réactiver une fois les problèmes de performance résolus
    // Les médias peuvent être récupérés séparément via /api/properties/[id]/documents si nécessaire
    if (false && properties.length > 0) {
      try {
        // Limiter le nombre de propriétés pour éviter les timeouts
        const propertyIds = properties.slice(0, 50).map((p) => p.id as string);
        const mediaInfo = await Promise.race([
          fetchPropertyMedia(serviceClient, propertyIds),
          new Promise<Map<string, { cover_document_id: string | null; cover_url: string | null; documents_count: number }>>((resolve) => {
            setTimeout(() => {
              console.warn("[GET /api/properties] Media fetch timeout, returning empty media info");
              resolve(new Map());
            }, 5000); // Timeout de 5 secondes pour les médias
          })
        ]);
        
        properties = properties.map((property: any) => ({
          ...property,
          ...mediaInfo.get(property.id),
        }));
      } catch (mediaError: any) {
        console.error("[GET /api/properties] Error fetching media, continuing without media info:", mediaError);
        // Continuer sans les informations de médias pour éviter de bloquer la réponse
      }
    }

    clearTimeout(globalTimeout);
    
    const elapsedTime = Date.now() - startTime;
    
    // Log pour debug
    console.log(`[GET /api/properties] Profil ID: ${profileData.id}, Rôle: ${profileData.role}, Propriétés trouvées: ${properties?.length || 0}, Temps: ${elapsedTime}ms`);

    // Avertir si la requête prend trop de temps
    if (elapsedTime > 5000) {
      console.warn(`[GET /api/properties] Slow request: ${elapsedTime}ms`);
    }
    
    // Si la requête prend trop de temps, retourner une erreur avant le timeout Vercel
    if (elapsedTime > 25000) {
      console.error(`[GET /api/properties] Request taking too long (${elapsedTime}ms), returning timeout error`);
      return NextResponse.json(
        { 
          error: "La requête prend trop de temps",
          properties: [],
          debug: {
            profileId: profileData.id,
            role: profileData.role,
            elapsedTime: `${elapsedTime}ms`,
            timeout: true
          }
        },
        { status: 504 }
      );
    }

    return NextResponse.json({ 
      properties: properties || [],
      debug: {
        profileId: profileData.id,
        role: profileData.role,
        count: properties?.length || 0,
        elapsedTime: `${elapsedTime}ms`
      }
    });
  } catch (error: any) {
    clearTimeout(globalTimeout);
    console.error("Error in GET /api/properties:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    // Si c'est un timeout, retourner une erreur 504
    if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      return NextResponse.json(
        { 
          error: "La requête a pris trop de temps",
          properties: [],
          debug: {
            elapsedTime: `${Date.now() - startTime}ms`,
            timeout: true
          }
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Erreur serveur",
        details: error.details,
        code: error.code,
        properties: [] // Retourner un tableau vide pour éviter les erreurs côté client
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
          console.warn("[fetchPropertyMedia] Query timeout");
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
              console.warn("[fetchPropertyMedia] Fallback query timeout");
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

