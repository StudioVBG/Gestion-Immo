-- Migration : RLS Policies pour l'architecture Locataire

-- ============================================
-- 1. COLOCATION & SPLIT PAIEMENTS
-- ============================================

ALTER TABLE roommates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_shares ENABLE ROW LEVEL SECURITY;

-- Roommates : visibilité "même bail"
CREATE POLICY "Roommates same lease select"
  ON roommates FOR SELECT
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
    )
  );

-- Roommates : modification uniquement pour soi-même ou admin
CREATE POLICY "Roommates update own"
  ON roommates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Payment shares : la table complète est protégée, seuls les montants de l'utilisateur sont visibles
CREATE POLICY "Payment shares same lease select own"
  ON payment_shares FOR SELECT
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
    )
    AND (
      -- L'utilisateur peut voir sa propre part complète
      roommate_id IN (SELECT id FROM roommates WHERE user_id = auth.uid())
      -- OU il peut voir les statuts des autres (via la vue publique)
      -- (Cette politique permet l'accès, mais la vue masque les montants)
    )
  );

-- Payment shares : insertion/modification uniquement pour sa propre part
CREATE POLICY "Payment shares manage own"
  ON payment_shares FOR ALL
  USING (
    roommate_id IN (SELECT id FROM roommates WHERE user_id = auth.uid())
  )
  WITH CHECK (
    roommate_id IN (SELECT id FROM roommates WHERE user_id = auth.uid())
  );

-- Vue publique : accessible à tous les membres du bail (montants masqués)
-- Pas besoin de RLS sur la vue, elle hérite des permissions de la table

-- ============================================
-- 2. DOSSIER LOCATAIRE & OCR
-- ============================================

ALTER TABLE tenant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_fields ENABLE ROW LEVEL SECURITY;

-- Tenant applications : propriétaire uniquement
CREATE POLICY "Tenant applications owner select"
  ON tenant_applications FOR SELECT
  USING (
    tenant_user = auth.uid()
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN profiles pr ON pr.id = p.owner_id
      WHERE p.id = tenant_applications.property_id
        AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant applications tenant manage"
  ON tenant_applications FOR ALL
  USING (tenant_user = auth.uid())
  WITH CHECK (tenant_user = auth.uid());

-- Application files : accessible si application appartient à l'utilisateur
CREATE POLICY "Application files owner"
  ON application_files FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM tenant_applications WHERE tenant_user = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM tenant_applications ta
      JOIN properties p ON p.id = ta.property_id
      JOIN profiles pr ON pr.id = p.owner_id
      WHERE ta.id = application_files.application_id
        AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Application files tenant insert"
  ON application_files FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT id FROM tenant_applications WHERE tenant_user = auth.uid()
    )
  );

-- Extracted fields : même logique que application_files
CREATE POLICY "Extracted fields owner"
  ON extracted_fields FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM tenant_applications WHERE tenant_user = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM tenant_applications ta
      JOIN properties p ON p.id = ta.property_id
      JOIN profiles pr ON pr.id = p.owner_id
      WHERE ta.id = extracted_fields.application_id
        AND pr.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. BAUX & SIGNATURES
-- ============================================

ALTER TABLE lease_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Lease drafts : accessible aux signataires du bail
CREATE POLICY "Lease drafts signers select"
  ON lease_drafts FOR SELECT
  USING (
    lease_id IN (
      SELECT lease_id FROM lease_signers ls
      JOIN profiles p ON p.id = ls.profile_id
      WHERE p.user_id = auth.uid()
    )
    OR application_id IN (
      SELECT id FROM tenant_applications WHERE tenant_user = auth.uid()
    )
  );

