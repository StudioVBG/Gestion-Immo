-- Migration : Table pour idempotency keys et colonnes 2FA

-- Table pour les clés d'idempotence
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- Nettoyage automatique des clés expirées (à exécuter via cron)
-- DELETE FROM idempotency_keys WHERE created_at < NOW() - INTERVAL '24 hours';
-- Les clés sont valides 24h

-- Ajouter les colonnes 2FA aux profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;

-- Ajouter les colonnes de suspension aux profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_two_factor_enabled ON profiles(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(suspended);

-- Commentaires
COMMENT ON COLUMN profiles.two_factor_secret IS 'Secret TOTP pour 2FA (à chiffrer en production)';
COMMENT ON COLUMN profiles.two_factor_enabled IS 'Indique si la 2FA est activée';
COMMENT ON COLUMN profiles.suspended IS 'Indique si le compte est suspendu';

