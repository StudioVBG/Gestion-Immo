-- Migration : Correction de la récursion infinie dans les politiques RLS pour leases
-- Le problème : Les politiques RLS se vérifient mutuellement lors des requêtes imbriquées
-- Solution : Simplifier les politiques pour éviter les vérifications circulaires

-- Supprimer la politique problématique qui cause la récursion
DROP POLICY IF EXISTS "Users can view signers of accessible leases" ON lease_signers;

-- Recréer la politique avec une approche simplifiée pour éviter la récursion
-- Pour les admins, on bypass complètement la vérification
CREATE POLICY "Users can view signers of accessible leases"
  ON lease_signers FOR SELECT
  USING (
    -- Les admins peuvent tout voir (vérifié en premier pour éviter la récursion)
    public.user_role() = 'admin'
    OR
    -- L'utilisateur est signataire du bail
    profile_id = public.user_profile_id()
    OR
    -- Le bail appartient à une propriété du propriétaire (vérification simplifiée)
    EXISTS (
      SELECT 1 FROM leases l
      WHERE l.id = lease_signers.lease_id
      AND EXISTS (
        SELECT 1 FROM properties p
        WHERE p.id = l.property_id
        AND p.owner_id = public.user_profile_id()
      )
    )
  );






