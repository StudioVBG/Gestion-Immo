/**
 * Constantes centralisées pour l'upload de fichiers
 *
 * ✅ SOTA 2026: Single source of truth pour éviter les duplications
 */

// Limites de taille par type d'upload
export const FILE_SIZE_LIMITS = {
  /** Documents standards (PDF, Word, etc.) - 10 MB */
  DOCUMENTS: 10 * 1024 * 1024,
  /** Avatars et photos de profil - 2 MB */
  AVATAR: 2 * 1024 * 1024,
  /** Images de propriétés - 5 MB */
  PROPERTY_IMAGES: 5 * 1024 * 1024,
  /** Photos EDL - 8 MB */
  EDL_PHOTOS: 8 * 1024 * 1024,
  /** Signatures - 500 KB */
  SIGNATURES: 500 * 1024,
} as const;

// Types MIME autorisés
export const ALLOWED_MIME_TYPES = {
  DOCUMENTS: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/html",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  IMAGES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  AVATAR: [
    "image/jpeg",
    "image/png",
    "image/webp",
  ],
  SIGNATURES: [
    "image/png",
    "image/svg+xml",
    "application/json", // Pour les données de signature vectorielle
  ],
} as const;

// Extensions autorisées
export const ALLOWED_EXTENSIONS = {
  DOCUMENTS: ["pdf", "jpg", "jpeg", "png", "gif", "webp", "html", "doc", "docx"],
  IMAGES: ["jpg", "jpeg", "png", "gif", "webp"],
  AVATAR: ["jpg", "jpeg", "png", "webp"],
  SIGNATURES: ["png", "svg", "json"],
} as const;

// Types de documents métier
export const DOCUMENT_TYPES = {
  // Documents de propriété
  PROPERTY: [
    "titre_propriete",
    "diagnostics",
    "reglement_copropriete",
    "photo",
    "plan",
    "autre",
  ],
  // Documents de bail
  LEASE: [
    "bail",
    "avenant",
    "quittance",
    "caution",
    "etat_des_lieux",
    "attestation_assurance",
  ],
  // Documents locataire
  TENANT: [
    "identite",
    "justificatif_domicile",
    "avis_imposition",
    "bulletin_salaire",
    "contrat_travail",
    "attestation_employeur",
    "garant",
  ],
  // Documents prestataire
  PROVIDER: [
    "kbis",
    "assurance_rc",
    "certification",
    "attestation_urssaf",
  ],
} as const;

// Préfixes de stockage autorisés
export const STORAGE_PREFIXES = [
  "leases/",
  "properties/",
  "signatures/",
  "documents/",
  "edl/",
  "tenant-documents/",
  "identity/",
  "avatars/",
  "providers/",
] as const;

// Helpers de validation
export type FileCategory = keyof typeof FILE_SIZE_LIMITS;

export function getMaxFileSize(category: FileCategory): number {
  return FILE_SIZE_LIMITS[category];
}

export function getAllowedMimeTypes(category: keyof typeof ALLOWED_MIME_TYPES): readonly string[] {
  return ALLOWED_MIME_TYPES[category];
}

export function getAllowedExtensions(category: keyof typeof ALLOWED_EXTENSIONS): readonly string[] {
  return ALLOWED_EXTENSIONS[category];
}

/**
 * Valide un fichier selon sa catégorie
 */
export function validateFile(
  file: File,
  category: FileCategory
): { valid: boolean; error?: string } {
  // Vérifier la taille
  const maxSize = FILE_SIZE_LIMITS[category];
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Fichier trop volumineux (max ${maxMB} MB, reçu ${fileMB} MB)`,
    };
  }

  // Vérifier le type MIME
  const mimeKey = category === "PROPERTY_IMAGES" || category === "EDL_PHOTOS"
    ? "IMAGES"
    : category;
  const allowedMimes = ALLOWED_MIME_TYPES[mimeKey as keyof typeof ALLOWED_MIME_TYPES];

  if (allowedMimes && !allowedMimes.includes(file.type)) {
    // Fallback sur l'extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExts = ALLOWED_EXTENSIONS[mimeKey as keyof typeof ALLOWED_EXTENSIONS];

    if (!allowedExts?.includes(ext)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé: ${file.type || ext}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Valide un préfixe de chemin de stockage
 */
export function isValidStoragePrefix(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, "/");
  return STORAGE_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));
}

/**
 * Génère un nom de fichier sécurisé et unique
 */
export function generateSecureFilename(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

export default {
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  DOCUMENT_TYPES,
  STORAGE_PREFIXES,
  validateFile,
  isValidStoragePrefix,
  generateSecureFilename,
};
