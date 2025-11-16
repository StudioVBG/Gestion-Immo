-- Migration : extension du modèle pour les baux commerciaux et professionnels
-- Lot 1 - Modèle & validations (partie SQL)

BEGIN;

-- ============================================
-- PROPERTIES
-- ============================================

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS usage_principal TEXT,
  ADD COLUMN IF NOT EXISTS sous_usage TEXT,
  ADD COLUMN IF NOT EXISTS erp_type TEXT,
  ADD COLUMN IF NOT EXISTS erp_categorie TEXT,
  ADD COLUMN IF NOT EXISTS erp_accessibilite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_url TEXT,
  ADD COLUMN IF NOT EXISTS has_irve BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS places_parking INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parking_badge_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commercial_previous_activity TEXT;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_type_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_type_check
  CHECK (
    type IN (
      'appartement',
      'maison',
      'colocation',
      'saisonnier',
      'local_commercial',
      'bureaux',
      'entrepot',
      'parking',
      'fonds_de_commerce'
    )
  );

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_usage_principal_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_usage_principal_check
  CHECK (
    usage_principal IS NULL
    OR usage_principal IN (
      'habitation',
      'local_commercial',
      'bureaux',
      'entrepot',
      'parking',
      'fonds_de_commerce'
    )
  );

UPDATE properties
SET usage_principal = COALESCE(usage_principal, 'habitation');

CREATE INDEX IF NOT EXISTS idx_properties_usage_principal ON properties(usage_principal);
CREATE INDEX IF NOT EXISTS idx_properties_sous_usage ON properties(sous_usage);

-- ============================================
-- OWNER PROFILES
-- ============================================

ALTER TABLE owner_profiles
  ADD COLUMN IF NOT EXISTS usage_strategie TEXT,
  ADD COLUMN IF NOT EXISTS tva_optionnelle BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tva_taux NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS notes_fiscales TEXT;

ALTER TABLE owner_profiles
  DROP CONSTRAINT IF EXISTS owner_profiles_usage_strategie_check;

ALTER TABLE owner_profiles
  ADD CONSTRAINT owner_profiles_usage_strategie_check
  CHECK (
    usage_strategie IS NULL
    OR usage_strategie IN ('habitation_only', 'mixte_B2C_B2B', 'B2B_only')
  );

UPDATE owner_profiles
SET usage_strategie = COALESCE(usage_strategie, 'habitation_only');

CREATE INDEX IF NOT EXISTS idx_owner_profiles_usage_strategie ON owner_profiles(usage_strategie);

-- ============================================
-- TENANT PROFILES
-- ============================================

ALTER TABLE tenant_profiles
  ADD COLUMN IF NOT EXISTS locataire_type TEXT,
  ADD COLUMN IF NOT EXISTS siren VARCHAR(9),
  ADD COLUMN IF NOT EXISTS rcs TEXT,
  ADD COLUMN IF NOT EXISTS rm TEXT,
  ADD COLUMN IF NOT EXISTS rne TEXT,
  ADD COLUMN IF NOT EXISTS activite_ape TEXT,
  ADD COLUMN IF NOT EXISTS raison_sociale TEXT,
  ADD COLUMN IF NOT EXISTS representant_legal TEXT;

ALTER TABLE tenant_profiles
  DROP CONSTRAINT IF EXISTS tenant_profiles_locataire_type_check;

ALTER TABLE tenant_profiles
  ADD CONSTRAINT tenant_profiles_locataire_type_check
  CHECK (
    locataire_type IS NULL
    OR locataire_type IN (
      'particulier_habitation',
      'profession_liberale',
      'commercant_artisan',
      'entreprise'
    )
  );

UPDATE tenant_profiles
SET locataire_type = COALESCE(locataire_type, 'particulier_habitation');

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_locataire_type ON tenant_profiles(locataire_type);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_siren ON tenant_profiles(siren);

-- ============================================
-- LEASES
-- ============================================

ALTER TABLE leases
  DROP CONSTRAINT IF EXISTS leases_type_bail_check;

ALTER TABLE leases
  ADD CONSTRAINT leases_type_bail_check
  CHECK (
    type_bail IN (
      'nu',
      'meuble',
      'colocation',
      'saisonnier',
      'bail_mobilite',
      'commercial_3_6_9',
      'commercial_derogatoire',
      'professionnel',
      'contrat_parking',
      'location_gerance'
    )
  );

