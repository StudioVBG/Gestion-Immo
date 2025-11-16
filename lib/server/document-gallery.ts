import type { SupabaseClient } from "@supabase/supabase-js";
import { DOCUMENT_GALLERY_MIGRATION_MESSAGE, isDocumentGalleryColumnError } from "@/lib/features/document-gallery";

let cachedSupport: boolean | null = null;

export function getDocumentGallerySupportMessage() {
  return DOCUMENT_GALLERY_MIGRATION_MESSAGE;
}

export async function ensureDocumentGallerySupport(
  serviceClient: SupabaseClient<any, "public", any>
): Promise<boolean> {
  if (cachedSupport !== null) {
    return cachedSupport;
  }

  const { error } = await serviceClient.from("documents").select("id, collection").limit(1);

  if (isDocumentGalleryColumnError(error)) {
    cachedSupport = false;
    return false;
  }

  cachedSupport = true;
  return true;
}

export function overrideDocumentGallerySupport(value: boolean | null) {
  cachedSupport = value;
}

