-- Migration : Fonctions utilitaires et triggers

-- Fonction pour créer automatiquement un profil lors de la création d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, 'tenant'); -- Par défaut, rôle tenant
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer un profil automatiquement
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour calculer le montant total d'une facture
CREATE OR REPLACE FUNCTION calculate_invoice_total(
  p_loyer DECIMAL,
  p_charges DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(p_loyer, 0) + COALESCE(p_charges, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour vérifier si un bail peut être activé (tous les signataires ont signé)
CREATE OR REPLACE FUNCTION can_activate_lease(p_lease_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_signers INTEGER;
  signed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_signers
  FROM lease_signers
  WHERE lease_id = p_lease_id;

  SELECT COUNT(*) INTO signed_count
  FROM lease_signers
  WHERE lease_id = p_lease_id
  AND signature_status = 'signed';

  RETURN total_signers > 0 AND signed_count = total_signers;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer automatiquement le montant_total lors de la création/mise à jour d'une facture
CREATE OR REPLACE FUNCTION set_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_total := calculate_invoice_total(NEW.montant_loyer, NEW.montant_charges);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_total_trigger
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_invoice_total();

-- Fonction pour mettre à jour le statut d'une facture en fonction des paiements
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total DECIMAL;
  paid_total DECIMAL;
  invoice_record RECORD;
BEGIN
  -- Récupère les informations de la facture
  SELECT montant_total, statut INTO invoice_record
  FROM invoices
  WHERE id = NEW.invoice_id;

  -- Calcule le total payé
  SELECT COALESCE(SUM(montant), 0) INTO paid_total
  FROM payments
  WHERE invoice_id = NEW.invoice_id
  AND statut = 'succeeded';

  invoice_total := invoice_record.montant_total;

  -- Met à jour le statut de la facture
  IF paid_total >= invoice_total THEN
    UPDATE invoices
    SET statut = 'paid'
    WHERE id = NEW.invoice_id;
  ELSIF paid_total > 0 THEN
    UPDATE invoices
    SET statut = 'sent'
    WHERE id = NEW.invoice_id AND statut = 'draft';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_status_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.statut = 'succeeded')
  EXECUTE FUNCTION update_invoice_status();

-- Fonction pour vérifier qu'un logement a soit property_id soit unit_id, mais pas les deux
CREATE OR REPLACE FUNCTION validate_lease_property_or_unit()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.property_id IS NULL AND NEW.unit_id IS NULL) THEN
    RAISE EXCEPTION 'Un bail doit être lié à une propriété ou une unité';
  END IF;
  IF (NEW.property_id IS NOT NULL AND NEW.unit_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Un bail ne peut pas être lié à la fois à une propriété et une unité';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_lease_property_or_unit_trigger
  BEFORE INSERT OR UPDATE ON leases
  FOR EACH ROW EXECUTE FUNCTION validate_lease_property_or_unit();

-- Fonction pour générer automatiquement un code unique lors de la création d'une propriété
CREATE OR REPLACE FUNCTION set_property_unique_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unique_code IS NULL OR NEW.unique_code = '' THEN
    NEW.unique_code := generate_unique_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_property_unique_code_trigger
  BEFORE INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION set_property_unique_code();

