-- Migration : Modèle de données Property V3
-- Source : Modèle détaillé fourni par l'utilisateur
-- Basé sur les migrations existantes :
--   - 202411140100_expand_commercial_capabilities.sql (types de biens, usage_principal)
--   - 202411140210_property_workflow_status.sql (etat/status)
--   - 202502141000_property_rooms_photos.sql (rooms, photos, chauffage/clim)
--   - 202411140500_parking_details.sql (parking_details JSONB - conservé pour compatibilité)

BEGIN;

-- ============================================
-- 1. MISE À JOUR DES TYPES DE BIENS
-- ============================================
-- Source modèle V3 : ajout de "studio" et "box" (distinct de "parking")
-- Source existante : 202411140100_expand_commercial_capabilities.sql (ligne 22-39)
-- Note : Conservation de "saisonnier" pour rétrocompatibilité, peut être déprécié plus tard

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_type_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_type_check
  CHECK (
    type IN (
      'appartement',
      'maison',
      'studio',              -- Nouveau (modèle V3)
      'colocation',
      'saisonnier',          -- Conservé pour rétrocompatibilité
      'parking',
      'box',                 -- Nouveau (modèle V3) - distinct de parking
      'local_commercial',
      'bureaux',
      'entrepot',
      'fonds_de_commerce'
    )
  );

-- ============================================
-- 2. HARMONISATION STATUS/ETAT
-- ============================================
-- Source modèle V3 : status avec valeurs 'draft', 'pending_review', 'published', 'rejected'
-- Source existante : 202411140210_property_workflow_status.sql (ligne 6-26)
-- Décision : Mettre à jour les valeurs 'pending' -> 'pending_review' pour correspondre au modèle V3

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_etat_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_etat_check
  CHECK (
    etat IN (
      'draft',
      'pending_review',      -- Renommé depuis 'pending' (modèle V3)
      'published',
      'rejected',
      'archived'             -- Conservé pour historique
    )
  );

-- Migration des valeurs existantes
UPDATE properties
SET etat = 'pending_review'
WHERE etat = 'pending';

-- ============================================
-- 3. COLONNES ADRESSE COMPLÉMENTAIRES
-- ============================================
-- Source modèle V3 : complement_adresse pour détails (ex: "Bâtiment B, 3e étage")
-- Source existante : 20240101000000_initial_schema.sql (adresse_complete, code_postal, ville, departement)

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS complement_adresse TEXT;

-- ============================================
-- 4. COLONNES EXTÉRIEURS (HABITATION)
-- ============================================
-- Source modèle V3 : has_balcon, has_terrasse, has_jardin, has_cave
-- Source existante : rooms.type_piece inclut 'balcon', 'terrasse' (202502141000_property_rooms_photos.sql ligne 79)
-- Décision : Ajouter des booléens sur properties pour faciliter les filtres/search

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS has_balcon BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_terrasse BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_jardin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_cave BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 5. ÉQUIPEMENTS (ARRAY)
-- ============================================
-- Source modèle V3 : equipments TEXT[] avec codes standardisés
-- Source existante : Aucune colonne équipements actuellement
-- Décision : Utiliser un array TEXT[] pour flexibilité et performances (index GIN)

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS equipments TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_properties_equipments ON properties USING GIN(equipments);

-- ============================================
-- 6. PARKING / BOX - COLONNES STRUCTURÉES
-- ============================================
-- Source modèle V3 : parking_type, parking_numero, parking_niveau, parking_gabarit, parking_acces[], sécurité
-- Source existante : 202411140500_parking_details.sql (parking_details JSONB)
-- Décision : Ajouter colonnes structurées tout en conservant parking_details JSONB pour rétrocompatibilité
-- Les nouvelles colonnes permettent des requêtes SQL directes sans parsing JSON

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS parking_type TEXT,
  ADD COLUMN IF NOT EXISTS parking_numero TEXT,
  ADD COLUMN IF NOT EXISTS parking_niveau TEXT,
  ADD COLUMN IF NOT EXISTS parking_gabarit TEXT,
  ADD COLUMN IF NOT EXISTS parking_acces TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parking_portail_securise BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking_video_surveillance BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking_gardien BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE properties
  ADD CONSTRAINT properties_parking_type_check
  CHECK (
    parking_type IS NULL
    OR parking_type IN ('place_exterieure', 'place_couverte', 'box', 'souterrain')
  );

