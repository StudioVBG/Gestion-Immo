-- Migration : Correction définitive de la récursion infinie dans les politiques RLS
-- Problème : Les fonctions public.user_profile_id() et public.user_role() peuvent causer
-- une récursion infinie si elles ne bypassent pas correctement RLS

-- Note: Le schéma auth est protégé, donc on crée les fonctions dans public
-- et on met à jour les politiques pour utiliser public.user_profile_id() et public.user_role()

-- Supprimer les fonctions existantes dans public si elles existent
DROP FUNCTION IF EXISTS public.user_profile_id() CASCADE;
DROP FUNCTION IF EXISTS public.user_role() CASCADE;

-- Créer user_profile_id() dans public avec SECURITY DEFINER et STABLE
-- SECURITY DEFINER permet de bypasser RLS lors de l'exécution
-- STABLE indique que la fonction ne modifie pas la base de données
CREATE OR REPLACE FUNCTION public.user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Créer user_role() dans public de manière similaire
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Activer RLS sur properties si ce n'est pas déjà fait
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Owners can view own properties" ON properties;
DROP POLICY IF EXISTS "Owners can create own properties" ON properties;
DROP POLICY IF EXISTS "Owners can update own properties" ON properties;
DROP POLICY IF EXISTS "Tenants can view properties with active leases" ON properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;

-- Recréer les politiques en utilisant public.user_profile_id() et public.user_role()

-- Les propriétaires peuvent voir leurs propres logements
CREATE POLICY "Owners can view own properties"
  ON properties FOR SELECT
  USING (owner_id = public.user_profile_id());

-- Les propriétaires peuvent créer leurs propres logements
CREATE POLICY "Owners can create own properties"
  ON properties FOR INSERT
  WITH CHECK (owner_id = public.user_profile_id());

-- Les propriétaires peuvent mettre à jour leurs propres logements
CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  USING (owner_id = public.user_profile_id());

-- Les locataires peuvent voir les logements où ils ont un bail actif
CREATE POLICY "Tenants can view properties with active leases"
  ON properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN lease_signers ls ON ls.lease_id = l.id
      WHERE l.property_id = properties.id
      AND ls.profile_id = public.user_profile_id()
      AND l.statut = 'active'
    )
  );

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all properties"
  ON properties FOR SELECT
  USING (public.user_role() = 'admin');

-- Commentaire : 
-- SECURITY DEFINER permet à la fonction d'exécuter avec les privilèges du créateur
-- (généralement le superuser), bypassant ainsi les politiques RLS lors de l'exécution
-- de la fonction elle-même. STABLE indique que la fonction ne modifie pas la base
-- de données et peut être optimisée par le planificateur de requêtes.

