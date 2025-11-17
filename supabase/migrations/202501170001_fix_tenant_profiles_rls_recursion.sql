-- Migration : Correction de la récursion dans les politiques RLS pour tenant_profiles
-- Problème : La politique utilise lease_signers qui peut causer une récursion
-- Solution : Utiliser une fonction SECURITY DEFINER pour éviter la récursion

-- Supprimer la politique problématique
DROP POLICY IF EXISTS "Owners can view tenant profiles of their properties" ON tenant_profiles;

-- Créer une fonction SECURITY DEFINER pour vérifier si un tenant est dans un bail du propriétaire
-- Cette fonction évite la récursion car elle s'exécute avec les privilèges du créateur
CREATE OR REPLACE FUNCTION public.tenant_is_in_owner_lease(tenant_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  current_user_profile_id UUID;
BEGIN
  -- Obtenir le profile_id de l'utilisateur actuel
  SELECT id INTO current_user_profile_id
  FROM profiles
  WHERE user_id = auth.uid();
  
  IF current_user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si le tenant est dans un bail du propriétaire
  RETURN EXISTS (
    SELECT 1 
    FROM lease_signers ls
    JOIN leases l ON l.id = ls.lease_id
    JOIN properties p ON p.id = l.property_id
    WHERE ls.profile_id = tenant_profile_id
    AND p.owner_id = current_user_profile_id
  );
END;
$$;

-- Recréer la politique avec la fonction (qui évite la récursion grâce à SECURITY DEFINER)
CREATE POLICY "Owners can view tenant profiles of their properties"
  ON tenant_profiles FOR SELECT
  USING (
    public.user_role() = 'admin'
    OR public.tenant_is_in_owner_lease(tenant_profiles.profile_id)
  );

