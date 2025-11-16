-- Migration : données logement appartement + pièces/photos
BEGIN;

-- Colonnes complémentaires sur properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS surface_habitable_m2 NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS nb_chambres INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meuble BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chauffage_type TEXT,
  ADD COLUMN IF NOT EXISTS chauffage_energie TEXT,
  ADD COLUMN IF NOT EXISTS eau_chaude_type TEXT,
  ADD COLUMN IF NOT EXISTS clim_presence TEXT,
  ADD COLUMN IF NOT EXISTS clim_type TEXT,
  ADD COLUMN IF NOT EXISTS loyer_hc NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS encadrement_loyers BOOLEAN NOT NULL DEFAULT false;

UPDATE properties
SET loyer_hc = COALESCE(loyer_hc, loyer_base)
WHERE loyer_hc IS NULL;

ALTER TABLE properties
  ALTER COLUMN loyer_hc SET DEFAULT 0,
  ALTER COLUMN loyer_hc SET NOT NULL;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS status TEXT GENERATED ALWAYS AS (
    CASE etat
      WHEN 'draft' THEN 'brouillon'
      WHEN 'pending' THEN 'en_attente'
      WHEN 'published' THEN 'publie'
      WHEN 'rejected' THEN 'rejete'
      WHEN 'archived' THEN 'archive'
      ELSE etat
    END
  ) STORED;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_chauffage_type_check,
  DROP CONSTRAINT IF EXISTS properties_chauffage_energie_check,
  DROP CONSTRAINT IF EXISTS properties_eau_chaude_type_check,
  DROP CONSTRAINT IF EXISTS properties_clim_presence_check,
  DROP CONSTRAINT IF EXISTS properties_clim_type_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_chauffage_type_check
    CHECK (chauffage_type IS NULL OR chauffage_type IN ('individuel','collectif','aucun')),
  ADD CONSTRAINT properties_chauffage_energie_check
    CHECK (chauffage_energie IS NULL OR chauffage_energie IN ('electricite','gaz','fioul','bois','reseau_urbain','autre')),
  ADD CONSTRAINT properties_eau_chaude_type_check
    CHECK (eau_chaude_type IS NULL OR eau_chaude_type IN ('electrique_indiv','gaz_indiv','collectif','solaire','autre')),
  ADD CONSTRAINT properties_clim_presence_check
    CHECK (clim_presence IS NULL OR clim_presence IN ('aucune','fixe','mobile')),
  ADD CONSTRAINT properties_clim_type_check
    CHECK (clim_type IS NULL OR clim_type IN ('split','gainable'));

-- Table rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type_piece TEXT NOT NULL,
  label_affiche TEXT NOT NULL,
  surface_m2 NUMERIC(8,2),
  chauffage_present BOOLEAN NOT NULL DEFAULT true,
  chauffage_type_emetteur TEXT,
  clim_presente BOOLEAN NOT NULL DEFAULT false,
  ordre INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rooms
  DROP CONSTRAINT IF EXISTS rooms_type_piece_check,
  DROP CONSTRAINT IF EXISTS rooms_chauffage_type_emetteur_check;

ALTER TABLE rooms
  ADD CONSTRAINT rooms_type_piece_check
    CHECK (type_piece IN ('sejour','chambre','cuisine','salle_de_bain','wc','entree','couloir','balcon','terrasse','cave','autre')),
  ADD CONSTRAINT rooms_chauffage_type_emetteur_check
    CHECK (
      chauffage_type_emetteur IS NULL
      OR chauffage_type_emetteur IN ('radiateur','plancher','convecteur','poele')
    );

CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);

-- Table photos
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  url TEXT,
  storage_path TEXT,
  is_main BOOLEAN NOT NULL DEFAULT false,
  tag TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE photos
  DROP CONSTRAINT IF EXISTS photos_tag_check;

ALTER TABLE photos
  ADD CONSTRAINT photos_tag_check
    CHECK (tag IS NULL OR tag IN ('vue_generale','plan','detail','exterieur'));

CREATE INDEX IF NOT EXISTS idx_photos_property_id ON photos(property_id);
CREATE INDEX IF NOT EXISTS idx_photos_room_id ON photos(room_id);

-- RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rooms of accessible properties"
  ON rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = rooms.property_id
      AND (
        p.owner_id = public.user_profile_id()
        OR public.user_role() = 'admin'
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

CREATE POLICY "Owners can manage rooms"
  ON rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = rooms.property_id
      AND p.owner_id = public.user_profile_id()
    )
    OR public.user_role() = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = rooms.property_id
      AND p.owner_id = public.user_profile_id()
    )
    OR public.user_role() = 'admin'
  );

CREATE POLICY "Users can view photos of accessible properties"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = photos.property_id
      AND (
        p.owner_id = public.user_profile_id()
        OR public.user_role() = 'admin'
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

CREATE POLICY "Owners can manage photos"
  ON photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = photos.property_id
      AND p.owner_id = public.user_profile_id()
    )
    OR public.user_role() = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = photos.property_id
      AND p.owner_id = public.user_profile_id()
    )
    OR public.user_role() = 'admin'
  );

-- Bucket pour les photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
