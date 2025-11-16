-- Migration : informations financières, encadrement des loyers et diagnostics

BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS loyer_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charges_mensuelles NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS depot_garantie NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS zone_encadrement BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyer_reference_majoré NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS complement_loyer NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS complement_justification TEXT,
  ADD COLUMN IF NOT EXISTS dpe_classe_energie TEXT,
  ADD COLUMN IF NOT EXISTS dpe_classe_climat TEXT,
  ADD COLUMN IF NOT EXISTS dpe_consommation NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS dpe_emissions NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS dpe_estimation_conso_min NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS dpe_estimation_conso_max NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS permis_louer_requis BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permis_louer_numero TEXT,
  ADD COLUMN IF NOT EXISTS permis_louer_date DATE;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_dpe_classe_energie_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_dpe_classe_energie_check
  CHECK (
    dpe_classe_energie IS NULL
    OR dpe_classe_energie IN ('A','B','C','D','E','F','G')
  );

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_dpe_classe_climat_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_dpe_classe_climat_check
  CHECK (
    dpe_classe_climat IS NULL
    OR dpe_classe_climat IN ('A','B','C','D','E','F','G')
  );

ALTER TABLE properties
  ADD CONSTRAINT properties_loyer_reference_check
  CHECK (
    zone_encadrement = false
    OR loyer_reference_majoré IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_properties_zone_encadrement ON properties(zone_encadrement);
CREATE INDEX IF NOT EXISTS idx_properties_dpe_classe ON properties(dpe_classe_energie, dpe_classe_climat);

COMMIT;





