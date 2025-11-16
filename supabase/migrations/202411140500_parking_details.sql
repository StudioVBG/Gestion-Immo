-- Ajout des détails dédiés aux biens de type parking
alter table public.properties
  add column if not exists parking_details jsonb;

create index if not exists idx_properties_parking_details
  on public.properties
  using gin (parking_details);

