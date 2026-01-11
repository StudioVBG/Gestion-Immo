/**
 * Utilitaires de validation de chemins de fichiers
 *
 * ✅ SOTA 2026: Sécurité centralisée contre path traversal
 */

import { STORAGE_PREFIXES } from "@/lib/constants/file-upload";

// Regex UUID standard
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Caractères interdits dans les chemins
const FORBIDDEN_CHARS_REGEX = /[<>:"|?*\x00-\x1f]/;

/**
 * Valide un UUID
 */
export function isValidUUID(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value);
}

/**
 * Valide un chemin de stockage
 * Protège contre:
 * - Path traversal (../)
 * - Double slashes (//)
 * - Caractères interdits
 * - Préfixes non autorisés
 */
export function validateStoragePath(
  path: string
): { valid: boolean; normalizedPath?: string; error?: string } {
  if (!path || typeof path !== "string") {
    return { valid: false, error: "Chemin requis" };
  }

  // Normaliser les backslashes
  const normalizedPath = path.replace(/\\/g, "/");

  // Vérifier path traversal
  if (normalizedPath.includes("..")) {
    console.warn("[PathValidation] Tentative de path traversal:", path);
    return { valid: false, error: "Chemin invalide: traversal détecté" };
  }

  // Vérifier double slashes
  if (normalizedPath.includes("//")) {
    return { valid: false, error: "Chemin invalide: double slash" };
  }

  // Vérifier si commence par /
  if (normalizedPath.startsWith("/")) {
    return { valid: false, error: "Chemin invalide: ne doit pas commencer par /" };
  }

  // Vérifier caractères interdits
  if (FORBIDDEN_CHARS_REGEX.test(normalizedPath)) {
    return { valid: false, error: "Chemin contient des caractères interdits" };
  }

  // Vérifier préfixe autorisé
  const hasAllowedPrefix = STORAGE_PREFIXES.some((prefix) =>
    normalizedPath.startsWith(prefix)
  );

  if (!hasAllowedPrefix) {
    console.warn("[PathValidation] Préfixe non autorisé:", path);
    return { valid: false, error: "Préfixe de chemin non autorisé" };
  }

  return { valid: true, normalizedPath };
}

/**
 * Extrait l'ID d'une entité depuis un chemin de stockage
 * Ex: "leases/abc-123/document.pdf" -> "abc-123"
 */
export function extractEntityIdFromPath(
  path: string,
  entityPrefix: string
): string | null {
  const normalizedPath = path.replace(/\\/g, "/");
  const regex = new RegExp(`^${entityPrefix}/([^/]+)/`);
  const match = normalizedPath.match(regex);

  if (match && match[1]) {
    const id = match[1];
    // Vérifier que c'est un UUID valide
    if (isValidUUID(id)) {
      return id;
    }
  }

  return null;
}

/**
 * Construit un chemin de stockage sécurisé
 */
export function buildStoragePath(
  prefix: (typeof STORAGE_PREFIXES)[number],
  entityId: string,
  filename: string
): string | null {
  // Valider l'UUID
  if (!isValidUUID(entityId)) {
    console.error("[PathValidation] UUID invalide:", entityId);
    return null;
  }

  // Nettoyer le filename
  const cleanFilename = filename
    .replace(/[<>:"|?*\x00-\x1f]/g, "")
    .replace(/\.\./g, "")
    .replace(/\/+/g, "-");

  if (!cleanFilename) {
    return null;
  }

  return `${prefix}${entityId}/${cleanFilename}`;
}

/**
 * Valide plusieurs UUIDs
 */
export function validateUUIDs(
  ids: Record<string, string | null | undefined>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [key, value] of Object.entries(ids)) {
    if (value && !isValidUUID(value)) {
      errors[key] = `${key} n'est pas un UUID valide`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize un nom de fichier
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"|?*\x00-\x1f\\\/]/g, "_")
    .replace(/\.+/g, ".")
    .replace(/^\./, "_")
    .substring(0, 255);
}

export default {
  isValidUUID,
  validateStoragePath,
  extractEntityIdFromPath,
  buildStoragePath,
  validateUUIDs,
  sanitizeFilename,
  UUID_REGEX,
};
