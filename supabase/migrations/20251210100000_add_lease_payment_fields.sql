-- Migration: Ajouter les champs de paiement et révision au bail
-- Date: 2025-12-10

-- Champs de modalités de paiement
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS charges_type TEXT DEFAULT 'forfait' CHECK (charges_type IN ('forfait', 'provisions'));

ALTER TABLE leases
ADD COLUMN IF NOT EXISTS mode_paiement TEXT DEFAULT 'virement' CHECK (mode_paiement IN ('virement', 'prelevement', 'cheque', 'especes'));

ALTER TABLE leases
ADD COLUMN IF NOT EXISTS jour_paiement INTEGER DEFAULT 5 CHECK (jour_paiement >= 1 AND jour_paiement <= 28);

-- Champs de révision du loyer
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS revision_autorisee BOOLEAN DEFAULT true;

-- Clauses particulières (texte libre)
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS clauses_particulieres TEXT;

-- Commentaires
COMMENT ON COLUMN leases.charges_type IS 'Type de charges: forfait (montant fixe) ou provisions (régularisation annuelle)';
COMMENT ON COLUMN leases.mode_paiement IS 'Mode de paiement du loyer: virement, prélèvement, chèque, espèces';
COMMENT ON COLUMN leases.jour_paiement IS 'Jour du mois pour le paiement du loyer (1-28)';
COMMENT ON COLUMN leases.revision_autorisee IS 'Si la révision annuelle du loyer est autorisée';
COMMENT ON COLUMN leases.clauses_particulieres IS 'Clauses particulières ajoutées au bail';
