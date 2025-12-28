-- =====================================================
-- Migration: Optimisation du cache des documents générés
-- Date: 2024-12-21
-- Pattern: Création unique → Lectures multiples
-- =====================================================
-- 
-- Cette migration ajoute les structures nécessaires pour implémenter
-- le pattern "création unique → lectures multiples" pour tous les
-- documents générés (quittances, baux, EDL, factures, etc.)
--
-- Principe:
-- 1. Un document est généré UNE SEULE FOIS lors de la première demande
-- 2. Stocké dans Supabase Storage avec référence dans la table documents
-- 3. Les demandes suivantes retournent le document stocké via URL signée
-- 4. Un hash permet d'invalider le cache si les données source changent
-- =====================================================

BEGIN;

-- ============================================
-- ÉTENDRE LA TABLE DOCUMENTS
-- ============================================

-- Ajouter colonne content_hash pour déduplication rapide
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'content_hash'
  ) THEN
    ALTER TABLE documents ADD COLUMN content_hash TEXT;
    COMMENT ON COLUMN documents.content_hash IS 'Hash SHA256 du contenu/données source pour cache invalidation';
  END IF;
END $$;

-- Ajouter colonne is_generated pour distinguer documents uploadés vs générés
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'is_generated'
  ) THEN
    ALTER TABLE documents ADD COLUMN is_generated BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN documents.is_generated IS 'TRUE si document généré automatiquement (PDF), FALSE si uploadé manuellement';
  END IF;
END $$;

-- Ajouter colonne generation_source pour traçabilité
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'generation_source'
  ) THEN
    ALTER TABLE documents ADD COLUMN generation_source TEXT;
    COMMENT ON COLUMN documents.generation_source IS 'Source de génération: api_receipt, api_lease_pdf, edge_function, etc.';
  END IF;
END $$;

-- ============================================
-- INDEX POUR RECHERCHE RAPIDE
-- ============================================

-- Index sur le hash pour recherche par contenu (déduplication)
CREATE INDEX IF NOT EXISTS idx_documents_content_hash 
  ON documents(content_hash) 
  WHERE content_hash IS NOT NULL;

-- Index composite pour les quittances (recherche fréquente)
CREATE INDEX IF NOT EXISTS idx_documents_quittance_lookup 
  ON documents(type, tenant_id, lease_id) 
  WHERE type = 'quittance';

-- Index composite pour les baux
CREATE INDEX IF NOT EXISTS idx_documents_bail_lookup 
  ON documents(type, lease_id) 
  WHERE type = 'bail';

-- Index sur metadata->hash (utilisé par les API)
CREATE INDEX IF NOT EXISTS idx_documents_metadata_hash 
  ON documents((metadata->>'hash'))
  WHERE metadata->>'hash' IS NOT NULL;

-- Index sur metadata->payment_id (pour quittances)
CREATE INDEX IF NOT EXISTS idx_documents_metadata_payment 
  ON documents((metadata->>'payment_id'))
  WHERE metadata->>'payment_id' IS NOT NULL;

-- Index sur is_generated
CREATE INDEX IF NOT EXISTS idx_documents_is_generated
  ON documents(is_generated)
  WHERE is_generated = TRUE;

-- ============================================
-- TABLE DE CACHE DES APERÇUS HTML (optionnel)
-- ============================================

CREATE TABLE IF NOT EXISTS preview_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Clé de cache (composite unique)
  cache_key TEXT NOT NULL,
  
  -- Type d'aperçu
  preview_type TEXT NOT NULL CHECK (preview_type IN ('lease', 'receipt', 'edl', 'invoice', 'other')),
  
  -- Contenu HTML généré
  html_content TEXT NOT NULL,
  
  -- Métadonnées
  data_hash TEXT NOT NULL,
  
  -- TTL - expire après 1 heure par défaut
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  
  -- Tracking
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT preview_cache_key_unique UNIQUE (cache_key),
  CONSTRAINT preview_cache_valid_expiry CHECK (expires_at > created_at)
);

-- Index pour nettoyage automatique des aperçus expirés
CREATE INDEX IF NOT EXISTS idx_preview_cache_expires 
  ON preview_cache(expires_at);

-- Index pour recherche par type et hash
CREATE INDEX IF NOT EXISTS idx_preview_cache_lookup
  ON preview_cache(preview_type, data_hash);

-- ============================================
-- FONCTION DE NETTOYAGE DES APERÇUS EXPIRÉS
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_previews()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM preview_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log si beaucoup de suppressions
  IF deleted_count > 100 THEN
    RAISE NOTICE 'cleanup_expired_previews: % aperçus expirés supprimés', deleted_count;
  END IF;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION POUR OBTENIR OU MARQUER CRÉATION
-- ============================================

