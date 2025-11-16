-- Migration : Correction de la récursion infinie dans user_profile_id
-- La fonction doit utiliser SECURITY DEFINER et STABLE pour éviter la récursion RLS
-- Note: Les fonctions existent déjà dans auth, on les modifie pour ajouter STABLE

-- Modifier public.user_profile_id() pour ajouter STABLE et LIMIT 1
-- SECURITY DEFINER permet de bypasser RLS lors de l'exécution de la fonction
CREATE OR REPLACE FUNCTION public.user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Modifier public.user_role() de manière similaire
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Commentaire : SECURITY DEFINER permet à la fonction d'exécuter avec les privilèges
-- du créateur de la fonction, bypassant ainsi les politiques RLS lors de l'exécution
-- de la fonction elle-même. STABLE indique que la fonction ne modifie pas la base
-- de données et peut être optimisée par le planificateur de requêtes.

