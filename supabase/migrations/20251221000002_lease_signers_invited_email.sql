-- =====================================================
-- Migration: Ajouter invited_email aux lease_signers
-- Date: 2024-12-21
-- =====================================================
-- Cette colonne stocke l'email d'invitation pour les signataires
-- qui n'ont pas encore créé leur compte.
-- =====================================================

BEGIN;

-- Ajouter la colonne invited_email si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lease_signers' 
        AND column_name = 'invited_email'
    ) THEN
        ALTER TABLE lease_signers 
        ADD COLUMN invited_email VARCHAR(255);
        
        COMMENT ON COLUMN lease_signers.invited_email IS 
            'Email utilisé pour l''invitation, avant que le signataire ne crée son compte';
    END IF;
END $$;

-- Index pour rechercher par email
CREATE INDEX IF NOT EXISTS idx_lease_signers_invited_email 
ON lease_signers(invited_email) 
WHERE invited_email IS NOT NULL;

COMMIT;

