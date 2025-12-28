-- =====================================================
-- Migration: Table de restitution des dépôts de garantie
-- Date: 2024-12-21
-- =====================================================

BEGIN;

-- Table des restitutions de dépôt
CREATE TABLE IF NOT EXISTS deposit_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    
    -- Montants
    total_deposit DECIMAL(10,2) NOT NULL,
    total_deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    refund_amount DECIMAL(10,2) NOT NULL,
    
    -- Détail des retenues
    deductions JSONB DEFAULT '[]'::jsonb,
    -- Format: [{ "type": "loyers_impayes", "label": "Loyers impayés", "amount": 500 }]
    
    -- Mode de remboursement
    refund_method VARCHAR(50) DEFAULT 'virement', -- 'virement' | 'cheque' | 'especes'
    iban VARCHAR(50),
    
    -- Statut
    status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'completed' | 'cancelled'
    
    -- Dates
    refund_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_lease_id ON deposit_refunds(lease_id);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_status ON deposit_refunds(status);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at_deposit_refunds ON deposit_refunds;
CREATE TRIGGER set_updated_at_deposit_refunds
    BEFORE UPDATE ON deposit_refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE deposit_refunds ENABLE ROW LEVEL SECURITY;

-- Politique: Le propriétaire peut voir/créer ses remboursements
CREATE POLICY "Owner can manage deposit_refunds" ON deposit_refunds
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM leases l
            JOIN properties p ON l.property_id = p.id
            WHERE l.id = deposit_refunds.lease_id
            AND p.owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- Politique: Le locataire peut voir ses remboursements
CREATE POLICY "Tenant can view their deposit_refunds" ON deposit_refunds
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lease_signers ls
            WHERE ls.lease_id = deposit_refunds.lease_id
            AND ls.role IN ('locataire_principal', 'colocataire')
            AND ls.profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- Politique: Admin peut tout voir
CREATE POLICY "Admin can manage all deposit_refunds" ON deposit_refunds
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- Table des indexations IRL (si elle n'existe pas)
-- =====================================================

CREATE TABLE IF NOT EXISTS lease_indexations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    
    -- Valeurs de loyer
    old_rent DECIMAL(10,2) NOT NULL,
    new_rent DECIMAL(10,2) NOT NULL,
    increase_amount DECIMAL(10,2) NOT NULL,
    increase_percent DECIMAL(5,2) NOT NULL,
    
    -- Valeurs IRL
    old_irl_quarter VARCHAR(10) NOT NULL, -- Ex: "2023-Q4"
    old_irl_value DECIMAL(8,2) NOT NULL,
    new_irl_quarter VARCHAR(10) NOT NULL, -- Ex: "2024-Q4"
    new_irl_value DECIMAL(8,2) NOT NULL,
    
    -- Dates
    effective_date DATE NOT NULL,
    applied_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    
    -- Statut
    status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'applied' | 'declined'
    decline_reason TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_lease_indexations_lease_id ON lease_indexations(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_indexations_status ON lease_indexations(status);
CREATE INDEX IF NOT EXISTS idx_lease_indexations_effective_date ON lease_indexations(effective_date);

-- RLS
ALTER TABLE lease_indexations ENABLE ROW LEVEL SECURITY;

-- Politique: Le propriétaire peut gérer les indexations
CREATE POLICY "Owner can manage lease_indexations" ON lease_indexations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM leases l
            JOIN properties p ON l.property_id = p.id
            WHERE l.id = lease_indexations.lease_id
            AND p.owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- Politique: Le locataire peut voir les indexations
CREATE POLICY "Tenant can view their lease_indexations" ON lease_indexations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lease_signers ls
            WHERE ls.lease_id = lease_indexations.lease_id
            AND ls.role IN ('locataire_principal', 'colocataire')
            AND ls.profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- Politique: Admin peut tout voir
CREATE POLICY "Admin can manage all lease_indexations" ON lease_indexations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

COMMIT;

