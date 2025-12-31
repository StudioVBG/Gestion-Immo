-- ============================================================================
-- Migration: Correction des statuts de baux existants
-- Date: 2025-12-29
-- Description: Met à jour les baux qui ont toutes les signatures mais un statut incorrect
-- ============================================================================

-- 1. Corriger les baux où TOUS les signataires ont signé mais le statut n'est pas "fully_signed"
UPDATE leases l
SET statut = 'fully_signed'
WHERE l.statut IN ('pending_signature', 'partially_signed', 'sent', 'draft')
  AND NOT EXISTS (
    -- S'assurer qu'il n'y a aucun signataire qui n'a pas signé
    SELECT 1 
    FROM lease_signers ls 
    WHERE ls.lease_id = l.id 
      AND ls.signature_status != 'signed'
  )
  AND EXISTS (
    -- S'assurer qu'il y a au moins un signataire
    SELECT 1 
    FROM lease_signers ls 
    WHERE ls.lease_id = l.id
  );

-- 2. Créer ou remplacer le trigger qui met à jour automatiquement le statut du bail
CREATE OR REPLACE FUNCTION update_lease_status_on_signature()
RETURNS TRIGGER AS $$
DECLARE
  v_all_signed BOOLEAN;
  v_signer_count INTEGER;
  v_signed_count INTEGER;
BEGIN
  -- Compter le nombre total de signataires et ceux qui ont signé
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE signature_status = 'signed')
  INTO v_signer_count, v_signed_count
  FROM lease_signers
  WHERE lease_id = NEW.lease_id;

  -- Déterminer si tous ont signé
  v_all_signed := (v_signer_count > 0 AND v_signer_count = v_signed_count);

  -- Mettre à jour le statut du bail
  IF v_all_signed THEN
    UPDATE leases 
    SET statut = 'fully_signed', updated_at = NOW()
    WHERE id = NEW.lease_id 
      AND statut NOT IN ('fully_signed', 'active', 'terminated', 'archived');
    
    RAISE NOTICE 'Bail % passé à fully_signed (% signataires)', NEW.lease_id, v_signer_count;
  ELSIF v_signed_count > 0 THEN
    UPDATE leases 
    SET statut = 'partially_signed', updated_at = NOW()
    WHERE id = NEW.lease_id 
      AND statut IN ('pending_signature', 'sent', 'draft');
    
    RAISE NOTICE 'Bail % passé à partially_signed (%/% signataires)', NEW.lease_id, v_signed_count, v_signer_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_update_lease_status_on_signature ON lease_signers;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_update_lease_status_on_signature
  AFTER UPDATE OF signature_status ON lease_signers
  FOR EACH ROW
  WHEN (NEW.signature_status = 'signed' AND OLD.signature_status != 'signed')
  EXECUTE FUNCTION update_lease_status_on_signature();

-- 3. Afficher les baux corrigés (pour le log)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM leases 
  WHERE statut = 'fully_signed';
  
  RAISE NOTICE 'Nombre total de baux avec statut fully_signed: %', v_count;
END $$;

