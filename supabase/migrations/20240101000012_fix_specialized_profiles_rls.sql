-- Migration : Correction des politiques RLS pour owner_profiles et tenant_profiles
-- Utiliser public.user_profile_id() et public.user_role() au lieu de auth.*

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view own owner profile" ON owner_profiles;
DROP POLICY IF EXISTS "Users can update own owner profile" ON owner_profiles;
DROP POLICY IF EXISTS "Users can insert own owner profile" ON owner_profiles;
DROP POLICY IF EXISTS "Admins can view all owner profiles" ON owner_profiles;

DROP POLICY IF EXISTS "Users can view own tenant profile" ON tenant_profiles;
DROP POLICY IF EXISTS "Users can update own tenant profile" ON tenant_profiles;
DROP POLICY IF EXISTS "Users can insert own tenant profile" ON tenant_profiles;
DROP POLICY IF EXISTS "Owners can view tenant profiles of their properties" ON tenant_profiles;
DROP POLICY IF EXISTS "Admins can view all tenant profiles" ON tenant_profiles;

DROP POLICY IF EXISTS "Users can view own provider profile" ON provider_profiles;
DROP POLICY IF EXISTS "Users can update own provider profile" ON provider_profiles;
DROP POLICY IF EXISTS "Users can insert own provider profile" ON provider_profiles;
DROP POLICY IF EXISTS "Admins can view all provider profiles" ON provider_profiles;

-- Recréer les politiques pour owner_profiles avec public.user_profile_id()
CREATE POLICY "Users can view own owner profile"
  ON owner_profiles FOR SELECT
  USING (profile_id = public.user_profile_id());

CREATE POLICY "Users can insert own owner profile"
  ON owner_profiles FOR INSERT
  WITH CHECK (profile_id = public.user_profile_id());

CREATE POLICY "Users can update own owner profile"
  ON owner_profiles FOR UPDATE
  USING (profile_id = public.user_profile_id());

CREATE POLICY "Admins can view all owner profiles"
  ON owner_profiles FOR SELECT
  USING (public.user_role() = 'admin');

-- Recréer les politiques pour tenant_profiles avec public.user_profile_id()
CREATE POLICY "Users can view own tenant profile"
  ON tenant_profiles FOR SELECT
  USING (profile_id = public.user_profile_id());

CREATE POLICY "Users can insert own tenant profile"
  ON tenant_profiles FOR INSERT
  WITH CHECK (profile_id = public.user_profile_id());

CREATE POLICY "Users can update own tenant profile"
  ON tenant_profiles FOR UPDATE
  USING (profile_id = public.user_profile_id());

-- Les propriétaires peuvent voir les profils de leurs locataires
CREATE POLICY "Owners can view tenant profiles of their properties"
  ON tenant_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN properties p ON p.id = l.property_id
      WHERE p.owner_id = public.user_profile_id()
      AND EXISTS (
        SELECT 1 FROM lease_signers ls
        WHERE ls.lease_id = l.id
        AND ls.profile_id = tenant_profiles.profile_id
      )
    )
  );

CREATE POLICY "Admins can view all tenant profiles"
  ON tenant_profiles FOR SELECT
  USING (public.user_role() = 'admin');

-- Recréer les politiques pour provider_profiles avec public.user_profile_id()
CREATE POLICY "Users can view own provider profile"
  ON provider_profiles FOR SELECT
  USING (profile_id = public.user_profile_id());

CREATE POLICY "Users can insert own provider profile"
  ON provider_profiles FOR INSERT
  WITH CHECK (profile_id = public.user_profile_id());

CREATE POLICY "Users can update own provider profile"
  ON provider_profiles FOR UPDATE
  USING (profile_id = public.user_profile_id());

CREATE POLICY "Admins can view all provider profiles"
  ON provider_profiles FOR SELECT
  USING (public.user_role() = 'admin');

