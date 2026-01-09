-- ============================================
-- MIGRATION: Fix deleted_at column for properties
-- ============================================
-- 
-- Cette migration s'assure que la colonne deleted_at existe
-- dans la table properties (requise par le trigger de sécurité)
--
-- Date: 2026-01-09
-- ============================================

-- Ajouter la colonne deleted_at si elle n'existe pas
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- Créer l'index pour les requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at 
  ON properties(deleted_at) WHERE deleted_at IS NULL;

-- Index pour le soft delete
CREATE INDEX IF NOT EXISTS idx_properties_active 
  ON properties(owner_id, deleted_at) WHERE deleted_at IS NULL;

-- Commentaires
COMMENT ON COLUMN properties.deleted_at IS 'Date de suppression soft (NULL = actif)';
COMMENT ON COLUMN properties.deleted_by IS 'Profile qui a supprimé le bien';

-- ============================================
-- FIN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260109000000_fix_property_deleted_at terminée';
END $$;

