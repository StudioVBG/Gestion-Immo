-- Migration : Tables manquantes pour compte Locataire
-- Event bus, payment_intents, signature_evidence, unit_access_codes, audit_log, document_links, ticket_messages, appointments

-- ============================================
-- 1. EVENT BUS & OUTBOX (pour jobs asynchrones)
-- ============================================

CREATE TABLE IF NOT EXISTS outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- 'tenant.invite.accepted', 'application.ocr.completed', etc.
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_status ON outbox(status);
CREATE INDEX idx_outbox_scheduled_at ON outbox(scheduled_at);
CREATE INDEX idx_outbox_event_type ON outbox(event_type);
CREATE INDEX idx_outbox_pending ON outbox(status, scheduled_at) WHERE status = 'pending';

-- ============================================
-- 2. PAYMENT INTENTS (intentions de paiement)
-- ============================================

CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  payment_share_id UUID REFERENCES payment_shares(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  method TEXT NOT NULL CHECK (method IN ('cb', 'virement', 'prelevement', 'sct_inst')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'gocardless', 'internal')),
  provider_intent_id TEXT, -- ID retourné par le provider
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'succeeded', 'failed', 'canceled')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_intents_lease_id ON payment_intents(lease_id);
CREATE INDEX idx_payment_intents_payment_share_id ON payment_intents(payment_share_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_provider_intent_id ON payment_intents(provider_intent_id);

-- ============================================
-- 3. SIGNATURE EVIDENCE (preuves de signature)
-- ============================================

CREATE TABLE IF NOT EXISTS signature_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signature_id UUID NOT NULL REFERENCES signatures(id) ON DELETE CASCADE,
  doc_id UUID, -- Référence au document signé
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_inet INET,
  user_agent TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  timezone TEXT,
  signature_png_url TEXT, -- Image de la signature (canvas)
  payload_snapshot JSONB, -- Snapshot des données au moment de la signature
  doc_hash TEXT, -- SHA-256 du document signé
  evidence_pdf_url TEXT, -- PDF de preuve avec horodatage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signature_evidence_signature_id ON signature_evidence(signature_id);
CREATE INDEX idx_signature_evidence_doc_id ON signature_evidence(doc_id);
CREATE INDEX idx_signature_evidence_owner_id ON signature_evidence(owner_id);
CREATE INDEX idx_signature_evidence_signed_at ON signature_evidence(signed_at);

-- ============================================
-- 4. UNIT ACCESS CODES (codes d'invitation non réattribuables)
-- ============================================

CREATE TABLE IF NOT EXISTS unit_access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE, -- Code unique, jamais réattribué
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'retired')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at TIMESTAMPTZ,
  retired_reason TEXT
);

CREATE INDEX idx_unit_access_codes_code ON unit_access_codes(code);
CREATE INDEX idx_unit_access_codes_unit_id ON unit_access_codes(unit_id);
CREATE INDEX idx_unit_access_codes_status ON unit_access_codes(status);

-- Un seul code actif par unité (index partiel)
CREATE UNIQUE INDEX IF NOT EXISTS unit_access_codes_active_unit_idx
  ON unit_access_codes(unit_id)
  WHERE status = 'active';

-- Trigger pour retirer le code si l'unité est supprimée
CREATE OR REPLACE FUNCTION retire_unit_access_code_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE unit_access_codes
  SET status = 'retired',
      retired_at = NOW(),
      retired_reason = 'Unit deleted'
  WHERE unit_id = OLD.id AND status = 'active';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER unit_delete_retire_code
  AFTER DELETE ON units
  FOR EACH ROW
  EXECUTE FUNCTION retire_unit_access_code_on_delete();

-- ============================================
-- 5. AUDIT LOG (journalisation complète)
-- ============================================

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS before_state JSONB,
  ADD COLUMN IF NOT EXISTS after_state JSONB,
  ADD COLUMN IF NOT EXISTS ip_inet INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ============================================
-- 6. DOCUMENT LINKS (partage sécurisé)
-- ============================================

CREATE TABLE IF NOT EXISTS document_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- Token unique pour le lien
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_links_token ON document_links(token);
CREATE INDEX idx_document_links_document_id ON document_links(document_id);
CREATE INDEX idx_document_links_expires_at ON document_links(expires_at);

-- ============================================
-- 7. TICKET MESSAGES (messages dans tickets)
-- ============================================

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array de {url, name, size}
  is_internal BOOLEAN NOT NULL DEFAULT false, -- Message privé (propriétaire/gestionnaire)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_sender_user ON ticket_messages(sender_user);
CREATE INDEX idx_ticket_messages_created_at ON ticket_messages(created_at);

-- ============================================
-- 8. APPOINTMENTS (planification interventions)
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'canceled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_ticket_id ON appointments(ticket_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================
-- 9. GUARANTORS (garants - lecture seule pour locataire)
-- ============================================

CREATE TABLE IF NOT EXISTS guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relationship TEXT, -- 'parent', 'friend', 'employer', etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guarantors_lease_id ON guarantors(lease_id);
CREATE INDEX idx_guarantors_profile_id ON guarantors(profile_id);
CREATE INDEX idx_guarantors_user_id ON guarantors(user_id);

-- ============================================
-- 10. TRIGGERS updated_at
-- ============================================

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ticket_messages_updated_at BEFORE UPDATE ON ticket_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guarantors_updated_at BEFORE UPDATE ON guarantors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();





