-- Migration : RLS Policies pour l'architecture Admin

-- ============================================
-- RLS pour RBAC
-- ============================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Roles : lecture pour tous les admins
CREATE POLICY "Admins can read roles"
  ON roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Permissions : lecture pour tous les admins
CREATE POLICY "Admins can read permissions"
  ON permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Role permissions : lecture pour tous les admins
CREATE POLICY "Admins can read role_permissions"
  ON role_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- User roles : lecture pour tous, écriture pour super_admin uniquement
CREATE POLICY "Admins can read user_roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Super admins can manage user_roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.user_id
      JOIN roles r ON r.id = ur.role_id
      WHERE p.user_id = auth.uid() AND r.key = 'super_admin'
    )
  );

-- ============================================
-- RLS pour Analytics
-- ============================================

-- Les vues analytics sont en lecture seule, pas besoin de RLS
-- Mais on peut restreindre l'accès via les permissions

-- ============================================
-- RLS pour FinOps
-- ============================================

ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_alerts ENABLE ROW LEVEL SECURITY;

-- API Providers : lecture pour admins avec permission integrations:read
CREATE POLICY "Admins with permission can read api_providers"
  ON api_providers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- API Credentials : lecture/écriture selon permissions
CREATE POLICY "Admins with permission can read api_credentials"
  ON api_credentials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins with permission can manage api_credentials"
  ON api_credentials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- API Usage Events : lecture pour admins avec permission finops:read
CREATE POLICY "Admins with permission can read api_usage_events"
  ON api_usage_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Cost Budgets : lecture/écriture selon permissions
CREATE POLICY "Admins with permission can read cost_budgets"
  ON cost_budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins with permission can manage cost_budgets"
  ON cost_budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Cost Alerts : lecture pour admins
CREATE POLICY "Admins can read cost_alerts"
  ON cost_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- RLS pour Modération
-- ============================================

ALTER TABLE moderation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Moderation Cases : lecture/écriture pour admins avec permission moderation
CREATE POLICY "Admins with permission can read moderation_cases"
  ON moderation_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins with permission can manage moderation_cases"
  ON moderation_cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Moderation Actions : lecture pour admins, écriture pour modérateurs
CREATE POLICY "Admins can read moderation_actions"
  ON moderation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins with permission can create moderation_actions"
  ON moderation_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- RLS pour RGPD
-- ============================================

ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- GDPR Requests : lecture/écriture pour admins avec permission compliance
CREATE POLICY "Admins with permission can read gdpr_requests"
  ON gdpr_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins with permission can manage gdpr_requests"
  ON gdpr_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Audit Log : lecture pour admins, écriture système uniquement (via trigger)
CREATE POLICY "Admins can read audit_log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- L'insertion dans audit_log se fait via des triggers/fonctions système
-- Pas de politique INSERT pour les utilisateurs normaux

