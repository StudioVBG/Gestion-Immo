-- ============================================
-- Migration : Correction complète de tous les rôles
-- Date: 2024-12-08
-- Corrige: guarantor, agency, syndic, copropriétaire
-- ============================================

BEGIN;

-- ============================================
-- 1. CORRIGER LA CONTRAINTE CHECK DES RÔLES
-- ============================================

-- Supprimer l'ancienne contrainte
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Ajouter la nouvelle contrainte avec TOUS les rôles
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'owner', 'tenant', 'provider', 'agency', 'guarantor', 'syndic', 'coproprietaire'));

COMMENT ON CONSTRAINT profiles_role_check ON profiles IS 'Contrainte des rôles valides: admin, owner, tenant, provider, agency, guarantor, syndic, coproprietaire';

-- ============================================
-- 2. TABLE GUARANTOR_PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS guarantor_profiles (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informations personnelles
  situation_professionnelle TEXT CHECK (situation_professionnelle IN (
    'salarie_cdi', 'salarie_cdd', 'fonctionnaire', 'independant', 
    'retraite', 'sans_emploi', 'etudiant', 'autre'
  )),
  employeur TEXT,
  profession TEXT,
  revenus_mensuels_nets DECIMAL(10, 2),
  revenus_annuels DECIMAL(12, 2),
  
  -- Patrimoine
  proprietaire_residence BOOLEAN DEFAULT false,
  valeur_patrimoine_immobilier DECIMAL(12, 2),
  epargne_disponible DECIMAL(12, 2),
  
  -- Documents
  documents_verified BOOLEAN DEFAULT false,
  avis_imposition_url TEXT,
  justificatif_domicile_url TEXT,
  cni_url TEXT,
  
  -- Statut
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guarantor_profiles_verified ON guarantor_profiles(documents_verified);
CREATE INDEX IF NOT EXISTS idx_guarantor_profiles_onboarding ON guarantor_profiles(onboarding_completed);

COMMENT ON TABLE guarantor_profiles IS 'Profils des garants avec informations financières';

-- ============================================
-- 3. TABLE DES ENGAGEMENTS DE GARANTIE
-- ============================================

CREATE TABLE IF NOT EXISTS guarantor_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guarantor_profile_id UUID NOT NULL REFERENCES guarantor_profiles(profile_id) ON DELETE CASCADE,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Détails de l'engagement
  type_garantie TEXT NOT NULL DEFAULT 'caution_simple' 
    CHECK (type_garantie IN ('caution_simple', 'caution_solidaire')),
  montant_max_garanti DECIMAL(10, 2), -- Montant max couvert (null = illimité)
  duree_engagement TEXT CHECK (duree_engagement IN ('duree_bail', 'illimitee', 'limitee')),
  date_fin_engagement DATE, -- Si durée limitée
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'pending' 
    CHECK (statut IN ('pending', 'active', 'expired', 'invoked', 'terminated')),
  date_signature DATE,
  document_engagement_url TEXT,
  
  -- Historique d'invocation
  date_derniere_invocation DATE,
  montant_total_invoque DECIMAL(10, 2) DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(guarantor_profile_id, lease_id, tenant_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_guarantor_engagements_guarantor ON guarantor_engagements(guarantor_profile_id);
CREATE INDEX IF NOT EXISTS idx_guarantor_engagements_lease ON guarantor_engagements(lease_id);
CREATE INDEX IF NOT EXISTS idx_guarantor_engagements_tenant ON guarantor_engagements(tenant_profile_id);
CREATE INDEX IF NOT EXISTS idx_guarantor_engagements_statut ON guarantor_engagements(statut);

COMMENT ON TABLE guarantor_engagements IS 'Engagements de caution des garants pour les baux';

-- ============================================
-- 4. TABLES SYNDIC/COPRO (si non existantes)
-- ============================================

-- Table des sites de copropriété
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'copropriete' CHECK (type IN ('copropriete', 'lotissement', 'residence_mixte', 'asl', 'aful')),
  
  -- Adresse
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'FR',
  
  -- Informations légales
  siret TEXT,
  numero_immatriculation TEXT,
  date_reglement DATE,
  
  -- Configuration
  fiscal_year_start_month INTEGER DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  total_tantiemes_general INTEGER DEFAULT 10000,
  
  -- Syndic
  syndic_type TEXT DEFAULT 'professionnel' CHECK (syndic_type IN ('professionnel', 'benevole', 'cooperatif')),
  syndic_profile_id UUID REFERENCES profiles(id),
  syndic_company_name TEXT,
  syndic_siret TEXT,
  syndic_address TEXT,
  syndic_email TEXT,
  syndic_phone TEXT,
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  
  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sites_syndic ON sites(syndic_profile_id);
CREATE INDEX IF NOT EXISTS idx_sites_active ON sites(is_active);

COMMENT ON TABLE sites IS 'Sites de copropriété gérés';

-- Table des bâtiments
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT, -- Code interne (ex: A, B, Entrée 1)
  floors_count INTEGER,
  has_elevator BOOLEAN DEFAULT false,
  construction_year INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_site ON buildings(site_id);

COMMENT ON TABLE buildings IS 'Bâtiments d''une copropriété';

-- Table des lots (unités de copropriété)
CREATE TABLE IF NOT EXISTS copro_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  
  -- Identification
  lot_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('appartement', 'parking', 'cave', 'box', 'local_commercial', 'bureau', 'autre')),
  description TEXT,
  floor INTEGER,
  surface DECIMAL(8, 2),
  
  -- Propriétaire
  owner_profile_id UUID REFERENCES profiles(id),
  
  -- Tantièmes
  tantieme_general INTEGER NOT NULL DEFAULT 0,
  tantiemes_speciaux JSONB DEFAULT '{}', -- {"ascenseur": 100, "chauffage": 150}
  
  -- Lien avec le module locatif
  property_id UUID REFERENCES properties(id), -- Si le lot est aussi un bien locatif
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(site_id, lot_number)
);

