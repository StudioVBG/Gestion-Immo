-- ============================================================================
-- Fix meter_readings RLS policies to handle meters without property_id
-- ============================================================================
-- Date: 2026-01-21
-- Issue: Meters can have null property_id, but RLS policy requires it for JOIN
-- Solution: Add fallback to check via lease_id if property_id is null
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Owners can manage readings of own property meters" ON public.meter_readings;
DROP POLICY IF EXISTS "readings_admin_all" ON public.meter_readings;
DROP POLICY IF EXISTS "readings_owner_manage" ON public.meter_readings;
DROP POLICY IF EXISTS "readings_tenant_all" ON public.meter_readings;

-- Ensure RLS is enabled
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;

-- 1. Admin policy
CREATE POLICY "meter_readings_admin_all" ON public.meter_readings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. Owner policy - handles both property_id and lease_id paths
CREATE POLICY "meter_readings_owner_manage" ON public.meter_readings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters m
      LEFT JOIN properties p ON p.id = m.property_id
      LEFT JOIN leases l ON l.id = m.lease_id
      LEFT JOIN properties lp ON lp.id = l.property_id
      WHERE m.id = meter_readings.meter_id
      AND (
        -- Path 1: Via meter.property_id
        (p.owner_id IS NOT NULL AND p.owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        ))
        OR
        -- Path 2: Via meter.lease_id -> lease.property_id
        (lp.owner_id IS NOT NULL AND lp.owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meters m
      LEFT JOIN properties p ON p.id = m.property_id
      LEFT JOIN leases l ON l.id = m.lease_id
      LEFT JOIN properties lp ON lp.id = l.property_id
      WHERE m.id = meter_readings.meter_id
      AND (
        (p.owner_id IS NOT NULL AND p.owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        ))
        OR
        (lp.owner_id IS NOT NULL AND lp.owner_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        ))
      )
    )
  );

-- 3. Tenant policy - can read/create readings for meters on their leases
CREATE POLICY "meter_readings_tenant_manage" ON public.meter_readings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters m
      JOIN leases l ON l.id = m.lease_id
      JOIN lease_signers ls ON ls.lease_id = l.id
      JOIN profiles pr ON pr.id = ls.profile_id
      WHERE m.id = meter_readings.meter_id
      AND pr.user_id = auth.uid()
      AND ls.signature_status = 'signed'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meters m
      JOIN leases l ON l.id = m.lease_id
      JOIN lease_signers ls ON ls.lease_id = l.id
      JOIN profiles pr ON pr.id = ls.profile_id
      WHERE m.id = meter_readings.meter_id
      AND pr.user_id = auth.uid()
      AND ls.signature_status = 'signed'
    )
  );

-- Add comment
COMMENT ON TABLE meter_readings IS 'Relevés de compteurs. RLS: admins all, owners via property_id OR lease_id, tenants via signed lease.';
