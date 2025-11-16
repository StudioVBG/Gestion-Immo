-- Migration : S'assurer que les politiques utilisent public.user_profile_id() explicitement
-- Corriger la politique INSERT pour utiliser le préfixe public.

DROP POLICY IF EXISTS "Owners can create leases for own properties" ON leases;

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
    OR leases.property_id IS NULL  -- Permettre la création sans property_id
  );

