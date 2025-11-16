-- Migration : Architecture Admin complète
-- Partie 1 : Multi-tenant, RBAC, Analytics d'âge, FinOps, Modération, RGPD

-- ============================================
-- 1. MULTI-TENANT (ajout tenant_id aux tables existantes)
-- ============================================

-- Table des tenants (organisations)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajouter tenant_id aux tables principales (si pas déjà présent)
-- Note: Pour l'instant, on assume un seul tenant (plateforme unique)
-- On peut ajouter tenant_id plus tard si besoin de multi-tenant

-- ============================================
-- 2. RBAC (Roles & Permissions)
-- ============================================

-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'integrations', 'finops', 'moderation', 'people', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison rôle-permission
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Table de liaison utilisateur-rôle
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Insérer les rôles de base
INSERT INTO roles (key, label, description) VALUES
  ('super_admin', 'Super Admin', 'Administrateur de la plateforme avec tous les droits'),
  ('org_admin', 'Admin Organisation', 'Administrateur d''une organisation'),
  ('support', 'Support', 'Équipe support client'),
  ('finance', 'Finance', 'Gestion financière et comptable'),
  ('legal_dpo', 'Legal/DPO', 'Conformité légale et RGPD'),
  ('tech_integrations', 'Tech/Intégrations', 'Gestion des intégrations techniques'),
  ('read_only', 'Lecture seule', 'Accès en lecture seule')
ON CONFLICT (key) DO NOTHING;

-- Insérer les permissions de base
INSERT INTO permissions (key, label, description, category) VALUES
  -- Intégrations
  ('integrations:read', 'Lire intégrations', 'Voir les intégrations et clés API', 'integrations'),
  ('integrations:write', 'Écrire intégrations', 'Créer/modifier les intégrations', 'integrations'),
  ('integrations:rotate', 'Rotation clés', 'Régénérer les clés API', 'integrations'),
  -- FinOps
  ('finops:read', 'Lire FinOps', 'Voir les coûts et budgets', 'finops'),
  ('finops:budget', 'Gérer budgets', 'Créer/modifier les budgets', 'finops'),
  ('finops:throttle', 'Throttling', 'Activer/désactiver le throttling', 'finops'),
  -- Modération
  ('moderation:triage', 'Triage modération', 'Trier les cas de modération', 'moderation'),
  ('moderation:decide', 'Décider modération', 'Prendre des décisions de modération', 'moderation'),
  ('moderation:appeal', 'Appels modération', 'Gérer les appels de modération', 'moderation'),
  -- People
  ('people:read', 'Lire annuaire', 'Voir l''annuaire des personnes', 'people'),
  ('people:read_sensitive', 'Lire données sensibles', 'Voir les données sensibles (DOB, etc.)', 'people'),
  ('people:write', 'Écrire annuaire', 'Créer/modifier les personnes', 'people'),
  -- Baux
  ('leases:read', 'Lire baux', 'Voir les baux', 'leases'),
  ('leases:sign.manage', 'Gérer signatures', 'Gérer les signatures de baux', 'leases'),
  -- Paiements
  ('payments:reconcile', 'Réconcilier paiements', 'Réconcilier les paiements', 'payments'),
  ('payments:refund', 'Rembourser', 'Effectuer des remboursements', 'payments'),
  -- Conformité
  ('compliance:gdpr.manage', 'Gérer RGPD', 'Gérer les demandes RGPD', 'compliance'),
  -- Rapports
  ('reports:export', 'Exporter rapports', 'Exporter des rapports', 'reports'),
  -- Paramètres
  ('settings:rbac', 'Gérer RBAC', 'Gérer les rôles et permissions', 'settings')
ON CONFLICT (key) DO NOTHING;

-- Assigner les permissions au rôle super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'super_admin'
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. ANALYTICS D'ÂGE
-- ============================================

