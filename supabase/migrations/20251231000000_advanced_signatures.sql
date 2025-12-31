-- ============================================
-- Migration : Signature Électronique Avancée (Audit Trail)
-- Date : 2025-12-31
-- Description : Ajout des colonnes pour le dossier de preuve (eIDAS)
-- ============================================

-- 1. Mise à jour de EDL_SIGNATURES
ALTER TABLE public.edl_signatures 
ADD COLUMN IF NOT EXISTS proof_id TEXT,
ADD COLUMN IF NOT EXISTS proof_metadata JSONB,
ADD COLUMN IF NOT EXISTS document_hash TEXT;

-- Index pour la recherche par preuve
CREATE INDEX IF NOT EXISTS idx_edl_signatures_proof_id ON public.edl_signatures(proof_id);

-- 2. Mise à jour de LEASE_SIGNERS
ALTER TABLE public.lease_signers
ADD COLUMN IF NOT EXISTS signature_image_path TEXT,
ADD COLUMN IF NOT EXISTS ip_inet INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS proof_id TEXT,
ADD COLUMN IF NOT EXISTS proof_metadata JSONB,
ADD COLUMN IF NOT EXISTS document_hash TEXT;

-- Index pour la recherche par preuve
CREATE INDEX IF NOT EXISTS idx_lease_signers_proof_id ON public.lease_signers(proof_id);

-- 3. Commentaires pour la documentation
COMMENT ON COLUMN public.edl_signatures.proof_id IS 'Identifiant unique du dossier de preuve (Audit Trail)';
COMMENT ON COLUMN public.edl_signatures.proof_metadata IS 'Dossier de preuve complet (JSON) conforme eIDAS';
COMMENT ON COLUMN public.edl_signatures.document_hash IS 'Empreinte SHA-256 du document au moment de la signature';

COMMENT ON COLUMN public.lease_signers.proof_id IS 'Identifiant unique du dossier de preuve (Audit Trail)';
COMMENT ON COLUMN public.lease_signers.proof_metadata IS 'Dossier de preuve complet (JSON) conforme eIDAS';
COMMENT ON COLUMN public.lease_signers.document_hash IS 'Empreinte SHA-256 du document au moment de la signature';
COMMENT ON COLUMN public.lease_signers.signature_image_path IS 'Chemin de l''image de signature tactile dans le storage';

