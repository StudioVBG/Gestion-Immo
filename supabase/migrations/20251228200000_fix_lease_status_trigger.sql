-- Migration : Mise à jour automatique du statut du bail lors des signatures
-- Assure que le statut passe à 'partially_signed' ou 'fully_signed' dès qu'une signature est apposée

CREATE OR REPLACE FUNCTION update_lease_status_on_signature()
RETURNS TRIGGER AS $$
DECLARE
    total_signers INTEGER;
    signed_count INTEGER;
    new_status TEXT;
BEGIN
    -- Si le statut de signature passe à 'signed'
    IF (NEW.signature_status = 'signed' AND (OLD.signature_status IS NULL OR OLD.signature_status != 'signed')) THEN
        -- 1. Compter les signataires
        SELECT COUNT(*) INTO total_signers
        FROM lease_signers
        WHERE lease_id = NEW.lease_id;

        SELECT COUNT(*) INTO signed_count
        FROM lease_signers
        WHERE lease_id = NEW.lease_id
        AND signature_status = 'signed';

        -- 2. Déterminer le nouveau statut
        IF signed_count = total_signers AND total_signers > 0 THEN
            new_status := 'fully_signed';
        ELSIF signed_count > 0 THEN
            -- Vérifier si le propriétaire a signé
            IF EXISTS (
                SELECT 1 FROM lease_signers 
                WHERE lease_id = NEW.lease_id 
                AND role = 'proprietaire' 
                AND signature_status = 'signed'
            ) THEN
                new_status := 'partially_signed';
            ELSE
                -- Si seul le locataire a signé, on peut optionnellement passer à un état spécifique
                -- mais partially_signed convient
                new_status := 'partially_signed';
            END IF;
        ELSE
            new_status := 'pending_signature';
        END IF;

        -- 3. Mettre à jour le bail
        UPDATE leases 
        SET statut = new_status,
            updated_at = NOW()
        WHERE id = NEW.lease_id 
        AND statut IN ('draft', 'sent', 'pending_signature', 'partially_signed', 'pending_owner_signature')
        AND statut != new_status;
        
        -- 4. Si fully_signed, on peut aussi déclencher le scellement via un webhook ou une edge function
        -- (géré côté application pour l'instant)
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur lease_signers
DROP TRIGGER IF EXISTS on_lease_signer_updated_status ON lease_signers;
CREATE TRIGGER on_lease_signer_updated_status
    AFTER UPDATE ON lease_signers
    FOR EACH ROW
    EXECUTE FUNCTION update_lease_status_on_signature();

-- Commentaire pour documentation
COMMENT ON FUNCTION update_lease_status_on_signature() IS 'Met à jour automatiquement le statut du bail (leases.statut) en fonction des signatures récoltées.';

