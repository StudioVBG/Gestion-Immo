-- Migration : galerie de documents (multi-upload, tri, cover)

BEGIN;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS collection TEXT DEFAULT 'property_media',
  ADD COLUMN IF NOT EXISTS position INTEGER,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES profiles(id);

-- Indexes pour la navigation
CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection);
CREATE INDEX IF NOT EXISTS idx_documents_property_collection_position
  ON documents(property_id, collection, position);

-- Initialiser les positions manquantes
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(property_id, lease_id, owner_id, tenant_id), collection
      ORDER BY created_at
    ) AS rn
  FROM documents
  WHERE position IS NULL
)
UPDATE documents d
SET position = ranked.rn
FROM ranked
WHERE d.id = ranked.id;

-- Si aucun cover défini, prendre le premier document de chaque regroupement
WITH first_docs AS (
  SELECT DISTINCT ON (COALESCE(property_id, lease_id, owner_id, tenant_id), collection)
    id
  FROM documents
  WHERE is_cover = false
  ORDER BY COALESCE(property_id, lease_id, owner_id, tenant_id), collection, position NULLS FIRST, created_at
)
UPDATE documents d
SET is_cover = true
FROM first_docs
WHERE d.id = first_docs.id
  AND NOT EXISTS (
    SELECT 1 FROM documents d2
    WHERE COALESCE(d2.property_id, d2.lease_id, d2.owner_id, d2.tenant_id) =
          COALESCE(d.property_id, d.lease_id, d.owner_id, d.tenant_id)
      AND d2.collection = d.collection
      AND d2.is_cover = true
      AND d2.id <> d.id
  );

-- Trigger pour calculer automatiquement la position si non fournie
CREATE OR REPLACE FUNCTION documents_set_default_position()
RETURNS TRIGGER AS $$
DECLARE
  target_property UUID;
BEGIN
  target_property := COALESCE(NEW.property_id, NEW.lease_id, NEW.owner_id, NEW.tenant_id);

  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1
    INTO NEW.position
    FROM documents
    WHERE COALESCE(property_id, lease_id, owner_id, tenant_id) = target_property
      AND collection = COALESCE(NEW.collection, 'property_media');
  END IF;

  IF NEW.collection IS NULL THEN
    NEW.collection := 'property_media';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_set_default_position ON documents;

CREATE TRIGGER trg_documents_set_default_position
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION documents_set_default_position();

-- Mettre à jour les politiques RLS pour autoriser la mise à jour du tri
DROP POLICY IF EXISTS "Owners can create documents for own properties" ON documents;

CREATE POLICY "Owners can manage documents for own properties"
  ON documents FOR INSERT
  WITH CHECK (
    owner_id = public.user_profile_id()
    OR tenant_id = public.user_profile_id()
    OR (
      property_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM properties p
        WHERE p.id = documents.property_id
          AND p.owner_id = public.user_profile_id()
      )
    )
    OR public.user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Owners can update documents for own properties" ON documents;
CREATE POLICY "Owners can update documents for own properties"
  ON documents FOR UPDATE
  USING (
    owner_id = public.user_profile_id()
    OR tenant_id = public.user_profile_id()
    OR (
      property_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM properties p
        WHERE p.id = documents.property_id
          AND p.owner_id = public.user_profile_id()
      )
    )
    OR public.user_role() = 'admin'
  )
  WITH CHECK (
    owner_id = public.user_profile_id()
    OR tenant_id = public.user_profile_id()
    OR (
      property_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM properties p
        WHERE p.id = documents.property_id
          AND p.owner_id = public.user_profile_id()
      )
    )
    OR public.user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Tenants can manage own documents" ON documents;
CREATE POLICY "Tenants can manage own documents"
  ON documents FOR ALL
  USING (tenant_id = public.user_profile_id());

DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
CREATE POLICY "Admins can manage all documents"
  ON documents FOR ALL
  USING (public.user_role() = 'admin');


COMMIT;

