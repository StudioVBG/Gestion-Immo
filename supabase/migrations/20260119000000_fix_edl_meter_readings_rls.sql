-- Migration: Corriger les RLS policies pour edl_meter_readings
-- Date: 2026-01-19
-- Raison: Les jointures utilisaient owner_profiles.id qui n'existe pas
--         properties.owner_id référence profiles(id) directement

-- Recréer les policies avec la bonne jointure (profiles.id = properties.owner_id)

-- 1. Policy: Les propriétaires voient les relevés de leurs biens
DROP POLICY IF EXISTS "edl_meter_readings_owner_select" ON edl_meter_readings;
CREATE POLICY "edl_meter_readings_owner_select" ON edl_meter_readings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM edl
      JOIN leases ON leases.id = edl.lease_id
      JOIN properties ON properties.id = leases.property_id
      JOIN profiles ON profiles.id = properties.owner_id
      WHERE edl.id = edl_meter_readings.edl_id
      AND profiles.user_id = auth.uid()
    )
  );

-- 2. Policy: Les propriétaires peuvent créer des relevés
DROP POLICY IF EXISTS "edl_meter_readings_owner_insert" ON edl_meter_readings;
CREATE POLICY "edl_meter_readings_owner_insert" ON edl_meter_readings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM edl
      JOIN leases ON leases.id = edl.lease_id
      JOIN properties ON properties.id = leases.property_id
      JOIN profiles ON profiles.id = properties.owner_id
      WHERE edl.id = edl_meter_readings.edl_id
      AND profiles.user_id = auth.uid()
    )
  );

-- 3. Policy: Les propriétaires peuvent modifier les relevés
DROP POLICY IF EXISTS "edl_meter_readings_owner_update" ON edl_meter_readings;
CREATE POLICY "edl_meter_readings_owner_update" ON edl_meter_readings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM edl
      JOIN leases ON leases.id = edl.lease_id
      JOIN properties ON properties.id = leases.property_id
      JOIN profiles ON profiles.id = properties.owner_id
      WHERE edl.id = edl_meter_readings.edl_id
      AND profiles.user_id = auth.uid()
    )
  );

-- 4. Policy: Les propriétaires peuvent supprimer les relevés
DROP POLICY IF EXISTS "edl_meter_readings_owner_delete" ON edl_meter_readings;
CREATE POLICY "edl_meter_readings_owner_delete" ON edl_meter_readings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM edl
      JOIN leases ON leases.id = edl.lease_id
      JOIN properties ON properties.id = leases.property_id
      JOIN profiles ON profiles.id = properties.owner_id
      WHERE edl.id = edl_meter_readings.edl_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Note: Les policies pour les locataires et admins restent inchangées
-- car elles n'utilisaient pas la jointure owner_profiles incorrecte
