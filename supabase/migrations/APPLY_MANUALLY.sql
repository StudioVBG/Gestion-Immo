-- ============================================================================
-- SCRIPT À EXÉCUTER MANUELLEMENT DANS SUPABASE SQL EDITOR
-- Copier-coller ce script dans le SQL Editor de Supabase Dashboard
-- Date: 2025-12-29
-- ============================================================================

-- 1. CORRECTION DES CONTRAINTES DE STATUT DES BAUX
-- ============================================================================
ALTER TABLE leases 
DROP CONSTRAINT IF EXISTS leases_statut_check;

ALTER TABLE leases
ADD CONSTRAINT leases_statut_check
CHECK (statut IN (
  'draft',
  'sent',
  'pending_signature',
  'partially_signed',
  'pending_owner_signature',
  'fully_signed',
  'active',
  'amended',
  'suspended',
  'terminated',
  'archived'
));

-- 2. CRÉATION DES TABLES DPE (SI ELLES N'EXISTENT PAS)
-- ============================================================================

-- Enum pour le cycle de vie de la demande DPE
DO $$ BEGIN
  CREATE TYPE public.dpe_request_status AS ENUM (
    'REQUESTED', 'QUOTE_RECEIVED', 'SCHEDULED', 'DONE', 'DELIVERED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table des diagnostiqueurs
CREATE TABLE IF NOT EXISTS public.dpe_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  siret TEXT,
  certification_number TEXT,
  notes TEXT
);

-- Table des demandes DPE
CREATE TABLE IF NOT EXISTS public.dpe_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES dpe_providers(id) ON DELETE SET NULL,
  status public.dpe_request_status NOT NULL DEFAULT 'REQUESTED',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  contact_phone TEXT,
  contact_email TEXT
);

-- Table des devis DPE
CREATE TABLE IF NOT EXISTS public.dpe_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_id UUID NOT NULL REFERENCES dpe_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES dpe_providers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  valid_until DATE,
  accepted BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Table des rapports DPE livrés
CREATE TABLE IF NOT EXISTS public.dpe_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  request_id UUID REFERENCES dpe_requests(id) ON DELETE SET NULL,
  dpe_number TEXT,
  energy_class CHAR(1) CHECK (energy_class IN ('A','B','C','D','E','F','G')),
  ges_class CHAR(1) CHECK (ges_class IN ('A','B','C','D','E','F','G')),
  energy_consumption DECIMAL(10,2),
  ges_emission DECIMAL(10,2),
  issued_at DATE NOT NULL,
  valid_until DATE NOT NULL,
  storage_path TEXT,
  raw_data JSONB
);

-- Fonction pour calculer la validité DPE
CREATE OR REPLACE FUNCTION compute_dpe_valid_until(issued DATE)
RETURNS DATE
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF issued < '2013-01-01' THEN
    RETURN issued + INTERVAL '10 years';
  ELSIF issued BETWEEN '2013-01-01' AND '2017-12-31' THEN
    RETURN LEAST('2022-12-31'::date, issued + INTERVAL '10 years');
  ELSIF issued BETWEEN '2018-01-01' AND '2021-06-30' THEN
    RETURN LEAST('2024-12-31'::date, issued + INTERVAL '10 years');
  ELSE
    RETURN issued + INTERVAL '10 years';
  END IF;
END $$;

-- 3. POLITIQUES RLS POUR LES TABLES DPE
-- ============================================================================
ALTER TABLE dpe_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpe_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpe_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpe_deliverables ENABLE ROW LEVEL SECURITY;

-- Policies dpe_providers
DROP POLICY IF EXISTS "dpe_providers_owner_select" ON dpe_providers;
CREATE POLICY "dpe_providers_owner_select" ON dpe_providers
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "dpe_providers_owner_all" ON dpe_providers;
CREATE POLICY "dpe_providers_owner_all" ON dpe_providers
  FOR ALL USING (owner_id = auth.uid());

-- Policies dpe_requests
DROP POLICY IF EXISTS "dpe_requests_owner_select" ON dpe_requests;
CREATE POLICY "dpe_requests_owner_select" ON dpe_requests
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "dpe_requests_owner_all" ON dpe_requests;
CREATE POLICY "dpe_requests_owner_all" ON dpe_requests
  FOR ALL USING (owner_id = auth.uid());

-- Policies dpe_quotes
DROP POLICY IF EXISTS "dpe_quotes_owner_select" ON dpe_quotes;
CREATE POLICY "dpe_quotes_owner_select" ON dpe_quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dpe_requests r 
      WHERE r.id = dpe_quotes.request_id AND r.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dpe_quotes_owner_all" ON dpe_quotes;
