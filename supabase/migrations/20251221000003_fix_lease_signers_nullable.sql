-- =====================================================
-- Migration: Corriger lease_signers pour invitations
-- Date: 2024-12-21
-- =====================================================
-- Cette migration permet d'inviter des signataires qui
-- n'ont pas encore de compte sur la plateforme.
-- =====================================================

BEGIN;

-- 1. Rendre profile_id nullable pour permettre les invitations sans compte
ALTER TABLE lease_signers 
ALTER COLUMN profile_id DROP NOT NULL;

-- 2. Ajouter la colonne invited_email si elle n'existe pas
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

-- 3. Ajouter une colonne pour suivre quand l'invitation a été envoyée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lease_signers' 
        AND column_name = 'invited_at'
    ) THEN
        ALTER TABLE lease_signers 
        ADD COLUMN invited_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 4. Ajouter une colonne pour le nom invité (avant création du profil)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lease_signers' 
        AND column_name = 'invited_name'
    ) THEN
        ALTER TABLE lease_signers 
        ADD COLUMN invited_name VARCHAR(255);
    END IF;
END $$;

-- 5. Index pour rechercher par email d'invitation
CREATE INDEX IF NOT EXISTS idx_lease_signers_invited_email 
ON lease_signers(invited_email) 
WHERE invited_email IS NOT NULL;

-- 6. Contrainte: soit profile_id soit invited_email doit être défini
-- (Commenté car peut casser les données existantes - à activer après nettoyage)
-- ALTER TABLE lease_signers
-- ADD CONSTRAINT check_profile_or_email 
-- CHECK (profile_id IS NOT NULL OR invited_email IS NOT NULL);

COMMIT;

