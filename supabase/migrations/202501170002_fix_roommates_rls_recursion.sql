-- Migration : Correction de la récursion dans les politiques RLS pour roommates
-- Problème : La politique vérifie roommates dans sa propre définition (ligne 15)
-- Solution : Utiliser une fonction SECURITY DEFINER ou simplifier la vérification

-- Supprimer la politique problématique
DROP POLICY IF EXISTS "Roommates same lease select" ON roommates;

-- Créer une fonction pour obtenir les lease_ids d'un utilisateur (évite la récursion)
-- Cette fonction utilise SECURITY DEFINER pour éviter la récursion dans les politiques RLS
CREATE OR REPLACE FUNCTION public.user_lease_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT DISTINCT lease_id 
  FROM roommates 
  WHERE user_id = auth.uid()
  AND left_on IS NULL;
$$;

-- Recréer la politique sans récursion
CREATE POLICY "Roommates same lease select"
  ON roommates FOR SELECT
  USING (
    lease_id IN (SELECT public.user_lease_ids())
    OR public.user_role() = 'admin'
  );