CREATE POLICY "dpe_quotes_owner_all" ON dpe_quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM dpe_requests r 
      WHERE r.id = dpe_quotes.request_id AND r.owner_id = auth.uid()
    )
  );

-- Policies dpe_deliverables
DROP POLICY IF EXISTS "dpe_deliverables_owner_select" ON dpe_deliverables;
CREATE POLICY "dpe_deliverables_owner_select" ON dpe_deliverables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = dpe_deliverables.property_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dpe_deliverables_owner_all" ON dpe_deliverables;
CREATE POLICY "dpe_deliverables_owner_all" ON dpe_deliverables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = dpe_deliverables.property_id AND p.owner_id = auth.uid()
    )
  );

-- 4. TRIGGER POUR METTRE À JOUR LE STATUT DU BAIL APRÈS SIGNATURE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_lease_status_on_signature()
RETURNS TRIGGER AS $$
DECLARE
  total_signers INT;
  signed_signers INT;
  owner_signed BOOLEAN;
  all_tenants_signed BOOLEAN;
  new_status TEXT;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE signature_status = 'signed'),
    BOOL_OR(role = 'proprietaire' AND signature_status = 'signed'),
    NOT EXISTS (
      SELECT 1 FROM lease_signers 
      WHERE lease_id = NEW.lease_id 
        AND role IN ('locataire_principal', 'colocataire')
        AND signature_status != 'signed'
    )
  INTO total_signers, signed_signers, owner_signed, all_tenants_signed
  FROM lease_signers
  WHERE lease_id = NEW.lease_id;

  IF signed_signers = total_signers THEN
    new_status := 'fully_signed';
  ELSIF signed_signers > 0 THEN
    new_status := 'partially_signed';
  ELSE
    new_status := 'pending_signature';
  END IF;

  UPDATE leases 
  SET statut = new_status, updated_at = now()
  WHERE id = NEW.lease_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lease_status ON lease_signers;
CREATE TRIGGER trigger_update_lease_status
AFTER UPDATE OF signature_status ON lease_signers
FOR EACH ROW
WHEN (NEW.signature_status = 'signed')
EXECUTE FUNCTION update_lease_status_on_signature();

-- 5. CORRIGER LES BAUX EXISTANTS DONT LE STATUT EST INCORRECT
-- ============================================================================
UPDATE leases l
SET statut = 'fully_signed', updated_at = now()
WHERE l.statut IN ('pending_signature', 'partially_signed', 'sent', 'draft')
  AND NOT EXISTS (
    SELECT 1 FROM lease_signers ls 
    WHERE ls.lease_id = l.id 
      AND ls.signature_status != 'signed'
  )
  AND EXISTS (
    SELECT 1 FROM lease_signers ls 
    WHERE ls.lease_id = l.id
  );

-- 6. CRÉATION DES BUCKETS STORAGE (SI MANQUANTS)
-- ============================================================================

-- Bucket "avatars" (Public pour affichage direct)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket "documents" (Privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50 Mo max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7. POLITIQUES RLS POUR STORAGE
-- ============================================================================

-- Policies pour le bucket AVATARS
DROP POLICY IF EXISTS "Users can manage own avatars" ON storage.objects;
CREATE POLICY "Users can manage own avatars"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policies pour le bucket DOCUMENTS
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Users can view accessible documents" ON storage.objects;
CREATE POLICY "Users can view accessible documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    -- Propriétaire via edl (edl -> properties)
    OR EXISTS (
      SELECT 1 FROM public.edl e
      LEFT JOIN public.leases l ON l.id = e.lease_id
      JOIN public.properties p ON p.id = COALESCE(e.property_id, l.property_id)
      WHERE (storage.foldername(storage.objects.name))[1] = 'edl'
      AND (storage.foldername(storage.objects.name))[2] = e.id::text
      AND p.owner_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
    -- Propriétaire via ddt
    OR (
      (storage.foldername(storage.objects.name))[1] = 'ddt'
      AND (storage.foldername(storage.objects.name))[2] = auth.uid()::text
    )
    -- Dossier personnel
    OR (storage.foldername(storage.objects.name))[1] = auth.uid()::text
  )
);

-- Retourner le nombre de baux corrigés
SELECT 
  statut,
  COUNT(*) as count
FROM leases
GROUP BY statut
ORDER BY count DESC;

-- 8. MISE À JOUR DE LA TABLE EDL
-- ============================================================================
-- Suppression de la contrainte NOT NULL sur lease_id car on peut vouloir un EDL orphelin
ALTER TABLE public.edl ALTER COLUMN lease_id DROP NOT NULL;

