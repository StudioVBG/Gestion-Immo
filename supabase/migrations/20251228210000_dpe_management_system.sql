-- 1) Enums pour le cycle de vie de la demande DPE
do $$ begin
  create type public.dpe_request_status as enum (
    'REQUESTED',      -- demande envoyée (ou créée)
    'QUOTE_RECEIVED', -- devis reçu
    'SCHEDULED',      -- rdv planifié
    'DONE',           -- visite réalisée
    'DELIVERED',      -- rapport reçu (pdf + n°)
    'CANCELLED'
  );
exception when duplicate_object then null; end $$;

-- 2) Diagnostiqueurs "internes" (mini annuaire par propriétaire)
create table if not exists public.dpe_providers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  coverage text,          -- ex: "Martinique - Nord / CACEM"
  is_active boolean not null default true,
  notes text
);

create index if not exists dpe_providers_owner_id_idx on public.dpe_providers(owner_id);

-- 3) Demandes DPE
create table if not exists public.dpe_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  status public.dpe_request_status not null default 'REQUESTED',

  visit_contact_name text,
  visit_contact_role text default 'OWNER', -- 'OWNER'|'TENANT'|'OTHER'
  visit_contact_email text,
  visit_contact_phone text,

  access_notes text,
  preferred_slots jsonb,    -- [{start, end}, ...]
  attachments jsonb,        -- [{path, name}]
  notes text
);

create index if not exists dpe_requests_owner_id_idx on public.dpe_requests(owner_id);
create index if not exists dpe_requests_property_id_idx on public.dpe_requests(property_id);

-- 4) Devis liés aux demandes
create table if not exists public.dpe_quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null references public.dpe_requests(id) on delete cascade,
  provider_id uuid references public.dpe_providers(id) on delete set null,
  price_cents integer,
  currency text default 'EUR',
  proposed_date timestamptz,
  message text,
  is_accepted boolean not null default false
);

create index if not exists dpe_quotes_request_id_idx on public.dpe_quotes(request_id);

-- 5) Livrable DPE (document officiel stocké avec métadonnées)
create table if not exists public.dpe_deliverables (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  request_id uuid references public.dpe_requests(id) on delete set null,

  dpe_number text not null,        -- 13 chiffres ADEME
  issued_at date not null,
  energy_class text not null,      -- A-G
  ges_class text,                  -- A-G
  valid_until date not null,

  pdf_path text not null,          -- storage path
  source text default 'UPLOAD'     -- 'UPLOAD'|'API_PREFILL'
);

create index if not exists dpe_deliverables_property_id_idx on public.dpe_deliverables(property_id);

-- 6) Contraintes métier
alter table public.dpe_deliverables
  add constraint dpe_number_13_digits_chk
  check (dpe_number ~ '^[0-9]{13}$');

alter table public.dpe_deliverables
  add constraint energy_class_chk
  check (energy_class in ('A','B','C','D','E','F','G'));

alter table public.dpe_deliverables
  add constraint ges_class_chk
  check (ges_class is null or ges_class in ('A','B','C','D','E','F','G'));

-- 7) Fonction de calcul de validité (Source de vérité)
create or replace function public.compute_dpe_valid_until(p_issued_at date)
returns date
language plpgsql
as $$
begin
  -- Réforme DPE 2021 : période transitoire
  if p_issued_at >= date '2021-07-01' then
    return (p_issued_at + interval '10 years')::date;
  elsif p_issued_at between date '2018-01-01' and date '2021-06-30' then
    return date '2024-12-31';
  elsif p_issued_at between date '2013-01-01' and date '2017-12-31' then
    return date '2022-12-31';
  else
    return p_issued_at; -- considéré expiré car déjà passé
  end if;
end $$;

-- 8) Row Level Security (RLS)
alter table public.dpe_providers enable row level security;
alter table public.dpe_requests enable row level security;
alter table public.dpe_quotes enable row level security;
alter table public.dpe_deliverables enable row level security;

-- Politiques de sécurité (Accès par propriétaire)
create policy "Owners can manage their own DPE providers" on public.dpe_providers
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Owners can manage their own DPE requests" on public.dpe_requests
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Owners can manage their own DPE quotes" on public.dpe_quotes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Owners can manage their own DPE deliverables" on public.dpe_deliverables
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 9) Trigger pour auto-calculer valid_until à l'insertion
create or replace function public.set_dpe_validity()
returns trigger as $$
begin
  new.valid_until := public.compute_dpe_valid_until(new.issued_at);
  return new;
end;
$$ language plpgsql;

create trigger trg_set_dpe_validity
  before insert or update of issued_at on public.dpe_deliverables
  for each row execute function public.set_dpe_validity();

-- 10) Commentaire pour documentation
comment on table public.dpe_deliverables is 'Stocke les rapports DPE validés avec calcul automatique de fin de validité selon la loi française.';

