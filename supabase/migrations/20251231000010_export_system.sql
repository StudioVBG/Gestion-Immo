-- Migration: 20251231000010_export_system.sql

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_status') THEN
        CREATE TYPE export_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'expired');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'accounting', 'invoices', 'portability'
    format VARCHAR(10) NOT NULL, -- 'csv', 'json', 'xlsx'
    filters JSONB DEFAULT '{}',
    status export_status DEFAULT 'pending',
    storage_path TEXT,
    file_hash TEXT,
    record_count INTEGER DEFAULT 0,
    error_message TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour le cleanup
CREATE INDEX IF NOT EXISTS idx_export_jobs_expires_at ON export_jobs(expires_at) WHERE status != 'expired';

-- RLS
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own export jobs" ON export_jobs;
CREATE POLICY "Users can view their own export jobs"
    ON export_jobs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own export jobs" ON export_jobs;
CREATE POLICY "Users can create their own export jobs"
    ON export_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Audit log table if not exists (checked from grep results)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all audit logs" ON audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

