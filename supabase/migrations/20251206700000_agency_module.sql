-- Migration : Module Agence / Conciergerie
-- Ajoute le support pour les agences immobilières et conciergeries

-- ============================================
-- 1. Ajouter le rôle "agency" dans profiles
-- ============================================

-- Modifier la contrainte de rôle pour inclure "agency"
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'owner', 'tenant', 'provider', 'agency'));

-- ============================================
-- 2. Ajouter raison_sociale à owner_profiles
-- ============================================

ALTER TABLE owner_profiles 
ADD COLUMN IF NOT EXISTS raison_sociale TEXT;

ALTER TABLE owner_profiles 
ADD COLUMN IF NOT EXISTS adresse_siege TEXT;

ALTER TABLE owner_profiles 
ADD COLUMN IF NOT EXISTS forme_juridique TEXT 
CHECK (forme_juridique IN ('SARL', 'SAS', 'SASU', 'SCI', 'EURL', 'EI', 'SA', 'SCPI', 'autre'));

COMMENT ON COLUMN owner_profiles.raison_sociale IS 'Raison sociale pour les sociétés';
COMMENT ON COLUMN owner_profiles.adresse_siege IS 'Adresse du siège social';
COMMENT ON COLUMN owner_profiles.forme_juridique IS 'Forme juridique de la société';

-- ============================================
-- 3. Table des profils agence
-- ============================================

CREATE TABLE IF NOT EXISTS agency_profiles (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  raison_sociale TEXT NOT NULL,
  forme_juridique TEXT CHECK (forme_juridique IN ('SARL', 'SAS', 'SASU', 'SCI', 'EURL', 'EI', 'SA', 'autre')),
  siret TEXT,
  numero_carte_pro TEXT, -- Carte professionnelle immobilier
  carte_pro_delivree_par TEXT, -- CCI délivrant la carte
  carte_pro_validite DATE, -- Date de validité
  garantie_financiere_montant DECIMAL(12, 2), -- Montant de la garantie
  garantie_financiere_organisme TEXT, -- Organisme garantissant
  assurance_rcp TEXT, -- Numéro police RCP
  assurance_rcp_organisme TEXT, -- Assureur RCP
  adresse_siege TEXT,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  zones_intervention TEXT[], -- Départements/villes d'intervention
  services_proposes TEXT[] DEFAULT ARRAY['gestion_locative'], -- Types de services
  commission_gestion_defaut DECIMAL(4, 2) DEFAULT 7.0, -- Commission par défaut en %
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_profiles_siret ON agency_profiles(siret);

COMMENT ON TABLE agency_profiles IS 'Profils des agences immobilières et conciergeries';

-- ============================================
-- 4. Table des mandats de gestion
-- ============================================

CREATE TABLE IF NOT EXISTS mandates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_profile_id UUID NOT NULL REFERENCES agency_profiles(profile_id) ON DELETE CASCADE,
  owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informations du mandat
  numero_mandat TEXT, -- Numéro de mandat unique
  type_mandat TEXT NOT NULL DEFAULT 'gestion' CHECK (type_mandat IN ('gestion', 'location', 'vente', 'syndic')),
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin DATE, -- NULL = durée indéterminée
  duree_mois INTEGER, -- Durée en mois si déterminée
  tacite_reconduction BOOLEAN DEFAULT true,
  preavis_resiliation_mois INTEGER DEFAULT 3,
  
  -- Étendue du mandat
  properties_ids UUID[] DEFAULT '{}', -- Liste des biens concernés, vide = tous
  inclut_tous_biens BOOLEAN DEFAULT true, -- Si true, tous les biens du propriétaire
  
  -- Commission et rémunération
  commission_pourcentage DECIMAL(4, 2) NOT NULL DEFAULT 7.0, -- % sur loyers encaissés
  commission_fixe_mensuelle DECIMAL(10, 2), -- Alternative : montant fixe
  honoraires_mise_en_location DECIMAL(10, 2), -- Honoraires pour trouver un locataire
  honoraires_edl DECIMAL(10, 2), -- Honoraires état des lieux
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'draft' CHECK (statut IN ('draft', 'pending_signature', 'active', 'suspended', 'terminated')),
  date_signature DATE,
  document_mandat_url TEXT, -- URL du document signé
  
  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(agency_profile_id, owner_profile_id, type_mandat)
);

CREATE INDEX IF NOT EXISTS idx_mandates_agency ON mandates(agency_profile_id);
CREATE INDEX IF NOT EXISTS idx_mandates_owner ON mandates(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_mandates_statut ON mandates(statut);

COMMENT ON TABLE mandates IS 'Mandats de gestion entre agences et propriétaires';

-- ============================================
-- 5. Table des gestionnaires (employés agence)
-- ============================================

CREATE TABLE IF NOT EXISTS agency_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_profile_id UUID NOT NULL REFERENCES agency_profiles(profile_id) ON DELETE CASCADE,
  user_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  role_agence TEXT NOT NULL DEFAULT 'gestionnaire' CHECK (role_agence IN ('directeur', 'gestionnaire', 'assistant', 'comptable')),
  properties_assigned UUID[] DEFAULT '{}', -- Biens assignés à ce gestionnaire
  can_sign_documents BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(agency_profile_id, user_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_managers_agency ON agency_managers(agency_profile_id);
CREATE INDEX IF NOT EXISTS idx_agency_managers_user ON agency_managers(user_profile_id);

COMMENT ON TABLE agency_managers IS 'Gestionnaires employés par une agence';

-- ============================================
-- 6. Table des commissions générées
-- ============================================

CREATE TABLE IF NOT EXISTS agency_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  periode TEXT NOT NULL, -- Format YYYY-MM
  loyer_encaisse DECIMAL(10, 2) NOT NULL,
  taux_commission DECIMAL(4, 2) NOT NULL,
  montant_commission DECIMAL(10, 2) NOT NULL,
  montant_tva DECIMAL(10, 2) DEFAULT 0,
  montant_total_ttc DECIMAL(10, 2) NOT NULL,
  
  statut TEXT NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'invoiced', 'paid')),
  date_paiement DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_commissions_mandate ON agency_commissions(mandate_id);
