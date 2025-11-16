-- Migration : Architecture Locataire avancée
-- Colocation, Split paiements, Dossier OCR, Signatures, EDL, Compteurs, Chat, Notifications

-- ============================================
-- 1. COLOCATION & SPLIT PAIEMENTS
-- ============================================

-- Table des colocataires (remplace/étend lease_signers pour colocation)
CREATE TABLE IF NOT EXISTS roommates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('principal', 'tenant', 'occupant', 'guarantor')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 1.0), -- Poids pour split (1.0 = 100%)
  joined_on DATE NOT NULL DEFAULT CURRENT_DATE,
  left_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lease_id, user_id)
);

CREATE INDEX idx_roommates_lease_id ON roommates(lease_id);
CREATE INDEX idx_roommates_user_id ON roommates(user_id);
CREATE INDEX idx_roommates_profile_id ON roommates(profile_id);

-- Table des parts de paiement par colocataire
CREATE TABLE IF NOT EXISTS payment_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  month DATE NOT NULL, -- Premier jour du mois (YYYY-MM-01)
  roommate_id UUID NOT NULL REFERENCES roommates(id) ON DELETE CASCADE,
  due_amount NUMERIC(10, 2) NOT NULL CHECK (due_amount >= 0),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'pending', 'partial', 'paid', 'failed', 'scheduled')),
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  last_event_at TIMESTAMPTZ,
  autopay BOOLEAN NOT NULL DEFAULT false,
  provider TEXT, -- 'stripe', 'gocardless', etc.
  provider_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lease_id, month, roommate_id)
);

CREATE INDEX idx_payment_shares_lease_id ON payment_shares(lease_id);
CREATE INDEX idx_payment_shares_month ON payment_shares(month);
CREATE INDEX idx_payment_shares_roommate_id ON payment_shares(roommate_id);
CREATE INDEX idx_payment_shares_status ON payment_shares(status);
CREATE INDEX idx_payment_shares_lease_month ON payment_shares(lease_id, month);

-- Vue publique pour affichage entre colocs (montants masqués, statuts visibles)
CREATE OR REPLACE VIEW payment_shares_public AS
SELECT 
  id,
  lease_id,
  month,
  roommate_id,
  status,
  last_event_at,
  autopay,
  -- due_amount et amount_paid sont masqués (non inclus dans la vue)
  created_at
FROM payment_shares;

-- ============================================
-- 2. DOSSIER LOCATAIRE & OCR/IDP
-- ============================================

-- Table des dossiers de candidature locataire
CREATE TABLE IF NOT EXISTS tenant_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  tenant_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'docs_pending', 'review', 'ready_to_sign', 'signed', 'rejected')),
  extracted_json JSONB, -- Champs extraits par OCR/IDP
  confidence NUMERIC(5, 2) CHECK (confidence >= 0 AND confidence <= 100), -- Confiance globale (%)
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_applications_tenant_user ON tenant_applications(tenant_user);
CREATE INDEX idx_tenant_applications_unit_id ON tenant_applications(unit_id);
CREATE INDEX idx_tenant_applications_status ON tenant_applications(status);
CREATE INDEX idx_tenant_applications_extracted_json ON tenant_applications USING gin(extracted_json);

-- Table des fichiers uploadés (pièces d'identité, justificatifs)
CREATE TABLE IF NOT EXISTS application_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES tenant_applications(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('identity', 'income', 'address', 'guarantee', 'other')),
  storage_path TEXT NOT NULL,
  sha256 TEXT NOT NULL, -- Pour déduplication
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  ocr_provider TEXT, -- 'google_vision', 'aws_textract', etc.
  ocr_result JSONB,
  confidence NUMERIC(5, 2) CHECK (confidence >= 0 AND confidence <= 100)
);

CREATE INDEX idx_application_files_application_id ON application_files(application_id);
CREATE INDEX idx_application_files_kind ON application_files(kind);
CREATE INDEX idx_application_files_sha256 ON application_files(sha256);

-- Table des champs extraits avec confiance par champ
CREATE TABLE IF NOT EXISTS extracted_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES tenant_applications(id) ON DELETE CASCADE,
  file_id UUID REFERENCES application_files(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL, -- 'first_name', 'last_name', 'birthdate', 'income', 'iban', etc.
  field_value TEXT,
  confidence NUMERIC(5, 2) CHECK (confidence >= 0 AND confidence <= 100),
  source TEXT, -- 'ocr', 'manual', 'api'
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id, field_name)
);

