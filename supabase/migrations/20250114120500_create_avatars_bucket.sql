-- Migration : bucket Storage pour les avatars utilisateurs

-- Créer le bucket "avatars" (public pour affichage direct)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Politique : upload / mise à jour / suppression limité à l'utilisateur
CREATE POLICY "Users can manage own avatars"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'avatars'
  AND owner = auth.uid()
);