-- Ajout des colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl' AND column_name='property_id') THEN
        ALTER TABLE public.edl ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl' AND column_name='general_notes') THEN
        ALTER TABLE public.edl ADD COLUMN general_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl' AND column_name='scheduled_at') THEN
        ALTER TABLE public.edl ADD COLUMN scheduled_at TIMESTAMPTZ;
    END IF;
END $$;

-- Mise à jour de la contrainte de statut pour inclure 'scheduled'
ALTER TABLE public.edl DROP CONSTRAINT IF EXISTS edl_status_check;
ALTER TABLE public.edl ADD CONSTRAINT edl_status_check 
CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'signed', 'disputed'));

-- 9. RELEVÉS DE COMPTEURS EDL
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.edl_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edl_id UUID NOT NULL REFERENCES edl(id) ON DELETE CASCADE,
  meter_id UUID NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  reading_value NUMERIC(12, 2) NOT NULL,
  reading_unit TEXT NOT NULL DEFAULT 'kWh',
  photo_path TEXT NOT NULL,
  photo_taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ocr_value NUMERIC(12, 2),
  ocr_confidence NUMERIC(5, 2),
  ocr_provider TEXT,
  ocr_raw_text TEXT,
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  validation_comment TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_by_role TEXT NOT NULL CHECK (recorded_by_role IN ('owner', 'tenant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(edl_id, meter_id)
);

-- RLS pour edl_meter_readings
ALTER TABLE edl_meter_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signers_can_view_edl_meter_readings" ON edl_meter_readings;
CREATE POLICY "signers_can_view_edl_meter_readings" ON edl_meter_readings
  FOR SELECT USING (
    edl_id IN (
      SELECT e.id FROM edl e
      LEFT JOIN leases l ON e.lease_id = l.id
      JOIN lease_signers ls ON ls.lease_id = l.id
      WHERE ls.profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      
      UNION ALL
      
      -- If EDL is directly linked to property but no active lease yet
      SELECT e.id FROM edl e
      JOIN properties p ON e.property_id = p.id
      WHERE p.owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "owners_can_manage_edl_meter_readings" ON edl_meter_readings;
CREATE POLICY "owners_can_manage_edl_meter_readings" ON edl_meter_readings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM edl e
      LEFT JOIN leases l ON e.lease_id = l.id
      JOIN properties p ON p.id = COALESCE(e.property_id, l.property_id)
      WHERE e.id = edl_meter_readings.edl_id
      AND p.owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- 10. RLS pour meter_readings (relevés de compteurs généraux)
-- ============================================================================
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_can_manage_meter_readings" ON meter_readings;
CREATE POLICY "owners_can_manage_meter_readings" ON meter_readings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meters m
      JOIN properties p ON m.property_id = p.id
      WHERE m.id = meter_readings.meter_id
      AND p.owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "tenants_can_view_meter_readings" ON meter_readings;
CREATE POLICY "tenants_can_view_meter_readings" ON meter_readings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meters m
      JOIN leases l ON m.property_id = l.property_id
      JOIN lease_signers ls ON ls.lease_id = l.id
      WHERE m.id = meter_readings.meter_id
      AND ls.profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- SECTION 9: FIX EDL - Lier les EDL existants aux baux et nettoyer
-- ============================================================================

-- 9.1 Lier tous les EDL sans lease_id au bail actif de leur propriété
UPDATE edl
SET lease_id = (
  SELECT l.id FROM leases l
  WHERE l.property_id = edl.property_id
  AND l.statut IN ('active', 'fully_signed', 'partially_signed', 'pending_signature')
  ORDER BY l.created_at DESC
  LIMIT 1
)
WHERE lease_id IS NULL
  AND property_id IS NOT NULL;

-- 9.2 Supprimer les EDL brouillons dupliqués (garder le plus récent par bail/type)
-- On considère comme doublon un EDL en draft/scheduled qui n'a pas de contenu
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY COALESCE(lease_id, property_id), type ORDER BY created_at DESC) as rang
  FROM edl
  WHERE status IN ('draft', 'scheduled')
    -- IMPORTANT: On ne supprime que si l'EDL est vide
    AND NOT EXISTS (SELECT 1 FROM edl_items WHERE edl_id = edl.id)
    AND NOT EXISTS (SELECT 1 FROM edl_media WHERE edl_id = edl.id)
)
DELETE FROM edl
WHERE id IN (SELECT id FROM duplicates WHERE rang > 1);

-- 9.3 Afficher le résultat pour contrôle
DO $$
DECLARE
  linked_count INTEGER;
  total_edl INTEGER;
BEGIN
  SELECT COUNT(*) INTO linked_count FROM edl WHERE lease_id IS NOT NULL;
  SELECT COUNT(*) INTO total_edl FROM edl;
  RAISE NOTICE 'Total EDL: %, EDL liés à un bail: %', total_edl, linked_count;
END $$;

-- 11. SIGNATURES EDL & INVITATIONS
-- ============================================================================
-- S'assurer que la table edl_signatures a les bonnes colonnes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl_signatures' AND column_name='signature_image_path') THEN
        ALTER TABLE public.edl_signatures ADD COLUMN signature_image_path TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl_signatures' AND column_name='ip_inet') THEN
        ALTER TABLE public.edl_signatures ADD COLUMN ip_inet INET;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl_signatures' AND column_name='user_agent') THEN
        ALTER TABLE public.edl_signatures ADD COLUMN user_agent TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl_signatures' AND column_name='invitation_token') THEN
        ALTER TABLE public.edl_signatures ADD COLUMN invitation_token UUID DEFAULT gen_random_uuid();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl_signatures' AND column_name='invitation_sent_at') THEN
        ALTER TABLE public.edl_signatures ADD COLUMN invitation_sent_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl_signatures' AND column_name='signer_profile_id') THEN
        ALTER TABLE public.edl_signatures ADD COLUMN signer_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- RLS pour edl_signatures
