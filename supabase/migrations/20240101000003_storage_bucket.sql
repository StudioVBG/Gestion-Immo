-- Migration : Configuration du bucket Storage pour les documents

-- Créer le bucket "documents" s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Politique RLS pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Politique RLS pour permettre la lecture aux utilisateurs qui ont accès au document
CREATE POLICY "Users can view accessible documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND (
    -- Les propriétaires peuvent voir les documents de leurs propriétés
    EXISTS (
      SELECT 1 FROM documents d
      JOIN properties p ON p.id = d.property_id
      WHERE d.storage_path = (storage.objects.name)
      AND p.owner_id = public.user_profile_id()
    )
    OR
    -- Les locataires peuvent voir leurs documents
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.storage_path = (storage.objects.name)
      AND d.tenant_id = public.user_profile_id()
    )
    OR
    -- Les admins peuvent tout voir
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
);

-- Politique RLS pour permettre la suppression aux propriétaires et admins
CREATE POLICY "Owners and admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN properties p ON p.id = d.property_id
      WHERE d.storage_path = (storage.objects.name)
      AND p.owner_id = public.user_profile_id()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
);