CREATE INDEX idx_extracted_fields_application_id ON extracted_fields(application_id);
CREATE INDEX idx_extracted_fields_file_id ON extracted_fields(file_id);

-- ============================================
-- 3. BAUX & SIGNATURES AVANCÉES
-- ============================================

-- Table des modèles de baux
CREATE TABLE IF NOT EXISTS lease_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type_bail TEXT NOT NULL CHECK (type_bail IN ('nu', 'meuble', 'colocation', 'saisonnier')),
  template_content TEXT NOT NULL, -- Contenu du template (Markdown ou HTML)
  variables JSONB, -- Liste des variables disponibles
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lease_templates_type_bail ON lease_templates(type_bail);
CREATE INDEX idx_lease_templates_is_active ON lease_templates(is_active);

-- Table des brouillons de baux
CREATE TABLE IF NOT EXISTS lease_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES tenant_applications(id) ON DELETE SET NULL,
  lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  template_id UUID REFERENCES lease_templates(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb, -- Variables remplies
  pdf_url TEXT, -- URL du PDF généré
  pdf_hash TEXT, -- SHA256 du PDF pour intégrité
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lease_drafts_application_id ON lease_drafts(application_id);
CREATE INDEX idx_lease_drafts_lease_id ON lease_drafts(lease_id);

-- Table des signatures avec niveaux (SES/AES/QES)
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id UUID REFERENCES lease_drafts(id) ON DELETE SET NULL,
  lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  signer_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('SES', 'AES', 'QES')), -- Simple/Advanced/Qualified Electronic Signature
  otp_verified BOOLEAN DEFAULT false,
  otp_code TEXT, -- Code OTP pour vérification
  otp_expires_at TIMESTAMPTZ,
  ip_inet INET,
  user_agent TEXT,
  signed_at TIMESTAMPTZ,
  signature_image_path TEXT, -- Image de la signature (pour SES)
  evidence_pdf_url TEXT, -- PDF avec preuve de signature
  doc_hash TEXT NOT NULL, -- SHA256 du document signé
  provider_ref TEXT, -- Référence TSP (Yousign, DocuSign) si AES/QES
  provider_data JSONB, -- Données complémentaires du provider
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signatures_draft_id ON signatures(draft_id);
CREATE INDEX idx_signatures_lease_id ON signatures(lease_id);
CREATE INDEX idx_signatures_signer_user ON signatures(signer_user);
CREATE INDEX idx_signatures_level ON signatures(level);

-- ============================================
-- 4. ÉTATS DES LIEUX (EDL)
-- ============================================

