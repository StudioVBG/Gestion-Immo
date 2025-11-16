-- Migration : Tables manquantes pour fonctionnalités critiques
-- Dépôt de garantie, régularisation charges, devis, factures prestataires, analytics

-- ============================================
-- 1. DÉPÔT DE GARANTIE
-- ============================================

CREATE TABLE IF NOT EXISTS deposit_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('encaissement', 'consignation', 'restitution_totale', 'restitution_partielle')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  proof_url TEXT, -- Justificatif (virement, chèque, etc.)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'held', 'returned', 'failed')),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deposit_movements_lease_id ON deposit_movements(lease_id);
CREATE INDEX idx_deposit_movements_type ON deposit_movements(type);
CREATE INDEX idx_deposit_movements_status ON deposit_movements(status);

-- Vue pour calculer le solde du dépôt
CREATE OR REPLACE VIEW deposit_balance AS
SELECT 
  lease_id,
  SUM(CASE WHEN type IN ('encaissement', 'consignation') THEN amount ELSE 0 END) - 
  SUM(CASE WHEN type IN ('restitution_totale', 'restitution_partielle') THEN amount ELSE 0 END) AS balance,
  SUM(CASE WHEN type = 'encaissement' THEN amount ELSE 0 END) AS total_received,
  SUM(CASE WHEN type IN ('restitution_totale', 'restitution_partielle') THEN amount ELSE 0 END) AS total_returned
FROM deposit_movements
WHERE status IN ('received', 'held', 'returned')
GROUP BY lease_id;

-- ============================================
-- 2. CHARGES & RÉGULARISATION
-- ============================================

-- Table des provisions mensuelles
CREATE TABLE IF NOT EXISTS charge_provisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- Premier jour du mois
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lease_id, month)
);

CREATE INDEX idx_charge_provisions_lease_id ON charge_provisions(lease_id);
CREATE INDEX idx_charge_provisions_month ON charge_provisions(month);

-- Table des régularisations annuelles
CREATE TABLE IF NOT EXISTS charge_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_charges NUMERIC(10, 2) NOT NULL DEFAULT 0, -- Total charges réelles
  total_provisions NUMERIC(10, 2) NOT NULL DEFAULT 0, -- Total provisions versées
  delta NUMERIC(10, 2) NOT NULL, -- total_charges - total_provisions (positif = dû, négatif = remboursement)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'notified', 'paid', 'refunded')),
  notified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lease_id, year)
);

CREATE INDEX idx_charge_reconciliations_lease_id ON charge_reconciliations(lease_id);
CREATE INDEX idx_charge_reconciliations_year ON charge_reconciliations(year);
CREATE INDEX idx_charge_reconciliations_status ON charge_reconciliations(status);

-- ============================================
-- 3. DEVIS & FACTURES PRESTATAIRES
-- ============================================

-- Table des devis prestataires
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_ticket_id ON quotes(ticket_id);
CREATE INDEX idx_quotes_provider_id ON quotes(provider_id);
CREATE INDEX idx_quotes_status ON quotes(status);

-- Table des factures prestataires
CREATE TABLE IF NOT EXISTS provider_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  file_url TEXT, -- PDF de la facture
  invoice_number TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_invoices_ticket_id ON provider_invoices(ticket_id);
CREATE INDEX idx_provider_invoices_provider_id ON provider_invoices(provider_id);
CREATE INDEX idx_provider_invoices_status ON provider_invoices(status);

-- ============================================
-- 4. ANALYTICS & DASHBOARDS
-- ============================================

-- Table des dashboards
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('admin', 'owner', 'tenant', 'provider')),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL pour admin global
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_dashboards_scope ON analytics_dashboards(scope);
CREATE INDEX idx_analytics_dashboards_owner_id ON analytics_dashboards(owner_id);

-- Table des widgets de dashboard
CREATE TABLE IF NOT EXISTS analytics_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_id UUID NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'kpi', 'chart', 'table', 'age_distribution', etc.
  title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Configuration du widget
  position INTEGER NOT NULL, -- Ordre d'affichage
  size TEXT NOT NULL DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large', 'full')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_widgets_dashboard_id ON analytics_widgets(dashboard_id);
CREATE INDEX idx_analytics_widgets_type ON analytics_widgets(type);

-- Table des agrégats pré-calculés
CREATE TABLE IF NOT EXISTS analytics_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL, -- 'total_properties', 'average_age_owners', etc.
  period DATE NOT NULL, -- Premier jour de la période
  value NUMERIC(12, 2),
  dimensions JSONB, -- Dimensions (role, zone, etc.)
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(metric_name, period, dimensions)
);

CREATE INDEX idx_analytics_aggregates_metric_name ON analytics_aggregates(metric_name);
CREATE INDEX idx_analytics_aggregates_period ON analytics_aggregates(period);

-- Table pour stocker les âges calculés depuis OCR
CREATE TABLE IF NOT EXISTS user_ages (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  birthdate DATE, -- Extrait depuis pièce d'identité
  age INTEGER, -- Calculé automatiquement
  source TEXT CHECK (source IN ('ocr', 'manual', 'api')),
  confidence NUMERIC(5, 2) CHECK (confidence >= 0 AND confidence <= 100),
  extracted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_ages_age ON user_ages(age);
CREATE INDEX idx_user_ages_source ON user_ages(source);

-- Fonction pour calculer l'âge automatiquement
CREATE OR REPLACE FUNCTION calculate_age_from_birthdate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birthdate IS NOT NULL THEN
    NEW.age := EXTRACT(YEAR FROM AGE(NEW.birthdate));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_ages_calculate_age
  BEFORE INSERT OR UPDATE ON user_ages
  FOR EACH ROW
  EXECUTE FUNCTION calculate_age_from_birthdate();

-- ============================================
-- 5. ANNEXES AUX BAUX
-- ============================================

CREATE TABLE IF NOT EXISTS lease_annexes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_url TEXT, -- PDF de l'annexe
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lease_annexes_lease_id ON lease_annexes(lease_id);

-- ============================================
-- 6. TRIGGERS updated_at
-- ============================================

CREATE TRIGGER update_deposit_movements_updated_at BEFORE UPDATE ON deposit_movements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charge_reconciliations_updated_at BEFORE UPDATE ON charge_reconciliations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_invoices_updated_at BEFORE UPDATE ON provider_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_dashboards_updated_at BEFORE UPDATE ON analytics_dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_widgets_updated_at BEFORE UPDATE ON analytics_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lease_annexes_updated_at BEFORE UPDATE ON lease_annexes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_ages_updated_at BEFORE UPDATE ON user_ages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();