CREATE INDEX IF NOT EXISTS idx_agency_commissions_periode ON agency_commissions(periode);
CREATE INDEX IF NOT EXISTS idx_agency_commissions_statut ON agency_commissions(statut);

COMMENT ON TABLE agency_commissions IS 'Commissions générées pour les agences';

-- ============================================
-- 7. RLS Policies
-- ============================================

-- Agency profiles
ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_profiles_select_own" ON agency_profiles
  FOR SELECT USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "agency_profiles_insert_own" ON agency_profiles
  FOR INSERT WITH CHECK (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "agency_profiles_update_own" ON agency_profiles
  FOR UPDATE USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Mandates
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mandates_select_agency" ON mandates
  FOR SELECT USING (
    agency_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR owner_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "mandates_insert_agency" ON mandates
  FOR INSERT WITH CHECK (
    agency_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'agency')
  );

CREATE POLICY "mandates_update_agency" ON mandates
  FOR UPDATE USING (
    agency_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Agency managers
ALTER TABLE agency_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_managers_select" ON agency_managers
  FOR SELECT USING (
    agency_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR user_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "agency_managers_manage" ON agency_managers
  FOR ALL USING (
    agency_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Agency commissions
ALTER TABLE agency_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_commissions_select" ON agency_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mandates m 
      WHERE m.id = mandate_id 
      AND (
        m.agency_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR m.owner_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================
-- 8. Fonction pour calculer les commissions
-- ============================================

CREATE OR REPLACE FUNCTION calculate_agency_commission(
  p_mandate_id UUID,
  p_periode TEXT,
  p_loyer_encaisse DECIMAL
)
RETURNS TABLE(
  montant_commission DECIMAL,
  montant_tva DECIMAL,
  montant_total_ttc DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_taux_commission DECIMAL;
  v_commission DECIMAL;
  v_tva DECIMAL;
  v_total DECIMAL;
BEGIN
  -- Récupérer le taux de commission du mandat
  SELECT commission_pourcentage INTO v_taux_commission
  FROM mandates
  WHERE id = p_mandate_id;
  
  IF v_taux_commission IS NULL THEN
    RAISE EXCEPTION 'Mandat non trouvé';
  END IF;
  
  -- Calculer la commission HT
  v_commission := p_loyer_encaisse * (v_taux_commission / 100);
  
  -- Calculer la TVA (20%)
  v_tva := v_commission * 0.20;
  
  -- Total TTC
  v_total := v_commission + v_tva;
  
  RETURN QUERY SELECT v_commission, v_tva, v_total;
END;
$$;

-- ============================================
-- 9. Vue pour le dashboard agence
-- ============================================

CREATE OR REPLACE VIEW agency_dashboard_stats AS
SELECT 
  ap.profile_id as agency_id,
  COUNT(DISTINCT m.id) as total_mandats,
  COUNT(DISTINCT m.id) FILTER (WHERE m.statut = 'active') as mandats_actifs,
  COUNT(DISTINCT m.owner_profile_id) as total_proprietaires,
  (
    SELECT COUNT(*) FROM properties p
    INNER JOIN profiles pr ON p.owner_id = pr.id
    INNER JOIN mandates m2 ON m2.owner_profile_id = pr.id AND m2.agency_profile_id = ap.profile_id
    WHERE m2.statut = 'active' AND (m2.inclut_tous_biens = true OR p.id = ANY(m2.properties_ids))
  ) as total_biens_geres,
  COALESCE(SUM(ac.montant_commission) FILTER (WHERE ac.statut = 'paid'), 0) as commissions_encaissees,
  COALESCE(SUM(ac.montant_commission) FILTER (WHERE ac.statut = 'pending'), 0) as commissions_en_attente
FROM agency_profiles ap
LEFT JOIN mandates m ON m.agency_profile_id = ap.profile_id
LEFT JOIN agency_commissions ac ON ac.mandate_id = m.id
GROUP BY ap.profile_id;

-- ============================================
-- 10. Triggers pour updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agency_profiles_updated_at ON agency_profiles;
CREATE TRIGGER update_agency_profiles_updated_at
  BEFORE UPDATE ON agency_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mandates_updated_at ON mandates;
CREATE TRIGGER update_mandates_updated_at
  BEFORE UPDATE ON mandates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agency_managers_updated_at ON agency_managers;
CREATE TRIGGER update_agency_managers_updated_at
  BEFORE UPDATE ON agency_managers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agency_commissions_updated_at ON agency_commissions;
CREATE TRIGGER update_agency_commissions_updated_at
  BEFORE UPDATE ON agency_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. Grants
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON agency_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON mandates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agency_managers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON agency_commissions TO authenticated;
GRANT SELECT ON agency_dashboard_stats TO authenticated;

-- ============================================
-- 12. Commentaires
-- ============================================

COMMENT ON COLUMN agency_profiles.numero_carte_pro IS 'Numéro de la carte professionnelle immobilier obligatoire';
COMMENT ON COLUMN mandates.commission_pourcentage IS 'Pourcentage de commission sur les loyers encaissés (généralement 5-10%)';
COMMENT ON COLUMN agency_commissions.periode IS 'Période de facturation au format YYYY-MM';