ALTER TABLE properties
  ADD CONSTRAINT properties_parking_gabarit_check
  CHECK (
    parking_gabarit IS NULL
    OR parking_gabarit IN ('citadine', 'berline', 'suv', 'utilitaire', '2_roues')
  );

CREATE INDEX IF NOT EXISTS idx_properties_parking_acces ON properties USING GIN(parking_acces);
CREATE INDEX IF NOT EXISTS idx_properties_parking_type ON properties(parking_type);

-- ============================================
-- 7. LOCAUX PRO / BUREAUX / ENTREPÔT / FONDS
-- ============================================
-- Source modèle V3 : local_surface_totale, local_type, vitrine, PMR, équipements pro
-- Source existante : 202411140100_expand_commercial_capabilities.sql (usage_principal, sous_usage, erp_*)
-- Décision : Ajouter colonnes spécifiques aux locaux pro pour compléter le modèle existant

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS local_surface_totale NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS local_type TEXT,
  ADD COLUMN IF NOT EXISTS local_has_vitrine BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_access_pmr BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_clim BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_fibre BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_alarme BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_rideau_metal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_acces_camion BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_parking_clients BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE properties
  ADD CONSTRAINT properties_local_type_check
  CHECK (
    local_type IS NULL
    OR local_type IN ('boutique', 'restaurant', 'bureaux', 'atelier', 'stockage', 'autre')
  );

CREATE INDEX IF NOT EXISTS idx_properties_local_type ON properties(local_type);

-- ============================================
-- 8. CONDITIONS DE LOCATION
-- ============================================
-- Source modèle V3 : type_bail, preavis_mois
-- Source existante : leases.type_bail existe (202411140100_expand_commercial_capabilities.sql ligne 132-146)
-- Décision : Ajouter type_bail et preavis_mois sur properties pour définir les conditions avant création du bail

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS type_bail TEXT,
  ADD COLUMN IF NOT EXISTS preavis_mois INTEGER;

ALTER TABLE properties
  ADD CONSTRAINT properties_type_bail_check
  CHECK (
    type_bail IS NULL
    OR type_bail IN (
      -- Habitation
      'vide',
      'meuble',
      'colocation',
      -- Parking
      'parking_seul',
      'accessoire_logement',
      -- Pro
      '3_6_9',
      'derogatoire',
      'precaire',
      'professionnel',
      'autre'
    )
  );

CREATE INDEX IF NOT EXISTS idx_properties_type_bail ON properties(type_bail);

-- ============================================
-- 9. AMÉLIORATION TABLE ROOMS
-- ============================================
-- Source modèle V3 : type_piece avec 'jardin' ajouté
-- Source existante : 202502141000_property_rooms_photos.sql (ligne 78-79)
-- Décision : Ajouter 'jardin' dans la contrainte CHECK existante

ALTER TABLE rooms
  DROP CONSTRAINT IF EXISTS rooms_type_piece_check;

ALTER TABLE rooms
  ADD CONSTRAINT rooms_type_piece_check
  CHECK (
    type_piece IN (
      'sejour',
      'chambre',
      'cuisine',
      'salle_de_bain',
      'wc',
      'entree',
      'couloir',
      'balcon',
      'terrasse',
      'jardin',              -- Ajouté (modèle V3)
      'autre'
    )
  );

-- ============================================
-- 10. AMÉLIORATION TABLE PHOTOS
-- ============================================
-- Source modèle V3 : tag étendu pour parking/local ('emplacement', 'acces', 'façade', 'interieur', etc.)
-- Source existante : 202502141000_property_rooms_photos.sql (ligne 105-107) avec tags limités
-- Décision : Étendre la contrainte CHECK pour inclure les nouveaux tags

ALTER TABLE photos
  DROP CONSTRAINT IF EXISTS photos_tag_check;

ALTER TABLE photos
  ADD CONSTRAINT photos_tag_check
  CHECK (
    tag IS NULL
    OR tag IN (
      -- Habitation
      'vue_generale',
      'plan',
      'detail',
      'exterieur',
      -- Parking
      'emplacement',
      'acces',
      'vue_generale',
      -- Local pro
      'façade',
      'interieur',
      'vitrine',
      'acces',
      'autre'
    )
  );

-- Note : 'vue_generale' apparaît deux fois dans les listes ci-dessus, c'est normal car utilisé pour habitation ET parking

COMMIT;

