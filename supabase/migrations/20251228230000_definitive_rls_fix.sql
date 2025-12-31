-- MASTER FIX: Éradication de la récursion infinie RLS
-- Ce script nettoie TOUTES les politiques sur les tables critiques et recrée des règles saines.
-- Tables cibles : lease_signers, leases, roommates, tenant_profiles, meters

BEGIN;

-- ============================================
-- 1. FONCTIONS HELPERS (SECURITY DEFINER)
-- Ces fonctions bypassent RLS et cassent les boucles.
-- ============================================

CREATE OR REPLACE FUNCTION public.user_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper pour vérifier si un utilisateur est lié à un bail (locataire/colocataire)
CREATE OR REPLACE FUNCTION public.is_lease_member(p_lease_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lease_signers 
    WHERE lease_id = p_lease_id 
    AND profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
$$;

-- Helper pour vérifier si un utilisateur est propriétaire d'un bail via property
CREATE OR REPLACE FUNCTION public.is_lease_owner(p_lease_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM leases l
    JOIN properties p ON p.id = l.property_id
    WHERE l.id = p_lease_id 
    AND p.owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
$$;

-- ============================================
-- 2. NETTOYAGE RADICAL
-- Supprime TOUTES les politiques sur les tables à risque pour repartir à zéro.
-- ============================================

DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('lease_signers', 'leases', 'roommates', 'tenant_profiles', 'meters', 'meter_readings', 'profiles')
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
  END LOOP;
END $$;

-- ============================================
-- 3. NOUVELLES POLITIQUES : PROFILES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_all" ON profiles FOR ALL TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_admin_all" ON profiles FOR ALL TO authenticated 
USING (public.user_role() = 'admin');

CREATE POLICY "profiles_owner_view_tenants" ON profiles FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM lease_signers ls
    JOIN leases l ON l.id = ls.lease_id
    JOIN properties p ON p.id = l.property_id
    WHERE ls.profile_id = profiles.id
    AND p.owner_id = public.user_profile_id()
  )
);

-- ============================================
-- 4. NOUVELLES POLITIQUES : LEASES
-- ============================================

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leases_admin_all" ON leases FOR ALL TO authenticated USING (public.user_role() = 'admin');

CREATE POLICY "leases_owner_all" ON leases FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = leases.property_id 
    AND p.owner_id = public.user_profile_id()
  )
);

CREATE POLICY "leases_tenant_select" ON leases FOR SELECT TO authenticated 
USING (public.is_lease_member(id));

-- ============================================
-- 4. NOUVELLES POLITIQUES : LEASE_SIGNERS
-- ============================================

ALTER TABLE lease_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ls_admin_all" ON lease_signers FOR ALL TO authenticated USING (public.user_role() = 'admin');

CREATE POLICY "ls_self_manage" ON lease_signers FOR ALL TO authenticated 
USING (profile_id = public.user_profile_id())
WITH CHECK (profile_id = public.user_profile_id());

CREATE POLICY "ls_owner_manage" ON lease_signers FOR ALL TO authenticated 
USING (public.is_lease_owner(lease_id));

CREATE POLICY "ls_tenant_view_others" ON lease_signers FOR SELECT TO authenticated 
USING (public.is_lease_member(lease_id));

-- ============================================
-- 5. NOUVELLES POLITIQUES : METERS & READINGS
-- ============================================

-- Corrections structurelles sur la table meters
ALTER TABLE meters ALTER COLUMN lease_id DROP NOT NULL;
ALTER TABLE meters DROP CONSTRAINT IF EXISTS meters_unit_check;

ALTER TABLE meters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meters_admin_all" ON meters FOR ALL TO authenticated USING (public.user_role() = 'admin');

CREATE POLICY "meters_owner_manage" ON meters FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = meters.property_id 
    AND p.owner_id = public.user_profile_id()
  )
);

CREATE POLICY "meters_tenant_select" ON meters FOR SELECT TO authenticated 
USING (public.is_lease_member(lease_id));

-- Meter Readings
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "readings_admin_all" ON meter_readings FOR ALL TO authenticated USING (public.user_role() = 'admin');

CREATE POLICY "readings_owner_manage" ON meter_readings FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM meters m
    JOIN properties p ON p.id = m.property_id
    WHERE m.id = meter_readings.meter_id
    AND p.owner_id = public.user_profile_id()
  )
);

CREATE POLICY "readings_tenant_all" ON meter_readings FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM meters m
    WHERE m.id = meter_readings.meter_id
    AND public.is_lease_member(m.lease_id)
  )
);

-- ============================================
-- 6. NOUVELLES POLITIQUES : ROOMMATES
-- ============================================

ALTER TABLE roommates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roommates_admin_all" ON roommates FOR ALL TO authenticated USING (public.user_role() = 'admin');

CREATE POLICY "roommates_owner_manage" ON roommates FOR ALL TO authenticated 
USING (public.is_lease_owner(lease_id));

CREATE POLICY "roommates_member_select" ON roommates FOR SELECT TO authenticated 
USING (public.is_lease_member(lease_id));

-- ============================================
-- 7. NOUVELLES POLITIQUES : TENANT_PROFILES
-- ============================================

ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tp_admin_all" ON tenant_profiles FOR ALL TO authenticated USING (public.user_role() = 'admin');

CREATE POLICY "tp_self_manage" ON tenant_profiles FOR ALL TO authenticated 
USING (profile_id = public.user_profile_id());

CREATE POLICY "tp_owner_view" ON tenant_profiles FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM lease_signers ls
    JOIN leases l ON l.id = ls.lease_id
    JOIN properties p ON p.id = l.property_id
    WHERE ls.profile_id = tenant_profiles.profile_id
    AND p.owner_id = public.user_profile_id()
  )
);

COMMIT;

