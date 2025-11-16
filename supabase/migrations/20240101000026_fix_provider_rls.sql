-- Migration de correction : Fix de la politique RLS pour les admins sur provider_profiles
-- Le problème : La politique précédente comparait incorrectement les IDs

-- Supprimer la politique incorrecte créée dans 20240101000025_add_provider_validation.sql
DROP POLICY IF EXISTS "Admins can view all provider profiles" ON provider_profiles;

-- Recréer la politique correcte
-- Les admins peuvent voir TOUS les provider_profiles (peu importe le profile_id)
CREATE POLICY "Admins can view all provider profiles"
  ON provider_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- S'assurer que la politique pour les admins de mise à jour est aussi correcte
DROP POLICY IF EXISTS "Admins can update provider status" ON provider_profiles;

CREATE POLICY "Admins can update provider status"
  ON provider_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );





