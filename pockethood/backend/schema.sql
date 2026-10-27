-- POCKETHOOD online schema — DESIGN, NOT DEPLOYED.
-- Postgres 15+. Assumes an auth schema exposing auth.uid() (as in Supabase).
-- Every table has row-level security; service-role functions do privileged work.

create type app_role as enum ('platform_admin', 'content_reviewer', 'business_manager', 'business_editor', 'player');
create type approval_state as enum ('draft', 'in_review', 'approved', 'rejected', 'retired');

create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  role app_role not null default 'player',
  display_name text check (char_length(display_name) <= 32),
  is_minor boolean not null default true,          -- safest default until age is established
  created_at timestamptz not null default now()
);

create or replace function has_role(r app_role) returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = r)
$$;

-- ─── Player data ─────────────────────────────────────────────────────────────

create table saves (
  user_id uuid primary key references profiles on delete cascade,
  world_id text not null,
  state jsonb not null,                            -- validated GameState (save v4+)
  revision bigint not null default 0,              -- optimistic concurrency
  updated_at timestamptz not null default now()
);

create table action_log (                          -- idempotency + replay protection
  user_id uuid not null references profiles on delete cascade,
  op_id text not null check (char_length(op_id) <= 64),
  action jsonb not null,
  applied_at timestamptz not null default now(),
  primary key (user_id, op_id)
);

create table visit_codes (                         -- public, layout-only snapshots
  code text primary key check (code ~ '^[A-Za-z0-9_-]{6,16}$'),
  owner uuid not null references profiles on delete cascade,
  snapshot jsonb not null,                         -- {v,w,n,l,t,b,r} only
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

-- ─── Countries, worlds, businesses, modules ─────────────────────────────────

create table countries (code char(2) primary key, record jsonb not null, status text not null check (status in ('active', 'planned', 'paused')));
create table worlds (id text primary key, country char(2) not null references countries, current_version text not null);

create table businesses (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  country char(2) not null references countries,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table business_members (
  business_id uuid not null references businesses on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role app_role not null check (role in ('business_manager', 'business_editor')),
  primary key (business_id, user_id)
);

create table modules (
  id text primary key check (id ~ '^[a-z]{2}\.[a-z0-9_]+\.[a-z0-9_]+$'),
  business_id uuid references businesses,          -- null for first-party/community modules
  country char(2) not null references countries,
  enabled boolean not null default true,
  rollout_percent int check (rollout_percent between 0 and 100)
);

create table module_versions (
  module_id text not null references modules on delete cascade,
  version text not null check (version ~ '^\d+\.\d+\.\d+$'),
  content jsonb not null,                          -- the module JSON, validated by the build script
  sha256 char(64) not null,
  state approval_state not null default 'draft',
  drafted_by uuid not null references profiles,
  submitted_by uuid references profiles,
  reviewed_by uuid references profiles,
  review_notes text,
  evidence jsonb,                                  -- refs to licence / certificate / price-verification documents
  created_at timestamptz not null default now(),
  primary key (module_id, version),
  -- separation of duties: nobody approves their own submission
  check (reviewed_by is null or (reviewed_by <> drafted_by and reviewed_by <> coalesce(submitted_by, drafted_by)))
);

create table content_releases (
  id bigint generated always as identity primary key,
  content_version text not null,
  index_json jsonb not null,
  signature text not null,                         -- ECDSA P-256 over the exact index bytes
  key_id text not null,
  published_by uuid not null references profiles,
  published_at timestamptz not null default now()
);

create table kill_switches (
  module_id text primary key references modules,
  reason text not null,
  set_by uuid not null references profiles,
  set_at timestamptz not null default now()
);

-- ─── Analytics (aggregates only) & audit ────────────────────────────────────

create table analytics_daily (
  module_id text not null references modules,
  day date not null,
  region text not null,
  metric text not null check (metric in ('visits', 'items_made', 'quests_completed', 'sessions_seen')),
  players int not null,                            -- distinct players (suppressed below 50 in views)
  count bigint not null,
  primary key (module_id, day, region, metric)
);

create view partner_analytics as
  select module_id, day, region, metric, count from analytics_daily where players >= 50;

create table audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid references profiles,
  action text not null,
  target text,
  before_sha256 char(64),
  after_sha256 char(64),
  detail jsonb
);
revoke update, delete on audit_log from public;

-- ─── Row-level security ─────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table saves enable row level security;
alter table action_log enable row level security;
alter table visit_codes enable row level security;
alter table countries enable row level security;
alter table worlds enable row level security;
alter table businesses enable row level security;
alter table business_members enable row level security;
alter table modules enable row level security;
alter table module_versions enable row level security;
alter table content_releases enable row level security;
alter table kill_switches enable row level security;
alter table analytics_daily enable row level security;
alter table audit_log enable row level security;

-- Players see only themselves. Saves and action_log are written ONLY by the game API
-- (service role) after running applyAction server-side — never directly by clients.
create policy own_profile on profiles for select using (user_id = auth.uid());
create policy own_save_read on saves for select using (user_id = auth.uid());
create policy own_actions_read on action_log for select using (user_id = auth.uid());
create policy visit_public_read on visit_codes for select using (expires_at > now());

-- Public catalogue data
create policy countries_read on countries for select using (true);
create policy worlds_read on worlds for select using (true);
create policy releases_read on content_releases for select using (true);

-- Businesses: members see their own business
create policy business_member_read on businesses for select
  using (exists (select 1 from business_members m where m.business_id = id and m.user_id = auth.uid()) or has_role('platform_admin') or has_role('content_reviewer'));
create policy members_read on business_members for select using (user_id = auth.uid() or has_role('platform_admin'));

-- Module versions: business members draft/edit drafts; managers submit; reviewers decide.
create policy versions_read on module_versions for select using (
  has_role('platform_admin') or has_role('content_reviewer') or exists (
    select 1 from modules mo join business_members m on m.business_id = mo.business_id
    where mo.id = module_id and m.user_id = auth.uid()));
create policy versions_draft on module_versions for insert with check (
  state = 'draft' and drafted_by = auth.uid() and exists (
    select 1 from modules mo join business_members m on m.business_id = mo.business_id
    where mo.id = module_id and m.user_id = auth.uid()));
create policy versions_edit_draft on module_versions for update using (
  state = 'draft' and exists (
    select 1 from modules mo join business_members m on m.business_id = mo.business_id
    where mo.id = module_id and m.user_id = auth.uid()))
  with check (state in ('draft', 'in_review') and reviewed_by is null);
create policy versions_review on module_versions for update using (has_role('content_reviewer') and state = 'in_review')
  with check (state in ('approved', 'rejected') and reviewed_by = auth.uid());

-- Kill switches and releases: platform admins only (writes happen via audited functions).
create policy kill_admin on kill_switches for all using (has_role('platform_admin')) with check (has_role('platform_admin'));

-- Partner analytics: managers of the owning business, through the suppressed view only.
create policy analytics_manager on analytics_daily for select using (
  has_role('platform_admin') or exists (
    select 1 from modules mo join business_members m on m.business_id = mo.business_id
    where mo.id = module_id and m.user_id = auth.uid() and m.role = 'business_manager') and players >= 50);

create policy audit_admin_read on audit_log for select using (has_role('platform_admin'));
