-- Migration : prise en charge du rôle "guarantor" (garant)

-- 1. Mettre à jour la contrainte CHECK sur profiles.role
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'owner', 'tenant', 'provider', 'guarantor'));

-- 2. Mettre à jour les rôles existants si nécessaire (sécurité : aucun changement si déjà cohérent)
UPDATE profiles
SET role = 'guarantor'
WHERE role = 'guarantor';






