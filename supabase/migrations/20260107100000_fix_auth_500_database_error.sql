-- =====================================================
-- MIGRATION: Fix erreur "Database error querying schema" (500)
-- Date: 2026-01-07
-- Problème: L'authentification échoue avec une erreur 500
-- Cause: Fonctions RLS manquantes ou politiques mal configurées
-- =====================================================

-- 1. RECRÉER LES FONCTIONS HELPER AVEC SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.user_profile_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = p_user_id LIMIT 1;
$$;

-- 2. S'ASSURER QUE RLS EST ACTIVÉ
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. NETTOYER LES ANCIENNES POLITIQUES
DROP POLICY IF EXISTS "profiles_self_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_owner_view_tenants" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_view_all_profiles" ON profiles;

-- 4. CRÉER LES NOUVELLES POLITIQUES
CREATE POLICY "profiles_self_all" ON profiles 
FOR ALL TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_admin_all" ON profiles 
FOR SELECT TO authenticated 
USING (public.user_role() = 'admin');

CREATE POLICY "profiles_owner_view_tenants" ON profiles 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM lease_signers ls
    JOIN leases l ON l.id = ls.lease_id
    JOIN properties p ON p.id = l.property_id
    WHERE ls.profile_id = profiles.id
    AND p.owner_id = public.user_profile_id()
  )
);

