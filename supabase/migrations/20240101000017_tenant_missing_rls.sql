-- Migration : RLS Policies pour les nouvelles tables Locataire

-- ============================================
-- 1. OUTBOX (lecture seule pour admin/service role uniquement)
-- ============================================

ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;

-- Seul le service role peut accéder à l'outbox
CREATE POLICY "Service role only for outbox"
  ON outbox FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 2. PAYMENT INTENTS
-- ============================================

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- Les locataires peuvent voir leurs propres payment intents
CREATE POLICY "Payment intents same lease select"
  ON payment_intents FOR SELECT
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
    )
  );

-- Les locataires peuvent créer leurs propres payment intents
CREATE POLICY "Payment intents same lease insert"
  ON payment_intents FOR INSERT
  WITH CHECK (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 3. SIGNATURE EVIDENCE
-- ============================================

ALTER TABLE signature_evidence ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les preuves de leurs signatures
CREATE POLICY "Signature evidence own select"
  ON signature_evidence FOR SELECT
  USING (
    signature_id IN (
      SELECT id FROM signatures WHERE signer_user = auth.uid()
    )
    OR owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 4. UNIT ACCESS CODES
-- ============================================

ALTER TABLE unit_access_codes ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour vérification de code
CREATE POLICY "Unit access codes public verify"
  ON unit_access_codes FOR SELECT
  USING (status = 'active');

-- Création/modification uniquement par propriétaire ou admin
CREATE POLICY "Unit access codes owner manage"
  ON unit_access_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      JOIN profiles pr ON pr.id = p.owner_id
      WHERE (p.id = unit_access_codes.property_id OR EXISTS (
        SELECT 1 FROM units u WHERE u.id = unit_access_codes.unit_id AND u.property_id = p.id
      ))
      AND pr.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. AUDIT LOG
-- ============================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres actions
CREATE POLICY "Audit log own select"
  ON audit_log FOR SELECT
  USING (user_id = auth.uid());

-- Les admins peuvent voir tout
CREATE POLICY "Audit log admin select"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. DOCUMENT LINKS
-- ============================================

ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

-- Lecture publique via token (pour partage)
CREATE POLICY "Document links public by token"
  ON document_links FOR SELECT
  USING (true); -- Le token sera vérifié dans la logique métier

-- Création uniquement par le propriétaire du document
CREATE POLICY "Document links owner create"
  ON document_links FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE owner_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
      OR tenant_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 7. TICKET MESSAGES
-- ============================================

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Les membres du bail peuvent voir les messages (sauf internes)
CREATE POLICY "Ticket messages same lease select"
  ON ticket_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT t.id FROM tickets t
      WHERE t.lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      )
      OR t.created_by_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
    AND (
      NOT is_internal
      OR EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Les membres du bail peuvent créer des messages
CREATE POLICY "Ticket messages same lease insert"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT t.id FROM tickets t
      WHERE t.lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      )
      OR t.created_by_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
    AND sender_user = auth.uid()
  );

-- ============================================
-- 8. APPOINTMENTS
-- ============================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Les membres du bail peuvent voir les rendez-vous
CREATE POLICY "Appointments same lease select"
  ON appointments FOR SELECT
  USING (
    ticket_id IN (
      SELECT t.id FROM tickets t
      WHERE t.lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      )
      OR t.created_by_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 9. GUARANTORS
-- ============================================

ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;

-- Les membres du bail peuvent voir les garants
CREATE POLICY "Guarantors same lease select"
  ON guarantors FOR SELECT
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid() -- Le garant peut voir son propre profil
  );

-- Les locataires peuvent ajouter des garants
CREATE POLICY "Guarantors tenant insert"
  ON guarantors FOR INSERT
  WITH CHECK (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
    )
  );





