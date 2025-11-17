-- Migration : Correction définitive de la récursion infinie dans les politiques RLS pour lease_signers
-- Problème : La politique RLS vérifie lease_signers dans sa propre définition, créant une boucle infinie
-- Solution : Supprimer la vérification récursive et utiliser uniquement des vérifications directes

-- Supprimer TOUTES les politiques existantes pour lease_signers pour repartir de zéro
DROP POLICY IF EXISTS "Users can view signers of accessible leases" ON lease_signers;
DROP POLICY IF EXISTS "Users can view own signature" ON lease_signers;
DROP POLICY IF EXISTS "Users can update own signature" ON lease_signers;
DROP POLICY IF EXISTS "Owners can insert signers for own leases" ON lease_signers;
DROP POLICY IF EXISTS "Owners can view signers of own leases" ON lease_signers;
DROP POLICY IF EXISTS "Tenants can view signers of own leases" ON lease_signers;
DROP POLICY IF EXISTS "Admins can view all lease signers" ON lease_signers;
DROP POLICY IF EXISTS "Admins can manage all signers" ON lease_signers;
DROP POLICY IF EXISTS "Admins can manage all lease signers" ON lease_signers;

-- Recréer les politiques SANS récursion
-- Politique 1 : Les admins peuvent tout voir (vérifié en premier pour éviter toute récursion)
CREATE POLICY "Admins can view all lease signers"
  ON lease_signers FOR SELECT
  USING (public.user_role() = 'admin');

-- Politique 2 : Les utilisateurs peuvent voir leur propre signature (vérification directe, pas de récursion)
CREATE POLICY "Users can view own signature"
  ON lease_signers FOR SELECT
  USING (profile_id = public.user_profile_id());

-- Politique 3 : Les propriétaires peuvent voir les signataires de leurs baux (via properties uniquement, pas via lease_signers)
CREATE POLICY "Owners can view signers of own leases"
  ON lease_signers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM leases l
      JOIN properties p ON p.id = l.property_id
      WHERE l.id = lease_signers.lease_id
      AND p.owner_id = public.user_profile_id()
    )
  );

-- Politique UPDATE : Les utilisateurs peuvent mettre à jour leur propre signature
CREATE POLICY "Users can update own signature"
  ON lease_signers FOR UPDATE
  USING (profile_id = public.user_profile_id())
  WITH CHECK (profile_id = public.user_profile_id());

-- Politique INSERT : Les propriétaires peuvent ajouter des signataires à leurs baux
CREATE POLICY "Owners can insert signers for own leases"
  ON lease_signers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM leases l
      JOIN properties p ON p.id = l.property_id
      WHERE l.id = lease_signers.lease_id
      AND p.owner_id = public.user_profile_id()
    )
    OR public.user_role() = 'admin'
  );

-- Politique ADMIN : Les admins peuvent tout gérer
CREATE POLICY "Admins can manage all lease signers"
  ON lease_signers FOR ALL
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');
