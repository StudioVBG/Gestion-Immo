/**
 * Helper pour valider les données de propriété avec détection automatique V3 vs Legacy
 * 
 * Cette fonction détecte automatiquement si les données correspondent au format V3
 * et utilise le schéma approprié pour la validation.
 * 
 * Migration progressive : Supporte les deux formats pendant la transition
 */

import { z } from "zod";
import { propertySchema } from "./index";
import { propertySchemaV3 } from "./property-v3";

/**
 * Détecte si les données correspondent au format V3
 * 
 * Critères de détection V3 :
 * - Présence de `type_bien` (V3) au lieu de `type` (legacy)
 * - Ou présence de champs V3 spécifiques (ex: `complement_adresse`, `has_balcon`, `parking_type`, etc.)
 */
function isV3Format(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  
  const obj = data as Record<string, unknown>;
  
  // Critère principal : présence de `type_bien` (V3) au lieu de `type` (legacy)
  if ("type_bien" in obj && !("type" in obj)) {
    return true;
  }
  
  // Critères secondaires : présence de champs V3 spécifiques
  const v3SpecificFields = [
    "complement_adresse",
    "has_balcon",
    "has_terrasse",
    "has_jardin",
    "has_cave",
    "parking_type",
    "parking_numero",
    "parking_niveau",
    "local_surface_totale",
    "local_type",
    "type_bail", // V3 utilise type_bail directement
  ];
  
  return v3SpecificFields.some((field) => field in obj);
}

/**
 * Valide les données de propriété avec détection automatique du format
 * 
 * @param data - Données à valider
 * @returns Données validées avec le schéma approprié
 * @throws ZodError si la validation échoue
 */
export function validatePropertyData(data: unknown): z.infer<typeof propertySchemaV3> | z.infer<typeof propertySchema> {
  if (isV3Format(data)) {
    return propertySchemaV3.parse(data);
  }
  
  // Fallback vers l'ancien schéma pour compatibilité
  return propertySchema.parse(data);
}

/**
 * Valide les données de propriété avec détection automatique (safe parse)
 * 
 * @param data - Données à valider
 * @returns Résultat de la validation (success ou error)
 */
export function safeValidatePropertyData(
  data: unknown
): 
  | { success: true; data: z.infer<typeof propertySchemaV3> | z.infer<typeof propertySchema> }
  | { success: false; error: z.ZodError } {
  if (isV3Format(data)) {
    const result = propertySchemaV3.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  }
  
  // Fallback vers l'ancien schéma
  const result = propertySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Type guard pour vérifier si les données sont au format V3
 */
export function isPropertyV3(data: unknown): data is z.infer<typeof propertySchemaV3> {
  if (!isV3Format(data)) return false;
  
  const result = propertySchemaV3.safeParse(data);
  return result.success;
}

