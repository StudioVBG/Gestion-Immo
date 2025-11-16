create table if not exists public.property_share_tokens (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id),
  revoke_reason text
);

create index if not exists property_share_tokens_property_id_idx on public.property_share_tokens(property_id);
create index if not exists property_share_tokens_token_idx on public.property_share_tokens(token);
create index if not exists property_share_tokens_expires_at_idx on public.property_share_tokens(expires_at);

alter table public.property_share_tokens enable row level security;

create policy "property share tokens readable for service role only"
on public.property_share_tokens
for select
to service_role
using (true);

create policy "property share tokens insertable by service role"
on public.property_share_tokens
for insert
to service_role
with check (true);

create policy "property share tokens updatable by service role"
on public.property_share_tokens
for update
to service_role
using (true)
with check (true);