-- Table des états des lieux
CREATE TABLE IF NOT EXISTS edl (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entree', 'sortie')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'signed', 'disputed')),
  scheduled_date DATE,
  completed_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_edl_lease_id ON edl(lease_id);
CREATE INDEX idx_edl_type ON edl(type);
CREATE INDEX idx_edl_status ON edl(status);

-- Table des items par pièce
CREATE TABLE IF NOT EXISTS edl_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edl_id UUID NOT NULL REFERENCES edl(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL, -- 'Salon', 'Chambre 1', etc.
  item_name TEXT NOT NULL, -- 'Mur nord', 'Fenêtre', 'Plancher', etc.
  condition TEXT CHECK (condition IN ('bon', 'moyen', 'mauvais', 'tres_mauvais')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_edl_items_edl_id ON edl_items(edl_id);
CREATE INDEX idx_edl_items_room_name ON edl_items(room_name);

-- Table des médias (photos/vidéos) pour EDL
CREATE TABLE IF NOT EXISTS edl_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edl_id UUID NOT NULL REFERENCES edl(id) ON DELETE CASCADE,
  item_id UUID REFERENCES edl_items(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  thumbnail_path TEXT,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_edl_media_edl_id ON edl_media(edl_id);
CREATE INDEX idx_edl_media_item_id ON edl_media(item_id);

-- Table des signatures EDL
CREATE TABLE IF NOT EXISTS edl_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edl_id UUID NOT NULL REFERENCES edl(id) ON DELETE CASCADE,
  signer_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signer_role TEXT NOT NULL CHECK (signer_role IN ('owner', 'tenant', 'witness')),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signature_image_path TEXT,
  ip_inet INET,
  user_agent TEXT
);

CREATE INDEX idx_edl_signatures_edl_id ON edl_signatures(edl_id);
CREATE INDEX idx_edl_signatures_signer_user ON edl_signatures(signer_user);

-- ============================================
-- 5. COMPTEURS & ÉNERGIE
-- ============================================

-- Table des compteurs
CREATE TABLE IF NOT EXISTS meters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('electricity', 'gas', 'water')),
  provider TEXT, -- 'enedis', 'grdf', 'veolia', etc.
  provider_meter_id TEXT, -- ID du compteur chez le provider
  is_connected BOOLEAN NOT NULL DEFAULT false, -- Connecté via API
  meter_number TEXT, -- Numéro du compteur
  unit TEXT NOT NULL DEFAULT 'kwh' CHECK (unit IN ('kwh', 'm3', 'l')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meters_lease_id ON meters(lease_id);
CREATE INDEX idx_meters_property_id ON meters(property_id);
CREATE INDEX idx_meters_type ON meters(type);
CREATE INDEX idx_meters_provider ON meters(provider);

-- Table des relevés de compteurs
CREATE TABLE IF NOT EXISTS meter_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_id UUID NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  reading_value NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kwh',
  reading_date DATE NOT NULL,
  photo_url TEXT, -- Photo du compteur (si saisie manuelle)
  source TEXT NOT NULL CHECK (source IN ('api', 'manual', 'ocr')),
  confidence NUMERIC(5, 2) CHECK (confidence >= 0 AND confidence <= 100), -- Pour OCR
  ocr_provider TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meter_id, reading_date)
);

CREATE INDEX idx_meter_readings_meter_id ON meter_readings(meter_id);
CREATE INDEX idx_meter_readings_reading_date ON meter_readings(reading_date);
CREATE INDEX idx_meter_readings_meter_date ON meter_readings(meter_id, reading_date);

-- Table des estimations de consommation
CREATE TABLE IF NOT EXISTS consumption_estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_id UUID NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  estimated_consumption NUMERIC(10, 2) NOT NULL,
  estimated_cost NUMERIC(10, 2),
  method TEXT CHECK (method IN ('linear', 'average', 'ml_model')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consumption_estimates_meter_id ON consumption_estimates(meter_id);
CREATE INDEX idx_consumption_estimates_period ON consumption_estimates(period_start, period_end);

-- ============================================
-- 6. COLOCATION AVANCÉE
-- ============================================

-- Table des versions du règlement de colocation
CREATE TABLE IF NOT EXISTS house_rule_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lease_id, version)
);

CREATE INDEX idx_house_rule_versions_lease_id ON house_rule_versions(lease_id);

-- Table des acceptations du règlement
CREATE TABLE IF NOT EXISTS rule_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_version_id UUID NOT NULL REFERENCES house_rule_versions(id) ON DELETE CASCADE,
  roommate_id UUID NOT NULL REFERENCES roommates(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_inet INET,
  user_agent TEXT,
  UNIQUE(rule_version_id, roommate_id)
);

CREATE INDEX idx_rule_acceptances_rule_version_id ON rule_acceptances(rule_version_id);
CREATE INDEX idx_rule_acceptances_roommate_id ON rule_acceptances(roommate_id);

-- Table du planning des tâches ménagères
CREATE TABLE IF NOT EXISTS chore_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  chore_name TEXT NOT NULL, -- 'Vaisselle', 'Poubelles', 'Aspirateur', etc.
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  current_assignee_id UUID REFERENCES roommates(id) ON DELETE SET NULL,
  rotation_order INTEGER[], -- Ordre de rotation des roommates
  last_rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chore_schedule_lease_id ON chore_schedule(lease_id);
CREATE INDEX idx_chore_schedule_current_assignee ON chore_schedule(current_assignee_id);

-- Table du compteur d'invités
CREATE TABLE IF NOT EXISTS guest_counter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  roommate_id UUID NOT NULL REFERENCES roommates(id) ON DELETE CASCADE,
  guest_name TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guest_counter_lease_id ON guest_counter(lease_id);
CREATE INDEX idx_guest_counter_roommate_id ON guest_counter(roommate_id);
CREATE INDEX idx_guest_counter_dates ON guest_counter(check_in_date, check_out_date);

