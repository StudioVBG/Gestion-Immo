-- Migration : Ajouter le statut 'paused' aux tickets

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_statut_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_statut_check 
  CHECK (statut IN ('open', 'in_progress', 'paused', 'resolved', 'closed'));





