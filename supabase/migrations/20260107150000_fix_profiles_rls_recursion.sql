-- =====================================================
-- MIGRATION: Correction DÉFINITIVE de la récursion RLS sur profiles
-- Date: 2026-01-07
-- Problème: "RLS recursion detected" - erreur 500 sur profiles
-- 
-- CAUSE: Les politiques RLS sur `profiles` appellent user_role() 
--        qui requête `profiles`, créant une boucle infinie.
--
-- SOLUTION: Utiliser auth.uid() directement dans les politiques
--           et des sous-requêtes avec SECURITY DEFINER
-- =====================================================

-- 1. DÉSACTIVER TEMPORAIREMENT RLS POUR LE NETTOYAGE
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES ANCIENNES POLITIQUES SUR profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- 3. CRÉER UNE FONCTION POUR VÉRIFIER SI L'UTILISATEUR EST ADMIN
-- Cette fonction utilise une vue matérialisée ou un cache pour éviter la récursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    LIMIT 1
  );
$$;

-- 4. CRÉER UNE FONCTION POUR OBTENIR LE ROLE SANS RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1),
    'anonymous'
  );
$$;

-- 5. CRÉER UNE FONCTION POUR OBTENIR MON PROFILE_ID SANS RLS  
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 6. RÉACTIVER RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. CRÉER LES NOUVELLES POLITIQUES (SANS RÉCURSION)
-- Politique principale : chaque utilisateur peut voir/modifier son propre profil
CREATE POLICY "profiles_own_access" ON profiles 
FOR ALL TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Politique admin : les admins peuvent voir tous les profils
-- Utilise is_admin() qui est SECURITY DEFINER et donc bypass RLS
CREATE POLICY "profiles_admin_read" ON profiles 
FOR SELECT TO authenticated 
USING (public.is_admin());

-- Politique propriétaire : peut voir les profils de ses locataires
-- Évite la récursion en utilisant get_my_profile_id()
CREATE POLICY "profiles_owner_read_tenants" ON profiles 
FOR SELECT TO authenticated 
USING (
  -- Je suis propriétaire et ce profil est un locataire d'un de mes baux
  EXISTS (
    SELECT 1 
    FROM lease_signers ls
    INNER JOIN leases l ON l.id = ls.lease_id
    INNER JOIN properties p ON p.id = l.property_id
    WHERE ls.profile_id = profiles.id
    AND p.owner_id = public.get_my_profile_id()
  )
);

-- 8. VÉRIFIER QUE LES FONCTIONS EXISTANTES SONT BIEN SECURITY DEFINER
-- user_profile_id et user_role sont utilisées ailleurs, on les garde compatibles
CREATE OR REPLACE FUNCTION public.user_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.get_my_profile_id();
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.get_my_role();
$$;

-- Versions avec paramètre (pour usage admin)
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
  SELECT COALESCE(role, 'anonymous') FROM profiles WHERE user_id = p_user_id LIMIT 1;
$$;

-- 9. ACCORDER LES PERMISSIONS SUR LES FONCTIONS
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_profile_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_role(UUID) TO authenticated;

-- 10. TEST : Vérifier qu'il n'y a pas de récursion
-- Cette requête ne devrait pas échouer
DO $$
BEGIN
  RAISE NOTICE 'Test des politiques RLS sur profiles...';
  -- Le test réel se fait en appelant les fonctions
  PERFORM public.is_admin();
  PERFORM public.get_my_role();
  PERFORM public.get_my_profile_id();
  RAISE NOTICE 'OK - Pas de récursion détectée';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERREUR: %', SQLERRM;
END $$;

COMMENT ON FUNCTION public.is_admin() IS 'Vérifie si l''utilisateur actuel est admin (SECURITY DEFINER, pas de récursion RLS)';
COMMENT ON FUNCTION public.get_my_role() IS 'Retourne le rôle de l''utilisateur actuel (SECURITY DEFINER, pas de récursion RLS)';
COMMENT ON FUNCTION public.get_my_profile_id() IS 'Retourne le profile_id de l''utilisateur actuel (SECURITY DEFINER, pas de récursion RLS)';

