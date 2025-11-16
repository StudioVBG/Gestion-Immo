const DOCUMENT_GALLERY_COLUMNS = ["documents.collection", "collection", "position", "is_cover", "uploaded_by"];

/**
 * Détecte les erreurs Postgres liées aux colonnes ajoutées par la migration
 * documents_gallery (collection, position, is_cover, uploaded_by).
 */
export function isDocumentGalleryColumnError(error: { message?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  if (!message) return false;
  return DOCUMENT_GALLERY_COLUMNS.some((column) => message.includes(column));
}

/**
 * Texte standardisé pour informer que la migration n'est pas appliquée.
 */
export const DOCUMENT_GALLERY_MIGRATION_MESSAGE =
  "Fonctionnalité indisponible : appliquez la migration supabase/migrations/202411140230_documents_gallery.sql pour activer la galerie avancée.";


