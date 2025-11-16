-- Migration : Correction des politiques RLS pour leases et lease_signers
-- Utiliser public.user_profile_id() et public.user_role() au lieu de auth.*

-- Supprimer les anciennes politiques pour leases
DROP POLICY IF EXISTS "Owners can view leases of own properties" ON leases;
DROP POLICY IF EXISTS "Owners can view leases of own units" ON leases;
DROP POLICY IF EXISTS "Tenants can view own leases" ON leases;
DROP POLICY IF EXISTS "Owners can create leases for own properties" ON leases;
DROP POLICY IF EXISTS "Owners can update leases of own properties" ON leases;
DROP POLICY IF EXISTS "Admins can view all leases" ON leases;
DROP POLICY IF EXISTS "Admins can manage all leases" ON leases;

-- Recréer les politiques pour leases avec public.user_profile_id()
CREATE POLICY "Owners can view leases of own properties"
  ON leases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = leases.property_id
      AND p.owner_id = public.user_profile_id()
    )
    OR EXISTS (
      SELECT 1 FROM units u
      JOIN properties p ON p.id = u.property_id
      WHERE u.id = leases.unit_id
      AND p.owner_id = public.user_profile_id()
    )
  );

-- Les locataires peuvent voir leurs baux
CREATE POLICY "Tenants can view own leases"
  ON leases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lease_signers ls
      WHERE ls.lease_id = leases.id
      AND ls.profile_id = public.user_profile_id()
    )
  );

-- Les propriétaires peuvent créer des baux pour leurs propriétés
CREATE POLICY "Owners can create leases for own properties"
  ON leases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = leases.property_id
      AND p.owner_id = public.user_profile_id()
    )
    OR EXISTS (
      SELECT 1 FROM units u
      JOIN properties p ON p.id = u.property_id
      WHERE u.id = leases.unit_id
      AND p.owner_id = public.user_profile_id()
    )
    OR leases.property_id IS NULL  -- Permettre la création sans property_id (sera ajouté plus tard)
  );

-- Les propriétaires peuvent mettre à jour leurs baux
CREATE POLICY "Owners can update leases of own properties"
  ON leases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = leases.property_id
      AND p.owner_id = public.user_profile_id()
    )
    OR EXISTS (
      SELECT 1 FROM units u
      JOIN properties p ON p.id = u.property_id
      WHERE u.id = leases.unit_id
      AND p.owner_id = public.user_profile_id()
    )
  );

-- Les admins peuvent tout voir et gérer
CREATE POLICY "Admins can view all leases"
  ON leases FOR SELECT
  USING (public.user_role() = 'admin');

CREATE POLICY "Admins can manage all leases"
  ON leases FOR ALL
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- Supprimer les anciennes politiques pour lease_signers
DROP POLICY IF EXISTS "Users can view signers of accessible leases" ON lease_signers;
DROP POLICY IF EXISTS "Users can update own signature" ON lease_signers;
DROP POLICY IF EXISTS "Users can insert signers for accessible leases" ON lease_signers;
DROP POLICY IF EXISTS "Admins can manage all signers" ON lease_signers;

-- Recréer les politiques pour lease_signers avec public.user_profile_id()
CREATE POLICY "Users can view signers of accessible leases"
  ON lease_signers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases l
      WHERE l.id = lease_signers.lease_id
      AND (
        EXISTS (
          SELECT 1 FROM properties p
          WHERE p.id = l.property_id
          AND p.owner_id = public.user_profile_id()
        )
        OR EXISTS (
          SELECT 1 FROM lease_signers ls
          WHERE ls.lease_id = l.id
          AND ls.profile_id = public.user_profile_id()
        )
        OR public.user_role() = 'admin'
      )
    )
  );

-- Les utilisateurs peuvent mettre à jour leur propre signature
CREATE POLICY "Users can update own signature"
  ON lease_signers FOR UPDATE
  USING (profile_id = public.user_profile_id())
  WITH CHECK (profile_id = public.user_profile_id());

-- Les propriétaires peuvent ajouter des signataires à leurs baux
CREATE POLICY "Owners can insert signers for own leases"
  ON lease_signers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leases l
      WHERE l.id = lease_signers.lease_id
      AND (
        EXISTS (
          SELECT 1 FROM properties p
          WHERE p.id = l.property_id
          AND p.owner_id = public.user_profile_id()
        )
        OR EXISTS (
          SELECT 1 FROM units u
          JOIN properties p ON p.id = u.property_id
          WHERE u.id = l.unit_id
          AND p.owner_id = public.user_profile_id()
        )
      )
    )
  );

-- Les admins peuvent tout gérer
CREATE POLICY "Admins can manage all signers"
  ON lease_signers FOR ALL
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

