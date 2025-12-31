-- ============================================
-- Migration : Correction EDL_SIGNATURES schema
-- Date : 2025-12-31
-- Description : Rend signed_at nullable par défaut et ajoute signer_profile_id si manquant
-- ============================================

-- 1. Correction de signed_at (ne doit pas être NOW() par défaut)
ALTER TABLE public.edl_signatures 
ALTER COLUMN signed_at DROP DEFAULT,
ALTER COLUMN signed_at DROP NOT NULL;

-- 2. S'assurer que signer_profile_id existe (il semble déjà exister d'après le code mais par précaution)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl_signatures' AND column_name='signer_profile_id') THEN
        ALTER TABLE public.edl_signatures ADD COLUMN signer_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Ajouter une contrainte d'unicité pour éviter les doublons de signataires par EDL
ALTER TABLE public.edl_signatures
DROP CONSTRAINT IF EXISTS edl_signatures_edl_id_signer_profile_id_key;

ALTER TABLE public.edl_signatures
ADD CONSTRAINT edl_signatures_edl_id_signer_profile_id_key UNIQUE(edl_id, signer_profile_id);

-- 4. Nettoyage des données : mettre à NULL les signed_at qui n'ont pas d'image de signature (probablement des faux-positifs du NOW() par défaut)
UPDATE public.edl_signatures 
SET signed_at = NULL 
WHERE signature_image_path IS NULL;