ALTER TABLE public.edl_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signers_can_view_edl_signatures" ON public.edl_signatures;
CREATE POLICY "signers_can_view_edl_signatures" ON public.edl_signatures
  FOR SELECT USING (
    edl_id IN (
      SELECT e.id FROM edl e
      LEFT JOIN leases l ON e.lease_id = l.id
      JOIN lease_signers ls ON ls.lease_id = l.id
      WHERE ls.profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      
      UNION ALL
      
      SELECT e.id FROM edl e
      JOIN properties p ON e.property_id = p.id
      WHERE p.owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "users_can_insert_own_edl_signature" ON public.edl_signatures;
CREATE POLICY "users_can_insert_own_edl_signature" ON public.edl_signatures
  FOR INSERT WITH CHECK (
    auth.uid() = signer_user
  );

-- 12. NETTOYAGE DES SIGNATURES FANTÔMES (SANS IMAGE TACTILE)
-- ============================================================================
-- Supprimer les signatures d'EDL qui n'ont pas d'image associée (créées par erreur automatiquement)
DELETE FROM public.edl_signatures 
WHERE signature_image_path IS NULL;

-- Remettre les EDL en statut 'draft' ou 'completed' s'ils étaient passés en 'signed' sans signatures réelles
UPDATE public.edl e
SET status = 'completed'
WHERE status = 'signed'
  AND (SELECT COUNT(*) FROM public.edl_signatures WHERE edl_id = e.id) < 2;

-- 13. AJOUTER COLONNE SECTION À EDL_MEDIA & RLS
-- ============================================================================
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edl_media' AND column_name='section') THEN
        ALTER TABLE public.edl_media ADD COLUMN section TEXT;
    END IF;
END $$;

-- RLS pour edl_media
ALTER TABLE public.edl_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_manage_edl_media" ON public.edl_media;
CREATE POLICY "owners_manage_edl_media" ON public.edl_media
  FOR ALL USING (
    edl_id IN (
      SELECT e.id FROM edl e
      LEFT JOIN leases l ON e.lease_id = l.id
      LEFT JOIN properties p ON COALESCE(e.property_id, l.property_id) = p.id
      WHERE p.owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "signers_view_edl_media" ON public.edl_media;
CREATE POLICY "signers_view_edl_media" ON public.edl_media
  FOR SELECT USING (
    edl_id IN (
      SELECT e.id FROM edl e
      JOIN leases l ON e.lease_id = l.id
      JOIN lease_signers ls ON ls.lease_id = l.id
      WHERE ls.profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- 14. POLITIQUE RLS PERMISSIVE POUR UPLOAD SIGNATURES
-- ============================================================================
-- Le chemin de signature est: edl/{edl_id}/signatures/{user_id}_{timestamp}.png
-- Autoriser tout utilisateur authentifié à uploader/lire ses propres signatures

DROP POLICY IF EXISTS "Users can manage edl signatures storage" ON storage.objects;
CREATE POLICY "Users can manage edl signatures storage"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    -- Accès à ses propres fichiers (dossier contenant user_id)
    storage.filename(name) LIKE concat(auth.uid()::text, '%')
    -- Ou chemin edl/{edl_id}/signatures/
    OR (
      (storage.foldername(name))[1] = 'edl'
      AND (storage.foldername(name))[3] = 'signatures'
    )
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (
    storage.filename(name) LIKE concat(auth.uid()::text, '%')
    OR (
      (storage.foldername(name))[1] = 'edl'
      AND (storage.foldername(name))[3] = 'signatures'
    )
  )
);

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

