-- Migration : aligner les statuts des propriétés (published vs approved)

BEGIN;

UPDATE properties
SET etat = 'published'
WHERE etat = 'approved';

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_etat_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_etat_check
  CHECK (
    etat IN ('draft', 'pending', 'published', 'rejected', 'archived')
  );

COMMIT;