CREATE INDEX IF NOT EXISTS idx_copro_units_site ON copro_units(site_id);
CREATE INDEX IF NOT EXISTS idx_copro_units_building ON copro_units(building_id);
CREATE INDEX IF NOT EXISTS idx_copro_units_owner ON copro_units(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_copro_units_property ON copro_units(property_id);

COMMENT ON TABLE copro_units IS 'Lots (unités) de copropriété';

-- Table des rôles utilisateurs sur les sites
CREATE TABLE IF NOT EXISTS user_site_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL CHECK (role_code IN ('syndic', 'conseil_syndical', 'coproprietaire', 'coproprietaire_bailleur', 'locataire_copro')),
  
  -- Si copropriétaire, lier aux lots
  unit_ids UUID[] DEFAULT '{}',
  
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, site_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_user_site_roles_user ON user_site_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_site_roles_site ON user_site_roles(site_id);
CREATE INDEX IF NOT EXISTS idx_user_site_roles_role ON user_site_roles(role_code);

COMMENT ON TABLE user_site_roles IS 'Rôles des utilisateurs sur les sites de copropriété';

-- ============================================
-- 5. RLS POLICIES POUR GUARANTOR
-- ============================================

ALTER TABLE guarantor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantor_engagements ENABLE ROW LEVEL SECURITY;

-- Guarantor profiles - voir son propre profil
CREATE POLICY "guarantor_profiles_select_own" ON guarantor_profiles
  FOR SELECT USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Guarantor profiles - créer son propre profil
CREATE POLICY "guarantor_profiles_insert_own" ON guarantor_profiles
  FOR INSERT WITH CHECK (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Guarantor profiles - modifier son propre profil
CREATE POLICY "guarantor_profiles_update_own" ON guarantor_profiles
  FOR UPDATE USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Admin peut tout voir et modifier
CREATE POLICY "guarantor_profiles_admin_all" ON guarantor_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Engagements - le garant voit ses engagements
CREATE POLICY "guarantor_engagements_select_guarantor" ON guarantor_engagements
  FOR SELECT USING (
    guarantor_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Engagements - le propriétaire voit les engagements de ses baux
CREATE POLICY "guarantor_engagements_select_owner" ON guarantor_engagements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = lease_id
      AND p.owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Engagements - le locataire voit les engagements le concernant
CREATE POLICY "guarantor_engagements_select_tenant" ON guarantor_engagements
  FOR SELECT USING (
    tenant_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Engagements - admin peut tout voir
CREATE POLICY "guarantor_engagements_admin_all" ON guarantor_engagements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 6. RLS POLICIES POUR SYNDIC/COPRO
-- ============================================

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE copro_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_site_roles ENABLE ROW LEVEL SECURITY;

-- Sites - le syndic peut tout faire sur ses sites
CREATE POLICY "sites_syndic_all" ON sites
  FOR ALL USING (
    syndic_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Sites - les copropriétaires peuvent voir leurs sites
CREATE POLICY "sites_coproprietaire_select" ON sites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_site_roles usr
      WHERE usr.site_id = sites.id
      AND usr.user_id = auth.uid()
    )
  );

-- Sites - admin peut tout voir
CREATE POLICY "sites_admin_all" ON sites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Buildings - accessible via le site
CREATE POLICY "buildings_via_site" ON buildings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = site_id
      AND (
        s.syndic_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM user_site_roles usr WHERE usr.site_id = s.id AND usr.user_id = auth.uid())
      )
    )
  );

