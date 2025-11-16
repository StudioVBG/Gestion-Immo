-- Migration initiale : création du schéma de base
-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour les fonctions JSON
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Table profiles (base pour tous les utilisateurs)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'tenant', 'provider')),
  prenom TEXT,
  nom TEXT,
  telephone TEXT,
  avatar_url TEXT,
  date_naissance DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Table owner_profiles (propriétaires)
CREATE TABLE owner_profiles (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('particulier', 'societe')),
  siret TEXT,
  tva TEXT,
  iban TEXT,
  adresse_facturation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table tenant_profiles (locataires)
CREATE TABLE tenant_profiles (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  situation_pro TEXT,
  revenus_mensuels DECIMAL(10, 2),
  nb_adultes INTEGER NOT NULL DEFAULT 1,
  nb_enfants INTEGER NOT NULL DEFAULT 0,
  garant_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table provider_profiles (prestataires)
CREATE TABLE provider_profiles (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  type_services TEXT[] NOT NULL DEFAULT '{}',
  certifications TEXT,
  zones_intervention TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table properties (logements)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('appartement', 'maison', 'colocation', 'saisonnier')),
  adresse_complete TEXT NOT NULL,
  code_postal TEXT NOT NULL,
  ville TEXT NOT NULL,
  departement TEXT NOT NULL,
  surface DECIMAL(8, 2) NOT NULL,
  nb_pieces INTEGER NOT NULL,
  etage INTEGER,
  ascenseur BOOLEAN NOT NULL DEFAULT false,
  energie TEXT,
  ges TEXT,
  unique_code TEXT NOT NULL UNIQUE, -- Code unique, jamais réattribué
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_unique_code ON properties(unique_code);
CREATE INDEX idx_properties_type ON properties(type);

-- Table units (unités pour colocation)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  capacite_max INTEGER NOT NULL CHECK (capacite_max >= 1 AND capacite_max <= 10),
  surface DECIMAL(8, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_units_property_id ON units(property_id);

-- Table leases (baux)
CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  type_bail TEXT NOT NULL CHECK (type_bail IN ('nu', 'meuble', 'colocation', 'saisonnier')),
  loyer DECIMAL(10, 2) NOT NULL,
  charges_forfaitaires DECIMAL(10, 2) NOT NULL DEFAULT 0,
  depot_de_garantie DECIMAL(10, 2) NOT NULL DEFAULT 0,
  date_debut DATE NOT NULL,
  date_fin DATE,
  statut TEXT NOT NULL DEFAULT 'draft' CHECK (statut IN ('draft', 'pending_signature', 'active', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((property_id IS NOT NULL AND unit_id IS NULL) OR (property_id IS NULL AND unit_id IS NOT NULL))
);

CREATE INDEX idx_leases_property_id ON leases(property_id);
CREATE INDEX idx_leases_unit_id ON leases(unit_id);
CREATE INDEX idx_leases_statut ON leases(statut);

-- Table lease_signers (signataires de baux)
CREATE TABLE lease_signers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('proprietaire', 'locataire_principal', 'colocataire', 'garant')),
  signature_status TEXT NOT NULL DEFAULT 'pending' CHECK (signature_status IN ('pending', 'signed', 'refused')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lease_id, profile_id)
);

CREATE INDEX idx_lease_signers_lease_id ON lease_signers(lease_id);
CREATE INDEX idx_lease_signers_profile_id ON lease_signers(profile_id);

-- Table invoices (factures)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  periode TEXT NOT NULL, -- Format "YYYY-MM"
  montant_total DECIMAL(10, 2) NOT NULL,
  montant_loyer DECIMAL(10, 2) NOT NULL,
  montant_charges DECIMAL(10, 2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'draft' CHECK (statut IN ('draft', 'sent', 'paid', 'late')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lease_id, periode)
);

CREATE INDEX idx_invoices_lease_id ON invoices(lease_id);
CREATE INDEX idx_invoices_owner_id ON invoices(owner_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_statut ON invoices(statut);
CREATE INDEX idx_invoices_periode ON invoices(periode);

-- Table payments (paiements)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  montant DECIMAL(10, 2) NOT NULL,
  moyen TEXT NOT NULL CHECK (moyen IN ('cb', 'virement', 'prelevement')),
  provider_ref TEXT, -- ID paiement Stripe, etc.
  date_paiement DATE,
  statut TEXT NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_statut ON payments(statut);

-- Table charges (charges récurrentes)
CREATE TABLE charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('eau', 'electricite', 'copro', 'taxe', 'ordures', 'assurance', 'autre')),
  montant DECIMAL(10, 2) NOT NULL,
  periodicite TEXT NOT NULL CHECK (periodicite IN ('mensuelle', 'trimestrielle', 'annuelle')),
  refacturable_locataire BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_charges_property_id ON charges(property_id);

-- Table tickets (tickets de maintenance)
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  created_by_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  priorite TEXT NOT NULL DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute')),
  statut TEXT NOT NULL DEFAULT 'open' CHECK (statut IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_property_id ON tickets(property_id);
CREATE INDEX idx_tickets_lease_id ON tickets(lease_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by_profile_id);
CREATE INDEX idx_tickets_statut ON tickets(statut);

-- Table work_orders (ordres de travail pour prestataires)
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date_intervention_prevue DATE,
  date_intervention_reelle DATE,
  cout_estime DECIMAL(10, 2),
  cout_final DECIMAL(10, 2),
  statut TEXT NOT NULL DEFAULT 'assigned' CHECK (statut IN ('assigned', 'scheduled', 'done', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_work_orders_ticket_id ON work_orders(ticket_id);
CREATE INDEX idx_work_orders_provider_id ON work_orders(provider_id);
CREATE INDEX idx_work_orders_statut ON work_orders(statut);

-- Table documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('bail', 'EDL_entree', 'EDL_sortie', 'quittance', 'attestation_assurance', 'attestation_loyer', 'justificatif_revenus', 'piece_identite', 'autre')),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_property_id ON documents(property_id);
CREATE INDEX idx_documents_lease_id ON documents(lease_id);
CREATE INDEX idx_documents_type ON documents(type);

-- Table blog_posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_is_published ON blog_posts(is_published);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_owner_profiles_updated_at BEFORE UPDATE ON owner_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_profiles_updated_at BEFORE UPDATE ON tenant_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON leases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lease_signers_updated_at BEFORE UPDATE ON lease_signers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charges_updated_at BEFORE UPDATE ON charges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer un code unique pour les propriétés
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Génère un code aléatoire de 8 caractères (lettres et chiffres)
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    -- Vérifie si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM properties WHERE unique_code = new_code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

