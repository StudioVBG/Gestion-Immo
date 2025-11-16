-- Migration : Mise à jour de la table api_credentials pour ajouter les colonnes nécessaires
-- pour la gestion complète des clés API (nom, hash, chiffrement, statut, rotation)

-- Ajouter les colonnes manquantes à api_credentials
ALTER TABLE api_credentials
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS key_hash TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_key TEXT,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rotated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

-- Rendre env et secret_ref optionnels (car on utilise maintenant encrypted_key)
ALTER TABLE api_credentials
  ALTER COLUMN env DROP NOT NULL,
  ALTER COLUMN secret_ref DROP NOT NULL;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_api_credentials_name ON api_credentials(name);
CREATE INDEX IF NOT EXISTS idx_api_credentials_is_active ON api_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_api_credentials_created_by ON api_credentials(created_by);
CREATE INDEX IF NOT EXISTS idx_api_credentials_key_hash ON api_credentials(key_hash);

-- Commentaires pour documentation
COMMENT ON COLUMN api_credentials.name IS 'Nom descriptif de la clé API';
COMMENT ON COLUMN api_credentials.key_hash IS 'Hash SHA-256 de la clé API (pour vérification)';
COMMENT ON COLUMN api_credentials.encrypted_key IS 'Clé API chiffrée avec AES-256-GCM';
COMMENT ON COLUMN api_credentials.permissions IS 'Permissions JSON de la clé';
COMMENT ON COLUMN api_credentials.is_active IS 'Statut actif/inactif de la clé';
COMMENT ON COLUMN api_credentials.created_by IS 'Utilisateur qui a créé la clé';
COMMENT ON COLUMN api_credentials.rotated_at IS 'Date de dernière rotation';
COMMENT ON COLUMN api_credentials.rotated_by IS 'Utilisateur qui a rotaté la clé';
COMMENT ON COLUMN api_credentials.disabled_at IS 'Date de désactivation';





