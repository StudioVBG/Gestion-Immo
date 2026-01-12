/**
 * Utilitaires de parsing JSON sécurisé
 *
 * ✅ SOTA 2026: Évite les crashes sur JSON malformé
 */

/**
 * Parse JSON de manière sécurisée, retourne defaultValue en cas d'erreur
 */
export function safeParseJSON<T>(
  value: string | null | undefined,
  defaultValue: T
): T {
  if (!value) return defaultValue;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("[SafeJSON] Échec du parsing:", error);
    return defaultValue;
  }
}

/**
 * Parse un tableau JSON de manière sécurisée
 * Gère: string JSON, tableau existant, valeur null/undefined
 */
export function safeParseArray<T = unknown>(
  value: string | T[] | null | undefined
): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parse un objet JSON de manière sécurisée
 */
export function safeParseObject<T extends Record<string, unknown> = Record<string, unknown>>(
  value: string | T | null | undefined,
  defaultValue: T = {} as T
): T {
  if (!value) return defaultValue;
  if (typeof value === "object" && !Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value as string);
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Parse les items d'un devis/facture (legacy: safeParseItems)
 */
export interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total?: number;
  estimated_cost?: number;
}

export function safeParseItems(
  items: string | QuoteItem[] | null | undefined
): QuoteItem[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;

  try {
    const parsed = JSON.parse(items);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    console.warn("[SafeJSON] Impossible de parser les items:", items);
    return [];
  }
}

/**
 * Stringify JSON de manière sécurisée
 */
export function safeStringify(
  value: unknown,
  defaultValue: string = "{}"
): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn("[SafeJSON] Échec du stringify:", error);
    return defaultValue;
  }
}

/**
 * Parse et valide un nombre depuis une string
 */
export function safeParseNumber(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "number") return isNaN(value) ? defaultValue : value;

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse une date ISO de manière sécurisée
 */
export function safeParseDateISO(
  value: string | null | undefined
): Date | null {
  if (!value) return null;

  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Deep merge de deux objets de manière sécurisée
 */
export function safeDeepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = safeDeepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

export default {
  safeParseJSON,
  safeParseArray,
  safeParseObject,
  safeParseItems,
  safeStringify,
  safeParseNumber,
  safeParseDateISO,
  safeDeepMerge,
};
