-- Migration : Row Level Security (RLS) policies
-- Active RLS sur toutes les tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour obtenir le profile_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Fonction helper pour obtenir le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- POLICIES POUR PROFILES
-- ============================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.user_role() = 'admin');

-- ============================================
-- POLICIES POUR OWNER_PROFILES
-- ============================================

CREATE POLICY "Users can view own owner profile"
  ON owner_profiles FOR SELECT
  USING (profile_id = public.user_profile_id());

CREATE POLICY "Users can update own owner profile"
  ON owner_profiles FOR UPDATE
  USING (profile_id = public.user_profile_id());

CREATE POLICY "Admins can view all owner profiles"
  ON owner_profiles FOR SELECT
  USING (public.user_role() = 'admin');

-- ============================================
-- POLICIES POUR TENANT_PROFILES
-- ============================================

CREATE POLICY "Users can view own tenant profile"
  ON tenant_profiles FOR SELECT
  USING (profile_id = public.user_profile_id());

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

-- ============================================
-- POLICIES POUR PROVIDER_PROFILES
-- ============================================

CREATE POLICY "Users can view own provider profile"
  ON provider_profiles FOR SELECT
  USING (profile_id = public.user_profile_id());

CREATE POLICY "Users can update own provider profile"
  ON provider_profiles FOR UPDATE
  USING (profile_id = public.user_profile_id());

CREATE POLICY "Admins can view all provider profiles"
  ON provider_profiles FOR SELECT
  USING (public.user_role() = 'admin');

-- ============================================
-- POLICIES POUR PROPERTIES
-- ============================================

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

-- ============================================
-- POLICIES POUR UNITS
-- ============================================

CREATE POLICY "Users can view units of accessible properties"
  ON units FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = units.property_id
      AND (
        p.owner_id = public.user_profile_id()
        OR EXISTS (
          SELECT 1 FROM leases l
          JOIN lease_signers ls ON ls.lease_id = l.id
          WHERE l.property_id = p.id
          AND ls.profile_id = public.user_profile_id()
          AND l.statut = 'active'
        )
        OR public.user_role() = 'admin'
      )
    )
  );

CREATE POLICY "Owners can manage units of own properties"
  ON units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = units.property_id
      AND p.owner_id = public.user_profile_id()
    )
  );

-- ============================================
-- POLICIES POUR LEASES
-- ============================================

-- Les propriétaires peuvent voir les baux de leurs logements
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
  );

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

CREATE POLICY "Admins can view all leases"
  ON leases FOR SELECT
  USING (public.user_role() = 'admin');

-- ============================================
-- POLICIES POUR LEASE_SIGNERS
-- ============================================

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

CREATE POLICY "Users can update own signature"
  ON lease_signers FOR UPDATE
  USING (profile_id = public.user_profile_id())
  WITH CHECK (profile_id = public.user_profile_id());

-- ============================================
-- POLICIES POUR INVOICES
-- ============================================

CREATE POLICY "Owners can view invoices of own properties"
  ON invoices FOR SELECT
  USING (owner_id = public.user_profile_id());

CREATE POLICY "Tenants can view own invoices"
  ON invoices FOR SELECT
  USING (tenant_id = public.user_profile_id());

CREATE POLICY "Owners can create invoices for own properties"
  ON invoices FOR INSERT
  WITH CHECK (owner_id = public.user_profile_id());

CREATE POLICY "Owners can update invoices of own properties"
  ON invoices FOR UPDATE
  USING (owner_id = public.user_profile_id());

CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  USING (public.user_role() = 'admin');

-- ============================================
-- POLICIES POUR PAYMENTS
-- ============================================

CREATE POLICY "Users can view payments of accessible invoices"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = payments.invoice_id
      AND (
        i.owner_id = public.user_profile_id()
        OR i.tenant_id = public.user_profile_id()
        OR public.user_role() = 'admin'
      )
    )
  );