-- Fonction pour calculer l'âge en années
CREATE OR REPLACE FUNCTION age_years(dob DATE)
RETURNS INTEGER AS $$
  SELECT CASE 
    WHEN $1 IS NULL THEN NULL
    ELSE EXTRACT(YEAR FROM age(current_date, $1))::INTEGER 
  END;
$$ LANGUAGE sql STABLE;

-- Fonction pour déterminer la tranche d'âge
CREATE OR REPLACE FUNCTION age_bucket(age_years INTEGER)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN $1 IS NULL THEN 'unknown'
    WHEN $1 < 18 THEN '<18'
    WHEN $1 BETWEEN 18 AND 24 THEN '18-24'
    WHEN $1 BETWEEN 25 AND 34 THEN '25-34'
    WHEN $1 BETWEEN 35 AND 44 THEN '35-44'
    WHEN $1 BETWEEN 45 AND 54 THEN '45-54'
    WHEN $1 BETWEEN 55 AND 64 THEN '55-64'
    WHEN $1 >= 65 THEN '65+'
    ELSE 'unknown'
  END;
$$ LANGUAGE sql IMMUTABLE;

-- Vue pour les âges des personnes
CREATE OR REPLACE VIEW v_person_age AS
SELECT 
  p.id AS person_id,
  p.user_id,
  p.date_naissance AS birthdate,
  age_years(p.date_naissance) AS age_years,
  age_bucket(age_years(p.date_naissance)) AS age_bucket
FROM profiles p;

-- Vue pour les distributions d'âge par rôle
CREATE OR REPLACE VIEW v_portfolio_age_buckets AS
WITH person_role AS (
  -- Locataires actifs
  SELECT 
    ls.profile_id,
    l.id AS lease_id,
    'tenant'::TEXT AS role
  FROM lease_signers ls
  JOIN leases l ON l.id = ls.lease_id
  WHERE ls.role IN ('locataire_principal', 'colocataire')
    AND l.statut IN ('active', 'pending_signature')
  
  UNION ALL
  
  -- Propriétaires individuels
  SELECT 
    p.id AS profile_id,
    NULL::UUID AS lease_id,
    'owner'::TEXT AS role
  FROM profiles p
  JOIN owner_profiles op ON op.profile_id = p.id
  WHERE op.type = 'particulier'
)
SELECT 
  pr.role,
  age_bucket(a.age_years) AS bucket,
  COUNT(*) AS persons
FROM person_role pr
LEFT JOIN v_person_age a ON a.person_id = pr.profile_id
GROUP BY pr.role, age_bucket(a.age_years);

-- ============================================
-- 4. FINOPS (Intégrations & Coûts)
-- ============================================

-- Table des fournisseurs d'API
CREATE TABLE IF NOT EXISTS api_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'payment', 'email', 'sms', 'signature', 'kyc', 'maps', etc.
  pricing_model TEXT, -- 'per_request', 'monthly', 'tiered', etc.
  sla TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'inactive')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des credentials API
CREATE TABLE IF NOT EXISTS api_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
  env TEXT NOT NULL CHECK (env IN ('dev', 'stage', 'prod')),
  scope TEXT, -- 'read', 'write', 'admin', etc.
  secret_ref TEXT NOT NULL, -- Référence au secret dans Vault
  expires_at TIMESTAMPTZ,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_credentials_provider_id ON api_credentials(provider_id);
CREATE INDEX idx_api_credentials_env ON api_credentials(env);