ALTER TABLE leases
  ADD COLUMN IF NOT EXISTS indice_reference TEXT,
  ADD COLUMN IF NOT EXISTS indice_base NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS indice_courant NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS indexation_periodicite TEXT,
  ADD COLUMN IF NOT EXISTS indexation_lissage_deplafonnement BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tva_applicable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tva_taux NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS loyer_ht NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS loyer_ttc NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS pinel_travaux_3_derniers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pinel_travaux_3_prochains JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pinel_repartition_charges JSONB,
  ADD COLUMN IF NOT EXISTS droit_preference_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_diagnostic_check DATE,
  ADD COLUMN IF NOT EXISTS next_indexation_date DATE;

ALTER TABLE leases
  DROP CONSTRAINT IF EXISTS leases_indice_reference_check;

ALTER TABLE leases
  ADD CONSTRAINT leases_indice_reference_check
  CHECK (
    indice_reference IS NULL
    OR indice_reference IN ('IRL', 'ILC', 'ILAT')
  );

ALTER TABLE leases
  DROP CONSTRAINT IF EXISTS leases_indexation_periodicite_check;

ALTER TABLE leases
  ADD CONSTRAINT leases_indexation_periodicite_check
  CHECK (
    indexation_periodicite IS NULL
    OR indexation_periodicite IN ('annuelle', 'triennale', 'quinquennale')
  );

UPDATE leases
SET indice_reference = COALESCE(indice_reference, 'IRL')
WHERE type_bail IN ('nu', 'meuble', 'colocation', 'saisonnier', 'bail_mobilite');

CREATE INDEX IF NOT EXISTS idx_leases_indice_reference ON leases(indice_reference);
CREATE INDEX IF NOT EXISTS idx_leases_next_indexation_date ON leases(next_indexation_date);

-- ============================================
-- DOCUMENTS
-- ============================================

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_type_check
  CHECK (
    type IN (
      'bail',
      'EDL_entree',
      'EDL_sortie',
      'quittance',
      'attestation_assurance',
      'attestation_loyer',
      'justificatif_revenus',
      'piece_identite',
      'annexe_pinel',
      'etat_travaux',
      'diagnostic_amiante',
      'diagnostic_tertiaire',
      'diagnostic_performance',
      'publication_jal',
      'autre'
    )
  );

-- ============================================
-- CHARGES
-- ============================================

ALTER TABLE charges
  ADD COLUMN IF NOT EXISTS categorie_charge TEXT,
  ADD COLUMN IF NOT EXISTS eligible_pinel BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE charges
  DROP CONSTRAINT IF EXISTS charges_type_check;

ALTER TABLE charges
  ADD CONSTRAINT charges_type_check
  CHECK (
    type IN (
      'eau',
      'electricite',
      'copro',
      'taxe',
      'ordures',
      'assurance',
      'travaux',
      'energie',
      'autre'
    )
  );

ALTER TABLE charges
  DROP CONSTRAINT IF EXISTS charges_categorie_charge_check;

ALTER TABLE charges
  ADD CONSTRAINT charges_categorie_charge_check
  CHECK (
    categorie_charge IS NULL
    OR categorie_charge IN (
      'charges_locatives',
      'charges_non_recuperables',
      'taxes',
      'travaux_proprietaire',
      'travaux_locataire',
      'assurances',
      'energie'
    )
  );

CREATE INDEX IF NOT EXISTS idx_charges_categorie_charge ON charges(categorie_charge);

-- ============================================
-- INVOICES & PAYMENTS
-- ============================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS montant_ht DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS montant_tva DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS is_professional_lease BOOLEAN NOT NULL DEFAULT false;

UPDATE invoices
SET montant_ht = COALESCE(montant_ht, montant_total - montant_tva),
    montant_tva = COALESCE(montant_tva, 0),
    taux_tva = COALESCE(taux_tva, 0),
    is_professional_lease = COALESCE(is_professional_lease, false);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS montant_ht DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS montant_tva DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS montant_ttc DECIMAL(12,2) DEFAULT 0;

-- ============================================
-- FINALISATION
-- ============================================

COMMIT;

