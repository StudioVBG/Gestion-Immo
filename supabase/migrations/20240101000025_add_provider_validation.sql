-- Migration : Ajout du système de validation des prestataires

-- Ajouter les colonnes de validation à provider_profiles
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' 
  CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index pour améliorer les performances des requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_provider_profiles_status ON provider_profiles(status);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_validated_at ON provider_profiles(validated_at);

-- RLS : Les admins peuvent voir tous les profils prestataires
-- Les prestataires peuvent voir leur propre profil
-- Les propriétaires peuvent voir les prestataires approuvés uniquement

DROP POLICY IF EXISTS "Admins can view all provider profiles" ON provider_profiles;
CREATE POLICY "Admins can view all provider profiles"
  ON provider_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = provider_profiles.profile_id
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Providers can view own profile" ON provider_profiles;
CREATE POLICY "Providers can view own profile"
  ON provider_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = provider_profiles.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can view approved providers" ON provider_profiles;
CREATE POLICY "Owners can view approved providers"
  ON provider_profiles FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Admins can update provider status" ON provider_profiles;
CREATE POLICY "Admins can update provider status"
  ON provider_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = provider_profiles.profile_id
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = provider_profiles.profile_id
      AND profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commentaire sur la table
COMMENT ON COLUMN provider_profiles.status IS 'Statut de validation du prestataire: pending (en attente), approved (approuvé), rejected (rejeté)';
COMMENT ON COLUMN provider_profiles.validated_at IS 'Date de validation ou rejet du prestataire';
COMMENT ON COLUMN provider_profiles.validated_by IS 'ID de l''administrateur qui a validé ou rejeté le prestataire';
COMMENT ON COLUMN provider_profiles.rejection_reason IS 'Raison du rejet si le prestataire a été rejeté';





