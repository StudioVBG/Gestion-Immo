-- Migration : Ajout de la colonne visite_virtuelle_url pour les visites virtuelles (Matterport, Nodalview, etc.)
BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS visite_virtuelle_url TEXT;

COMMIT;

