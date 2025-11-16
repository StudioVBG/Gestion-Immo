-- Migration : RLS Policies pour les nouvelles tables

-- ============================================
-- 1. DÉPÔT DE GARANTIE
-- ============================================

ALTER TABLE deposit_movements ENABLE ROW LEVEL SECURITY;

-- Les propriétaires et locataires peuvent voir les mouvements de leur bail
CREATE POLICY "Deposit movements same lease select"
  ON deposit_movements FOR SELECT
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      WHERE l.property_id IN (
        SELECT id FROM properties WHERE owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1 FROM roommates r
        WHERE r.lease_id = l.id AND r.user_id = auth.uid()
      )
    )
  );

-- Seuls les propriétaires peuvent créer/modifier des mouvements
CREATE POLICY "Deposit movements owner manage"
  ON deposit_movements FOR ALL
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN properties p ON p.id = l.property_id
      WHERE p.owner_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN properties p ON p.id = l.property_id
      WHERE p.owner_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 2. CHARGES & RÉGULARISATION
-- ============================================

ALTER TABLE charge_provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE charge_reconciliations ENABLE ROW LEVEL SECURITY;

-- Provisions : propriétaires et locataires peuvent voir
CREATE POLICY "Charge provisions same lease select"
  ON charge_provisions FOR SELECT
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      WHERE l.property_id IN (
        SELECT id FROM properties WHERE owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1 FROM roommates r
        WHERE r.lease_id = l.id AND r.user_id = auth.uid()
      )
    )
  );

-- Seuls les propriétaires peuvent créer/modifier
CREATE POLICY "Charge provisions owner manage"
  ON charge_provisions FOR ALL
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN properties p ON p.id = l.property_id
      WHERE p.owner_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Régularisations : même logique
CREATE POLICY "Charge reconciliations same lease select"
  ON charge_reconciliations FOR SELECT
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      WHERE l.property_id IN (
        SELECT id FROM properties WHERE owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1 FROM roommates r
        WHERE r.lease_id = l.id AND r.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Charge reconciliations owner manage"
  ON charge_reconciliations FOR ALL
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN properties p ON p.id = l.property_id
      WHERE p.owner_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 3. DEVIS & FACTURES PRESTATAIRES
-- ============================================

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_invoices ENABLE ROW LEVEL SECURITY;

-- Devis : prestataire, propriétaire et locataire peuvent voir
CREATE POLICY "Quotes accessible select"
  ON quotes FOR SELECT
  USING (
    provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR ticket_id IN (
      SELECT t.id FROM tickets t
      WHERE t.property_id IN (
        SELECT id FROM properties WHERE owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
      )
      OR t.lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      )
    )
  );

-- Prestataire peut créer/modifier ses devis
CREATE POLICY "Quotes provider manage"
  ON quotes FOR ALL
  USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Propriétaire peut approuver/rejeter
CREATE POLICY "Quotes owner approve"
  ON quotes FOR UPDATE
  USING (
    ticket_id IN (
      SELECT t.id FROM tickets t
      JOIN properties p ON p.id = t.property_id
      WHERE p.owner_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Factures prestataires : même logique
CREATE POLICY "Provider invoices accessible select"
  ON provider_invoices FOR SELECT
  USING (
    provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR ticket_id IN (
      SELECT t.id FROM tickets t
      WHERE t.property_id IN (
        SELECT id FROM properties WHERE owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Provider invoices provider manage"
  ON provider_invoices FOR INSERT
  WITH CHECK (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Provider invoices owner approve"
  ON provider_invoices FOR UPDATE
  USING (
    ticket_id IN (
      SELECT t.id FROM tickets t
      JOIN properties p ON p.id = t.property_id
      WHERE p.owner_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 4. ANALYTICS
-- ============================================

ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ages ENABLE ROW LEVEL SECURITY;

-- Dashboards : admin voit tout, autres voient leurs propres
CREATE POLICY "Analytics dashboards select"
  ON analytics_dashboards FOR SELECT
  USING (
    scope = 'admin' AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR (scope IN ('owner', 'tenant', 'provider') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = scope
    ))
  );

-- Admin peut créer/modifier tous les dashboards
CREATE POLICY "Analytics dashboards admin manage"
  ON analytics_dashboards FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Widgets : même logique que dashboards
CREATE POLICY "Analytics widgets select"
  ON analytics_widgets FOR SELECT
  USING (
    dashboard_id IN (
      SELECT id FROM analytics_dashboards
      WHERE scope = 'admin' AND EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
      )
      OR owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Analytics widgets manage"
  ON analytics_widgets FOR ALL
  USING (
    dashboard_id IN (
      SELECT id FROM analytics_dashboards
      WHERE EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Agrégats : lecture seule pour tous selon scope
CREATE POLICY "Analytics aggregates select"
  ON analytics_aggregates FOR SELECT
  USING (true); -- Les agrégats sont publics selon le scope du dashboard

-- Âges : utilisateur voit son propre âge, admin voit tout
CREATE POLICY "User ages select"
  ON user_ages FOR SELECT
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 5. ANNEXES AUX BAUX
-- ============================================

ALTER TABLE lease_annexes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lease annexes same lease select"
  ON lease_annexes FOR SELECT
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      WHERE l.property_id IN (
        SELECT id FROM properties WHERE owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1 FROM roommates r
        WHERE r.lease_id = l.id AND r.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Lease annexes owner manage"
  ON lease_annexes FOR ALL
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN properties p ON p.id = l.property_id
      WHERE p.owner_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );





