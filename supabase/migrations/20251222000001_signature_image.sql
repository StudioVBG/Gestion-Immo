-- Migration: Ajouter la colonne signature_image à lease_signers
-- Date: 2025-12-22
-- Description: Permet de stocker l'image de signature (base64 ou URL) pour l'afficher sur le bail

-- Ajouter la colonne signature_image si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lease_signers' 
    AND column_name = 'signature_image'
  ) THEN
    ALTER TABLE lease_signers ADD COLUMN signature_image TEXT;
    COMMENT ON COLUMN lease_signers.signature_image IS 'Image de signature en base64 (data:image/png;base64,...) ou URL';
  END IF;
END $$;

-- Index pour optimiser les requêtes sur les signataires avec signature
CREATE INDEX IF NOT EXISTS idx_lease_signers_has_signature 
  ON lease_signers(lease_id) 
  WHERE signature_status = 'signed' AND signature_image IS NOT NULL;