-- Signatures : accessible au signataire et aux autres signataires du même bail
CREATE POLICY "Signatures signers select"
  ON signatures FOR SELECT
  USING (
    signer_user = auth.uid()
    OR lease_id IN (
      SELECT lease_id FROM lease_signers ls
      JOIN profiles p ON p.id = ls.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Signatures signer create"
  ON signatures FOR INSERT
  WITH CHECK (signer_user = auth.uid());

CREATE POLICY "Signatures signer update"
  ON signatures FOR UPDATE
  USING (signer_user = auth.uid())
  WITH CHECK (signer_user = auth.uid());

-- ============================================
-- 4. ÉTATS DES LIEUX (EDL)
-- ============================================

ALTER TABLE edl ENABLE ROW LEVEL SECURITY;
ALTER TABLE edl_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE edl_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE edl_signatures ENABLE ROW LEVEL SECURITY;

-- EDL : accessible aux locataires du bail
CREATE POLICY "EDL lease members select"
  ON edl FOR SELECT
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      UNION
      SELECT lease_id FROM lease_signers ls
      JOIN profiles p ON p.id = ls.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "EDL creator manage"
  ON edl FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- EDL items : accessible si EDL accessible
CREATE POLICY "EDL items accessible"
  ON edl_items FOR SELECT
  USING (
    edl_id IN (
      SELECT id FROM edl WHERE lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
        UNION
        SELECT lease_id FROM lease_signers ls
        JOIN profiles p ON p.id = ls.profile_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "EDL items creator manage"
  ON edl_items FOR ALL
  USING (
    edl_id IN (SELECT id FROM edl WHERE created_by = auth.uid())
  )
  WITH CHECK (
    edl_id IN (SELECT id FROM edl WHERE created_by = auth.uid())
  );

-- EDL media : même logique
CREATE POLICY "EDL media accessible"
  ON edl_media FOR SELECT
  USING (
    edl_id IN (
      SELECT id FROM edl WHERE lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
        UNION
        SELECT lease_id FROM lease_signers ls
        JOIN profiles p ON p.id = ls.profile_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "EDL media creator manage"
  ON edl_media FOR ALL
  USING (
    edl_id IN (SELECT id FROM edl WHERE created_by = auth.uid())
  )
  WITH CHECK (
    edl_id IN (SELECT id FROM edl WHERE created_by = auth.uid())
  );

-- EDL signatures : accessible aux signataires
CREATE POLICY "EDL signatures accessible"
  ON edl_signatures FOR SELECT
  USING (
    edl_id IN (
      SELECT id FROM edl WHERE lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
        UNION
        SELECT lease_id FROM lease_signers ls
        JOIN profiles p ON p.id = ls.profile_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "EDL signatures signer create"
  ON edl_signatures FOR INSERT
  WITH CHECK (signer_user = auth.uid());

-- ============================================
-- 5. COMPTEURS & ÉNERGIE
-- ============================================

ALTER TABLE meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_estimates ENABLE ROW LEVEL SECURITY;

-- Meters : accessible aux locataires du bail
CREATE POLICY "Meters lease members select"
  ON meters FOR SELECT
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      UNION
      SELECT lease_id FROM lease_signers ls
      JOIN profiles p ON p.id = ls.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Meter readings : accessible si meter accessible
CREATE POLICY "Meter readings accessible"
  ON meter_readings FOR SELECT
  USING (
    meter_id IN (
      SELECT id FROM meters WHERE lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
        UNION
        SELECT lease_id FROM lease_signers ls
        JOIN profiles p ON p.id = ls.profile_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Meter readings tenant create"
  ON meter_readings FOR INSERT
  WITH CHECK (
    meter_id IN (
      SELECT id FROM meters WHERE lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
        UNION
        SELECT lease_id FROM lease_signers ls
        JOIN profiles p ON p.id = ls.profile_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

-- Consumption estimates : même logique
CREATE POLICY "Consumption estimates accessible"
  ON consumption_estimates FOR SELECT
  USING (
    meter_id IN (
      SELECT id FROM meters WHERE lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
        UNION
        SELECT lease_id FROM lease_signers ls
        JOIN profiles p ON p.id = ls.profile_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 6. COLOCATION AVANCÉE
-- ============================================

ALTER TABLE house_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_counter ENABLE ROW LEVEL SECURITY;

-- House rule versions : accessible aux membres du bail
CREATE POLICY "House rules lease members select"
  ON house_rule_versions FOR SELECT
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      UNION
      SELECT lease_id FROM lease_signers ls
      JOIN profiles p ON p.id = ls.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Rule acceptances : accessible aux membres
CREATE POLICY "Rule acceptances accessible"
  ON rule_acceptances FOR SELECT
  USING (
    roommate_id IN (SELECT id FROM roommates WHERE user_id = auth.uid())
    OR rule_version_id IN (
      SELECT id FROM house_rule_versions WHERE lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Rule acceptances roommate create"
  ON rule_acceptances FOR INSERT
  WITH CHECK (
    roommate_id IN (SELECT id FROM roommates WHERE user_id = auth.uid())
  );

-- Chore schedule : accessible aux membres
CREATE POLICY "Chore schedule lease members"
  ON chore_schedule FOR ALL
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      UNION
      SELECT lease_id FROM lease_signers ls
      JOIN profiles p ON p.id = ls.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Guest counter : accessible aux membres
CREATE POLICY "Guest counter lease members"
  ON guest_counter FOR ALL
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      UNION
      SELECT lease_id FROM lease_signers ls
      JOIN profiles p ON p.id = ls.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. MESSAGERIE & CHAT
-- ============================================

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat threads : accessible aux membres du bail
CREATE POLICY "Chat threads lease members"
  ON chat_threads FOR ALL
  USING (
    lease_id IN (
      SELECT lease_id FROM roommates WHERE user_id = auth.uid()
      UNION
      SELECT lease_id FROM lease_signers ls
      JOIN profiles p ON p.id = ls.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Chat messages : accessible si thread accessible
CREATE POLICY "Chat messages thread members"
  ON chat_messages FOR ALL
  USING (
    thread_id IN (
      SELECT id FROM chat_threads WHERE lease_id IN (
        SELECT lease_id FROM roommates WHERE user_id = auth.uid()
        UNION
        SELECT lease_id FROM lease_signers ls
        JOIN profiles p ON p.id = ls.profile_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 8. NOTIFICATIONS
-- ============================================

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notification settings : propriétaire uniquement
CREATE POLICY "Notification settings owner"
  ON notification_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notifications : propriétaire uniquement
CREATE POLICY "Notifications owner"
  ON notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 9. ASSURANCE & SINISTRES
-- ============================================

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Insurance policies : accessible au locataire et au propriétaire
CREATE POLICY "Insurance policies accessible"
  ON insurance_policies FOR SELECT
  USING (
    tenant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR lease_id IN (
      SELECT lease_id FROM leases l
      JOIN properties p ON p.id = l.property_id
      JOIN profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Insurance policies tenant manage"
  ON insurance_policies FOR ALL
  USING (
    tenant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    tenant_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Claims : accessible au créateur et au propriétaire
CREATE POLICY "Claims accessible"
  ON claims FOR SELECT
  USING (
    created_by = auth.uid()
    OR lease_id IN (
      SELECT lease_id FROM leases l
      JOIN properties p ON p.id = l.property_id
      JOIN profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Claims creator manage"
  ON claims FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

