/**
 * Générateur de codes uniques pour invitations
 */

export async function generateCode(): Promise<string> {
  // Générer un code unique (ex: PROP-XXXX-XXXX)
  const prefix = "PROP";
  const randomPart = Array.from({ length: 8 }, () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return chars[Math.floor(Math.random() * chars.length)];
  }).join("");

  return `${prefix}-${randomPart.substring(0, 4)}-${randomPart.substring(4, 8)}`;
}

export function generateULID(): string {
  // Générer un ULID (Universally Unique Lexicographically Sortable Identifier)
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from({ length: 16 }, () => {
    const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    return chars[Math.floor(Math.random() * chars.length)];
  }).join("");

  return `${timestamp}${random}`;
}





