-- ============================================
-- MIGRATION SSOT 2026: Normalisation des rôles de signataires
-- ============================================
-- Cette migration normalise tous les rôles de signataires vers les valeurs standard:
-- - proprietaire (anciennement: owner, bailleur, Proprietaire, etc.)
-- - locataire_principal (anciennement: locataire, tenant, principal, Locataire, etc.)
-- - colocataire (anciennement: co_locataire, cotenant, etc.)
-- - garant (anciennement: caution, guarantor, etc.)
-- ============================================

-- 1. Normaliser les rôles de propriétaires
UPDATE lease_signers
SET role = 'proprietaire'
WHERE LOWER(TRIM(role)) IN ('owner', 'bailleur', 'proprietaire');

-- 2. Normaliser les rôles de locataires principaux
UPDATE lease_signers
SET role = 'locataire_principal'
WHERE LOWER(TRIM(role)) IN ('locataire', 'tenant', 'principal', 'locataire_principal');

-- 3. Normaliser les rôles de colocataires
UPDATE lease_signers
SET role = 'colocataire'
WHERE LOWER(TRIM(role)) IN ('co_locataire', 'cotenant', 'colocataire');

-- 4. Normaliser les rôles de garants
UPDATE lease_signers
SET role = 'garant'
WHERE LOWER(TRIM(role)) IN ('caution', 'guarantor', 'garant');

-- ============================================
-- Ajouter une contrainte CHECK pour valider les rôles futurs
-- ============================================
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE lease_signers DROP CONSTRAINT IF EXISTS lease_signers_role_check;
  
  -- Ajouter la nouvelle contrainte
  ALTER TABLE lease_signers ADD CONSTRAINT lease_signers_role_check 
  CHECK (role IN ('proprietaire', 'locataire_principal', 'colocataire', 'garant'));
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Contrainte lease_signers_role_check existe déjà';
END $$;

-- ============================================
-- Logs de la migration
-- ============================================
DO $$
DECLARE
  owner_count INTEGER;
  tenant_count INTEGER;
  cotenant_count INTEGER;
  garant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO owner_count FROM lease_signers WHERE role = 'proprietaire';
  SELECT COUNT(*) INTO tenant_count FROM lease_signers WHERE role = 'locataire_principal';
  SELECT COUNT(*) INTO cotenant_count FROM lease_signers WHERE role = 'colocataire';
  SELECT COUNT(*) INTO garant_count FROM lease_signers WHERE role = 'garant';
  
  RAISE NOTICE '=== Migration SSOT 2026 terminée ===';
  RAISE NOTICE 'Signataires propriétaires: %', owner_count;
  RAISE NOTICE 'Signataires locataires principaux: %', tenant_count;
  RAISE NOTICE 'Signataires colocataires: %', cotenant_count;
  RAISE NOTICE 'Signataires garants: %', garant_count;
END $$;

