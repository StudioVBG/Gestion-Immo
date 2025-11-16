-- Migration : Ajouter les états manquants pour les baux
-- PartiallySigned, FullySigned, Amended, Archived

-- Supprimer la contrainte existante
ALTER TABLE leases 
DROP CONSTRAINT IF EXISTS leases_statut_check;

-- Ajouter la nouvelle contrainte avec tous les états
ALTER TABLE leases
ADD CONSTRAINT leases_statut_check
CHECK (statut IN (
  'draft',           -- Brouillon
  'sent',            -- Envoyé pour signature
  'partially_signed', -- Partiellement signé
  'fully_signed',    -- Entièrement signé (avant activation)
  'active',          -- Actif
  'amended',         -- Avenant
  'terminated',      -- Terminé
  'archived'         -- Archivé
));

-- Ajouter une colonne pour suivre le parent en cas d'avenant
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS parent_lease_id UUID REFERENCES leases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leases_parent_lease_id ON leases(parent_lease_id);

-- Commentaire pour documentation
COMMENT ON COLUMN leases.parent_lease_id IS 'Référence au bail parent en cas d''avenant';