-- Table des événements d'utilisation API
CREATE TABLE IF NOT EXISTS api_usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_id UUID NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES api_credentials(id) ON DELETE SET NULL,
  feature TEXT NOT NULL, -- 'relance_loyer', 'signature_bail', 'kyc_verification', etc.
  unit_cost_eur DECIMAL(12, 4) NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 1,
  meta JSONB, -- Détails supplémentaires (tenant_id, property_id, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_usage_events_ts ON api_usage_events(ts);
CREATE INDEX idx_api_usage_events_provider_id ON api_usage_events(provider_id);
CREATE INDEX idx_api_usage_events_feature ON api_usage_events(feature);
CREATE INDEX idx_api_usage_events_ts_provider ON api_usage_events(ts, provider_id);

-- Table des budgets de coûts
CREATE TABLE IF NOT EXISTS cost_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope TEXT NOT NULL, -- 'provider:<id>' ou 'feature:<key>'
  period DATE NOT NULL, -- Premier jour du mois
  amount_eur DECIMAL(12, 2) NOT NULL,
  threshold_pct INTEGER NOT NULL DEFAULT 80,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Actions à déclencher
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(scope, period)
);

-- Table des alertes de coûts
CREATE TABLE IF NOT EXISTS cost_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES cost_budgets(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usage_eur DECIMAL(12, 2) NOT NULL,
  threshold_pct INTEGER NOT NULL,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cost_alerts_budget_id ON cost_alerts(budget_id);
CREATE INDEX idx_cost_alerts_triggered_at ON cost_alerts(triggered_at);

-- Insérer quelques fournisseurs d'API de base
INSERT INTO api_providers (name, category, pricing_model, status) VALUES
  ('Stripe', 'payment', 'per_transaction', 'active'),
  ('GoCardless', 'payment', 'per_transaction', 'active'),
  ('Brevo', 'email', 'tiered', 'active'),
  ('Twilio', 'sms', 'per_message', 'active'),
  ('Yousign', 'signature', 'per_signature', 'active'),
  ('Veriff', 'kyc', 'per_verification', 'active')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. MODÉRATION
-- ============================================

-- Table des cas de modération
CREATE TABLE IF NOT EXISTS moderation_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'profile', 'message', 'document', 'listing', etc.
  object_type TEXT NOT NULL, -- 'profile', 'ticket', 'document', etc.
  object_id UUID NOT NULL,
  risk TEXT NOT NULL DEFAULT 'low' CHECK (risk IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'appealed')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_cases_status ON moderation_cases(status);
CREATE INDEX idx_moderation_cases_risk ON moderation_cases(risk);
CREATE INDEX idx_moderation_cases_object ON moderation_cases(object_type, object_id);

-- Table des actions de modération
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES moderation_cases(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision TEXT NOT NULL, -- 'approve', 'reject', 'remove', 'warn', etc.
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_actions_case_id ON moderation_actions(case_id);
CREATE INDEX idx_moderation_actions_actor_id ON moderation_actions(actor_id);

-- ============================================
-- 6. RGPD & CONFORMITÉ
-- ============================================

-- Table des demandes RGPD
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type TEXT NOT NULL, -- 'user', 'profile', 'person', etc.
  subject_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('access', 'rectification', 'erasure', 'portability', 'objection')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX idx_gdpr_requests_subject ON gdpr_requests(subject_type, subject_id);
CREATE INDEX idx_gdpr_requests_due_at ON gdpr_requests(due_at);

-- Table du journal d'audit (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type TEXT NOT NULL, -- 'user', 'system'
  actor_id UUID,
  action TEXT NOT NULL,
  resource TEXT NOT NULL, -- 'profile', 'lease', 'invoice', etc.
  resource_id UUID,
  before JSONB,
  after JSONB,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_ts ON audit_log(ts);
CREATE INDEX idx_audit_log_resource ON audit_log(resource, resource_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_type, actor_id);

-- Trigger pour empêcher UPDATE/DELETE sur audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only and cannot be modified';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================
-- TRIGGERS updated_at
-- ============================================

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_providers_updated_at BEFORE UPDATE ON api_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_credentials_updated_at BEFORE UPDATE ON api_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_budgets_updated_at BEFORE UPDATE ON cost_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_moderation_cases_updated_at BEFORE UPDATE ON moderation_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gdpr_requests_updated_at BEFORE UPDATE ON gdpr_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