-- ============================================
-- 7. MESSAGERIE & CHAT
-- ============================================

-- Table des fils de discussion
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('owner_tenant', 'roommates', 'ticket', 'announcement')),
  title TEXT,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL, -- Si lié à un ticket
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_threads_lease_id ON chat_threads(lease_id);
CREATE INDEX idx_chat_threads_type ON chat_threads(type);
CREATE INDEX idx_chat_threads_ticket_id ON chat_threads(ticket_id);
CREATE INDEX idx_chat_threads_last_message ON chat_threads(last_message_at);

-- Table des messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array de {storage_path, file_name, mime_type}
  read_by JSONB DEFAULT '[]'::jsonb, -- Array de {user_id, read_at}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_sender_user ON chat_messages(sender_user);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- 8. NOTIFICATIONS
-- ============================================

-- Table des paramètres de notifications
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms', 'in_app')),
  category TEXT NOT NULL, -- 'payment', 'ticket', 'lease', 'chat', etc.
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, channel, category)
);

CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_notification_settings_channel ON notification_settings(channel);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'payment_due', 'payment_received', 'ticket_update', 'lease_signed', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT,
  read_at TIMESTAMPTZ,
  sent_channels TEXT[] DEFAULT '{}', -- ['email', 'push'] - canaux utilisés
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- 9. ASSURANCE & SINISTRES
-- ============================================

-- Table des polices d'assurance
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  insurer_name TEXT NOT NULL,
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('habitation', 'responsabilite', 'comprehensive')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  premium_amount NUMERIC(10, 2),
  document_path TEXT, -- Attestation stockée
  reminder_sent BOOLEAN NOT NULL DEFAULT false, -- Rappel J-30 envoyé
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insurance_policies_lease_id ON insurance_policies(lease_id);
CREATE INDEX idx_insurance_policies_tenant_profile_id ON insurance_policies(tenant_profile_id);
CREATE INDEX idx_insurance_policies_end_date ON insurance_policies(end_date);

-- Table des sinistres
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  claim_number TEXT,
  incident_date DATE NOT NULL,
  description TEXT NOT NULL,
  estimated_damage NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'approved', 'rejected', 'paid')),
  documents JSONB DEFAULT '[]'::jsonb, -- Array de documents
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_policy_id ON claims(policy_id);
CREATE INDEX idx_claims_lease_id ON claims(lease_id);
CREATE INDEX idx_claims_status ON claims(status);

-- ============================================
-- TRIGGERS updated_at
-- ============================================

CREATE TRIGGER update_roommates_updated_at BEFORE UPDATE ON roommates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_shares_updated_at BEFORE UPDATE ON payment_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_applications_updated_at BEFORE UPDATE ON tenant_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lease_drafts_updated_at BEFORE UPDATE ON lease_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signatures_updated_at BEFORE UPDATE ON signatures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_edl_updated_at BEFORE UPDATE ON edl FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meters_updated_at BEFORE UPDATE ON meters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lease_templates_updated_at BEFORE UPDATE ON lease_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON chat_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON insurance_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chore_schedule_updated_at BEFORE UPDATE ON chore_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour mettre à jour last_message_at dans chat_threads
CREATE OR REPLACE FUNCTION update_chat_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_messages_update_thread
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_thread_last_message();

-- Fonction pour calculer le total des parts de paiement (validation)
CREATE OR REPLACE FUNCTION validate_payment_shares_total()
RETURNS TRIGGER AS $$
DECLARE
  total_shares NUMERIC;
  invoice_total NUMERIC;
BEGIN
  -- Calculer le total des parts pour ce bail/mois
  SELECT COALESCE(SUM(due_amount), 0) INTO total_shares
  FROM payment_shares
  WHERE lease_id = NEW.lease_id AND month = NEW.month;

  -- Si une facture est liée, vérifier que le total correspond
  IF NEW.invoice_id IS NOT NULL THEN
    SELECT montant_total INTO invoice_total
    FROM invoices
    WHERE id = NEW.invoice_id;

    IF ABS(total_shares - invoice_total) > 0.01 THEN
      RAISE EXCEPTION 'Le total des parts (%) ne correspond pas au montant de la facture (%)', total_shares, invoice_total;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_shares_validate_total
  BEFORE INSERT OR UPDATE ON payment_shares
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_shares_total();