-- Buildings - syndic peut modifier
CREATE POLICY "buildings_syndic_manage" ON buildings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = site_id
      AND s.syndic_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Copro_units - accessible via le site
CREATE POLICY "copro_units_via_site" ON copro_units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = site_id
      AND (
        s.syndic_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM user_site_roles usr WHERE usr.site_id = s.id AND usr.user_id = auth.uid())
      )
    )
    OR owner_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Copro_units - syndic peut modifier
CREATE POLICY "copro_units_syndic_manage" ON copro_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = site_id
      AND s.syndic_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- User_site_roles - visible par l'utilisateur concerné ou le syndic
CREATE POLICY "user_site_roles_select" ON user_site_roles
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = site_id
      AND s.syndic_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- User_site_roles - syndic peut gérer
CREATE POLICY "user_site_roles_syndic_manage" ON user_site_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = site_id
      AND s.syndic_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- 7. FONCTION RPC GUARANTOR_DASHBOARD
-- ============================================

CREATE OR REPLACE FUNCTION guarantor_dashboard(p_guarantor_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_guarantor_profile RECORD;
  v_engagements JSONB;
  v_stats JSONB;
BEGIN
  -- Récupérer le profile_id
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = p_guarantor_user_id;
  
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  
  -- Récupérer le profil garant
  SELECT * INTO v_guarantor_profile
  FROM guarantor_profiles
  WHERE profile_id = v_profile_id;
  
  IF v_guarantor_profile IS NULL THEN
    RETURN jsonb_build_object(
      'has_profile', false,
      'onboarding_required', true
    );
  END IF;
  
  -- Récupérer les engagements
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ge.id,
      'lease_id', ge.lease_id,
      'tenant_name', COALESCE(tp.prenom || ' ' || tp.nom, 'Inconnu'),
      'property_address', COALESCE(pr.adresse_complete, 'Adresse inconnue'),
      'type_garantie', ge.type_garantie,
      'statut', ge.statut,
      'montant_max_garanti', ge.montant_max_garanti,
      'loyer', l.loyer,
      'date_signature', ge.date_signature
    )
  ), '[]'::jsonb)
  INTO v_engagements
  FROM guarantor_engagements ge
  JOIN leases l ON l.id = ge.lease_id
  JOIN profiles tp ON tp.id = ge.tenant_profile_id
  LEFT JOIN properties pr ON pr.id = l.property_id
  WHERE ge.guarantor_profile_id = v_profile_id;
  
  -- Calculer les stats
  SELECT jsonb_build_object(
    'total_engagements', COUNT(*),
    'engagements_actifs', COUNT(*) FILTER (WHERE statut = 'active'),
    'engagements_en_attente', COUNT(*) FILTER (WHERE statut = 'pending'),
    'montant_total_garanti', COALESCE(SUM(l.loyer) FILTER (WHERE ge.statut = 'active'), 0)
  )
  INTO v_stats
  FROM guarantor_engagements ge
  JOIN leases l ON l.id = ge.lease_id
  WHERE ge.guarantor_profile_id = v_profile_id;
  
  RETURN jsonb_build_object(
    'has_profile', true,
    'onboarding_completed', v_guarantor_profile.onboarding_completed,
    'documents_verified', v_guarantor_profile.documents_verified,
    'profile', jsonb_build_object(
      'situation_professionnelle', v_guarantor_profile.situation_professionnelle,
      'profession', v_guarantor_profile.profession,
      'revenus_mensuels_nets', v_guarantor_profile.revenus_mensuels_nets
    ),
    'engagements', v_engagements,
    'stats', v_stats
  );
