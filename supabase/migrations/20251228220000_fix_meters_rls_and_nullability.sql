-- Migration : Rendre lease_id nullable dans meters et ajouter RLS propriétaire
-- Date : 2025-12-28

BEGIN;

-- 1. Rendre lease_id nullable
ALTER TABLE public.meters 
  ALTER COLUMN lease_id DROP NOT NULL;

-- 2. Supprimer les anciennes politiques RLS restrictives (si elles existent)
DROP POLICY IF EXISTS "Meters lease members select" ON public.meters;
DROP POLICY IF EXISTS "Owners can manage meters of own properties" ON public.meters;

-- 3. Nouvelles politiques RLS pour les compteurs (Meters)

-- Les propriétaires peuvent TOUT faire sur les compteurs de leurs logements
CREATE POLICY "Owners can manage meters of own properties"
  ON public.meters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = public.meters.property_id
      AND p.owner_id = public.user_profile_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = public.meters.property_id
      AND p.owner_id = public.user_profile_id()
    )
  );

-- Les locataires peuvent VOIR les compteurs liés à leur bail
CREATE POLICY "Tenants can view meters of own lease"
  ON public.meters FOR SELECT
  USING (
    lease_id IN (
      SELECT ls.lease_id 
      FROM public.lease_signers ls
      WHERE ls.profile_id = public.user_profile_id()
    )
  );

-- Les admins peuvent TOUT voir
CREATE POLICY "Admins can view all meters"
  ON public.meters FOR SELECT
  USING (public.user_role() = 'admin');

-- 4. Même logique pour les relevés (meter_readings)

ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Meter readings accessible" ON public.meter_readings;
DROP POLICY IF EXISTS "Meter readings tenant create" ON public.meter_readings;

-- Les propriétaires peuvent TOUT faire sur les relevés des compteurs de leurs logements
CREATE POLICY "Owners can manage readings of own property meters"
  ON public.meter_readings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meters m
      JOIN public.properties p ON p.id = m.property_id
      WHERE m.id = public.meter_readings.meter_id
      AND p.owner_id = public.user_profile_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meters m
      JOIN public.properties p ON p.id = m.property_id
      WHERE m.id = public.meter_readings.meter_id
      AND p.owner_id = public.user_profile_id()
    )
  );

-- Les locataires peuvent VOIR et CRÉER des relevés pour leurs compteurs
CREATE POLICY "Tenants can manage readings of own lease meters"
  ON public.meter_readings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meters m
      WHERE m.id = public.meter_readings.meter_id
      AND m.lease_id IN (
        SELECT ls.lease_id 
        FROM public.lease_signers ls
        WHERE ls.profile_id = public.user_profile_id()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meters m
      WHERE m.id = public.meter_readings.meter_id
      AND m.lease_id IN (
        SELECT ls.lease_id 
        FROM public.lease_signers ls
        WHERE ls.profile_id = public.user_profile_id()
      )
    )
  );

COMMIT;