CREATE OR REPLACE FUNCTION get_or_mark_document_creation(
  p_type TEXT,
  p_hash TEXT,
  p_lease_id UUID DEFAULT NULL,
  p_property_id UUID DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_payment_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  document_id UUID,
  storage_path TEXT,
  is_new BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_existing_doc RECORD;
BEGIN
  -- Chercher document existant par type et hash
  SELECT d.id, d.storage_path, d.created_at INTO v_existing_doc
  FROM documents d
  WHERE d.type = p_type
    AND (
      d.content_hash = p_hash 
      OR d.metadata->>'hash' = p_hash
      OR (p_payment_id IS NOT NULL AND d.metadata->>'payment_id' = p_payment_id)
    )
    AND (p_lease_id IS NULL OR d.lease_id = p_lease_id)
    AND (p_property_id IS NULL OR d.property_id = p_property_id)
    AND (p_owner_id IS NULL OR d.owner_id = p_owner_id)
    AND (p_tenant_id IS NULL OR d.tenant_id = p_tenant_id)
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF v_existing_doc.id IS NOT NULL THEN
    -- Document existe → retourner pour LECTURE
    RETURN QUERY SELECT 
      v_existing_doc.id, 
      v_existing_doc.storage_path, 
      FALSE::BOOLEAN,
      v_existing_doc.created_at;
  ELSE
    -- Document n'existe pas → signaler pour CRÉATION
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::TEXT, 
      TRUE::BOOLEAN,
      NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_or_mark_document_creation IS 
  'Vérifie si un document existe déjà pour éviter régénération (pattern création unique → lectures multiples)';

-- ============================================
-- FONCTION POUR METTRE À JOUR LE COMPTEUR D'APERÇU
-- ============================================

CREATE OR REPLACE FUNCTION update_preview_cache_hit(p_cache_key TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE preview_cache
  SET 
    hit_count = hit_count + 1,
    last_accessed_at = NOW(),
    -- Prolonger le TTL si souvent accédé
    expires_at = CASE 
      WHEN hit_count > 10 THEN GREATEST(expires_at, NOW() + INTERVAL '2 hours')
      ELSE expires_at
    END
  WHERE cache_key = p_cache_key;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER POUR NETTOYER LES VIEUX APERÇUS
-- ============================================

-- Supprimer automatiquement les aperçus après insertion si trop nombreux
CREATE OR REPLACE FUNCTION cleanup_old_previews_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Si plus de 10000 aperçus, supprimer les plus anciens
  IF (SELECT COUNT(*) FROM preview_cache) > 10000 THEN
    DELETE FROM preview_cache
    WHERE id IN (
      SELECT id FROM preview_cache
      ORDER BY last_accessed_at NULLS FIRST, created_at
      LIMIT 1000
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_old_previews ON preview_cache;
CREATE TRIGGER trg_cleanup_old_previews
  AFTER INSERT ON preview_cache
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_previews_on_insert();

-- ============================================
-- RLS POLICIES POUR PREVIEW_CACHE
-- ============================================

ALTER TABLE preview_cache ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés peuvent lire les aperçus
CREATE POLICY "Authenticated users can read previews" ON preview_cache
  FOR SELECT TO authenticated
  USING (true);

-- Seul le service peut insérer/modifier les aperçus
CREATE POLICY "Service role can manage previews" ON preview_cache
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- METTRE À JOUR LES DOCUMENTS EXISTANTS
-- ============================================

-- Marquer les documents générés existants
UPDATE documents
SET 
  is_generated = TRUE,
  generation_source = 'legacy_migration'
WHERE type IN ('quittance', 'bail', 'EDL_entree', 'EDL_sortie')
  AND is_generated IS NULL
  AND storage_path IS NOT NULL;

-- ============================================
-- STATISTIQUES POUR MONITORING
-- ============================================

CREATE OR REPLACE VIEW document_cache_stats AS
SELECT 
  type,
  is_generated,
  COUNT(*) as total_count,
  COUNT(CASE WHEN content_hash IS NOT NULL THEN 1 END) as with_hash,
  COUNT(CASE WHEN storage_path IS NOT NULL THEN 1 END) as with_storage,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM documents
GROUP BY type, is_generated
ORDER BY total_count DESC;

COMMENT ON VIEW document_cache_stats IS 
  'Vue de monitoring pour le cache des documents générés';

COMMIT;

-- ============================================
-- NOTES D'UTILISATION
-- ============================================
-- 
-- Pattern d'utilisation côté API:
-- 
-- 1. Appeler get_or_mark_document_creation() avec les paramètres
-- 2. Si is_new = FALSE: 
--    - Récupérer le document via storage_path
--    - Générer une URL signée
--    - Retourner au client
-- 3. Si is_new = TRUE:
--    - Générer le document (PDF)
--    - Uploader dans Supabase Storage
--    - Insérer dans la table documents
--    - Retourner l'URL signée
--
-- Exemple de requête pour vérifier un document:
-- 
-- SELECT * FROM get_or_mark_document_creation(
--   'quittance',           -- type
--   'abc123hash',          -- hash
--   'uuid-lease',          -- lease_id
--   NULL,                  -- property_id
--   NULL,                  -- owner_id
--   'uuid-tenant',         -- tenant_id
--   'uuid-payment'         -- payment_id
-- );
-- =====================================================

