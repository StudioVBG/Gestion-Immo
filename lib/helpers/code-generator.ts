/**
 * Générateur de codes uniques pour invitations
 * Utilise crypto.getRandomValues() pour une génération cryptographiquement sécurisée
 */

/**
 * Génère un index aléatoire cryptographiquement sécurisé
 * @param max - La borne supérieure exclusive
 * @returns Un entier aléatoire entre 0 et max-1
 */
function getSecureRandomIndex(max: number): number {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  return randomBuffer[0] % max;
}

/**
 * Génère une chaîne aléatoire cryptographiquement sécurisée
 * @param length - La longueur de la chaîne à générer
 * @param charset - Le jeu de caractères à utiliser
 * @returns Une chaîne aléatoire sécurisée
 */
function getSecureRandomString(length: number, charset: string): string {
  return Array.from({ length }, () => charset[getSecureRandomIndex(charset.length)]).join("");
}

/**
 * Génère un code d'invitation unique au format PROP-XXXX-XXXX
 * Utilise crypto.getRandomValues() pour une entropie cryptographiquement sécurisée
 * @returns Un code unique au format PROP-XXXX-XXXX
 */
export async function generateCode(): Promise<string> {
  const prefix = "PROP";
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomPart = getSecureRandomString(8, charset);

  return `${prefix}-${randomPart.substring(0, 4)}-${randomPart.substring(4, 8)}`;
}

/**
 * Génère un ULID (Universally Unique Lexicographically Sortable Identifier)
 * Utilise crypto.getRandomValues() pour la partie aléatoire
 * @returns Un ULID unique
 */
export function generateULID(): string {
  // Timestamp en base 36
  const timestamp = Date.now().toString(36).toUpperCase();

  // Partie aléatoire cryptographiquement sécurisée
  // Utilise le charset Crockford Base32 (sans I, L, O, U pour éviter les confusions)
  const charset = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const random = getSecureRandomString(16, charset);

  return `${timestamp}${random}`;
}

/**
 * Génère un code court pour les partages (6 caractères)
 * @returns Un code court sécurisé
 */
export function generateShortCode(): string {
  const charset = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  return getSecureRandomString(6, charset);
}

/**
 * Génère un token hexadécimal sécurisé
 * @param bytes - Nombre d'octets (défaut: 32 = 64 caractères hex)
 * @returns Un token hexadécimal
 */
export function generateSecureToken(bytes: number = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (b) => b.toString(16).padStart(2, "0")).join("");
}