END;
$$;

COMMENT ON FUNCTION guarantor_dashboard IS 'Retourne les données du dashboard garant';

-- ============================================
-- 8. FONCTION RPC SYNDIC_DASHBOARD
-- ============================================

CREATE OR REPLACE FUNCTION syndic_dashboard(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_sites JSONB;
  v_stats JSONB;
BEGIN
  -- Récupérer le profile_id
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = p_user_id;
  
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  
  -- Récupérer les sites gérés
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'type', s.type,
      'address', s.address_line1 || ', ' || s.postal_code || ' ' || s.city,
      'total_tantiemes', s.total_tantiemes_general,
      'buildings_count', (SELECT COUNT(*) FROM buildings b WHERE b.site_id = s.id),
      'units_count', (SELECT COUNT(*) FROM copro_units cu WHERE cu.site_id = s.id)
    )
  ), '[]'::jsonb)
  INTO v_sites
  FROM sites s
  WHERE s.syndic_profile_id = v_profile_id
  AND s.is_active = true;
  
  -- Calculer les stats globales
  SELECT jsonb_build_object(
    'total_sites', COUNT(*),
    'total_buildings', (SELECT COUNT(*) FROM buildings b JOIN sites s2 ON b.site_id = s2.id WHERE s2.syndic_profile_id = v_profile_id),
    'total_units', (SELECT COUNT(*) FROM copro_units cu JOIN sites s3 ON cu.site_id = s3.id WHERE s3.syndic_profile_id = v_profile_id),
    'total_coproprietaires', (
      SELECT COUNT(DISTINCT usr.user_id) 
      FROM user_site_roles usr 
      JOIN sites s4 ON usr.site_id = s4.id 
      WHERE s4.syndic_profile_id = v_profile_id
      AND usr.role_code IN ('coproprietaire', 'coproprietaire_bailleur')
    )
  )
  INTO v_stats
  FROM sites s
  WHERE s.syndic_profile_id = v_profile_id
  AND s.is_active = true;
  
  RETURN jsonb_build_object(
    'profile_id', v_profile_id,
    'sites', v_sites,
    'stats', v_stats
  );
END;
$$;

COMMENT ON FUNCTION syndic_dashboard IS 'Retourne les données du dashboard syndic';

-- ============================================
-- 9. TRIGGERS UPDATED_AT
-- ============================================

-- Trigger générique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_guarantor_profiles_updated_at ON guarantor_profiles;
CREATE TRIGGER update_guarantor_profiles_updated_at
  BEFORE UPDATE ON guarantor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guarantor_engagements_updated_at ON guarantor_engagements;
CREATE TRIGGER update_guarantor_engagements_updated_at
  BEFORE UPDATE ON guarantor_engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buildings_updated_at ON buildings;
CREATE TRIGGER update_buildings_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_copro_units_updated_at ON copro_units;
CREATE TRIGGER update_copro_units_updated_at
  BEFORE UPDATE ON copro_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON guarantor_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON guarantor_engagements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON buildings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON copro_units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_site_roles TO authenticated;

COMMIT;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

