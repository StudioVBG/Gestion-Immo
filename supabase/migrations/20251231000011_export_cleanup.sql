-- Migration: 20251231000011_export_cleanup.sql

-- 1. Fonction de nettoyage des jobs expirés
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
    -- Marquer comme expirés dans la DB
    UPDATE export_jobs
    SET status = 'expired'
    WHERE expires_at < now()
    AND status != 'expired';

    -- Note: La suppression physique des fichiers dans Storage 
    -- doit être gérée par une Edge Function ou via une policy de cycle de vie du bucket.
END;
$$ LANGUAGE plpgsql;

-- 2. Activation de pg_cron si disponible (nécessite permissions superuser)
-- SELECT cron.schedule('cleanup-exports', '0 0 * * *', 'SELECT cleanup_expired_exports()');