CREATE POLICY "Tenants can create payments for own invoices"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = payments.invoice_id
      AND i.tenant_id = public.user_profile_id()
    )
  );

-- ============================================
-- POLICIES POUR CHARGES
-- ============================================

CREATE POLICY "Owners can manage charges of own properties"
  ON charges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = charges.property_id
      AND p.owner_id = public.user_profile_id()
    )
  );

CREATE POLICY "Tenants can view charges of properties with active leases"
  ON charges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      JOIN leases l ON l.property_id = p.id
      JOIN lease_signers ls ON ls.lease_id = l.id
      WHERE p.id = charges.property_id
      AND ls.profile_id = public.user_profile_id()
      AND l.statut = 'active'
    )
  );

-- ============================================
-- POLICIES POUR TICKETS
-- ============================================

CREATE POLICY "Users can view tickets of accessible properties"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = tickets.property_id
      AND (
        p.owner_id = public.user_profile_id()
        OR EXISTS (
          SELECT 1 FROM leases l
          JOIN lease_signers ls ON ls.lease_id = l.id
          WHERE l.property_id = p.id
          AND ls.profile_id = public.user_profile_id()
          AND l.statut = 'active'
        )
        OR tickets.created_by_profile_id = public.user_profile_id()
        OR public.user_role() = 'admin'
      )
    )
  );

CREATE POLICY "Users can create tickets for accessible properties"
  ON tickets FOR INSERT
  WITH CHECK (
    created_by_profile_id = public.user_profile_id()
    AND EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = tickets.property_id
      AND (
        p.owner_id = public.user_profile_id()
        OR EXISTS (
          SELECT 1 FROM leases l
          JOIN lease_signers ls ON ls.lease_id = l.id
          WHERE l.property_id = p.id
          AND ls.profile_id = public.user_profile_id()
          AND l.statut = 'active'
        )
      )
    )
  );

CREATE POLICY "Owners can update tickets of own properties"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = tickets.property_id
      AND p.owner_id = public.user_profile_id()
    )
  );

-- ============================================
-- POLICIES POUR WORK_ORDERS
-- ============================================

CREATE POLICY "Providers can view own work orders"
  ON work_orders FOR SELECT
  USING (provider_id = public.user_profile_id());

CREATE POLICY "Owners can view work orders of own properties"
  ON work_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN properties p ON p.id = t.property_id
      WHERE t.id = work_orders.ticket_id
      AND p.owner_id = public.user_profile_id()
    )
  );

CREATE POLICY "Providers can update own work orders"
  ON work_orders FOR UPDATE
  USING (provider_id = public.user_profile_id());

-- ============================================
-- POLICIES POUR DOCUMENTS
-- ============================================

CREATE POLICY "Users can view accessible documents"
  ON documents FOR SELECT
  USING (
    owner_id = public.user_profile_id()
    OR tenant_id = public.user_profile_id()
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = documents.property_id
      AND (
        p.owner_id = public.user_profile_id()
        OR EXISTS (
          SELECT 1 FROM leases l
          JOIN lease_signers ls ON ls.lease_id = l.id
          WHERE l.property_id = p.id
          AND ls.profile_id = public.user_profile_id()
        )
      )
    )
    OR public.user_role() = 'admin'
  );

CREATE POLICY "Owners can create documents for own properties"
  ON documents FOR INSERT
  WITH CHECK (
    owner_id = public.user_profile_id()
    OR (
      property_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM properties p
        WHERE p.id = documents.property_id
        AND p.owner_id = public.user_profile_id()
      )
    )
  );

-- ============================================
-- POLICIES POUR BLOG_POSTS
-- ============================================

-- Tout le monde peut voir les articles publiés
CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts FOR SELECT
  USING (is_published = true);

-- Les admins peuvent tout voir et gérer
CREATE POLICY "Admins can manage all blog posts"
  ON blog_posts FOR ALL
  USING (public.user_role() = 'admin');

