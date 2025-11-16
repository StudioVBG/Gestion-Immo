-- Migration : workflow de validation des logements
-- Ajoute les colonnes de statut et de suivi d'approbation

BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS etat TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_etat_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_etat_check
  CHECK (
    etat IN (
      'draft',
      'pending',
      'published',
      'rejected',
      'archived'
    )
  );

UPDATE properties
SET etat = COALESCE(etat, 'draft');

CREATE INDEX IF NOT EXISTS idx_properties_etat ON properties(etat);
CREATE INDEX IF NOT EXISTS idx_properties_validated_at ON properties(validated_at);

COMMIT;

