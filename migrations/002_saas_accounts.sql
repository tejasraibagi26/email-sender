-- Adds accounts, projects, and project-scoped API keys on top of the existing
-- email_jobs / email_logs tables. Additive only — safe to run while the old
-- global-API_KEY code paths (src/, api/) are still live; nothing here breaks them.

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  app_name    text not null,          -- used verbatim in the Resend "From" header
  created_at  timestamptz not null default now()
);
create index if not exists projects_owner_id_idx on projects (owner_id);

create table if not exists api_keys (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  name          text not null,
  key_prefix    text not null,         -- e.g. "sbu_live_1a2b3c4d" for masked display
  key_hash      text not null,         -- sha256 hex of the full key
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);
create unique index if not exists api_keys_key_hash_idx on api_keys (key_hash);
create index if not exists api_keys_project_id_idx on api_keys (project_id);

-- email_jobs already carries undocumented app_name/metadata columns in production
-- (written by the pre-rewrite Express routes, absent from migration 001) — add them
-- here via IF NOT EXISTS so this migration is safe to run against either state.
alter table email_jobs add column if not exists app_name text;
alter table email_jobs add column if not exists metadata jsonb;
alter table email_jobs add column if not exists project_id uuid references projects(id) on delete cascade;

alter table email_logs add column if not exists project_id uuid references projects(id) on delete cascade;
alter table email_logs add column if not exists provider_message_id text; -- Resend's id, for future delivery-status webhooks

create index if not exists email_jobs_project_id_idx on email_jobs (project_id);
create index if not exists email_logs_project_id_idx on email_logs (project_id);

alter table projects enable row level security;
alter table api_keys enable row level security;
alter table email_jobs enable row level security;
alter table email_logs enable row level security;

-- Dashboard reads run as the signed-in user (RLS-scoped); all writes to
-- email_jobs/email_logs go through service-role API route handlers, which bypass
-- RLS entirely — so those two tables only need select policies here.
drop policy if exists "owners manage their projects" on projects;
create policy "owners manage their projects" on projects
  for all using (owner_id = auth.uid());

drop policy if exists "owners manage their api keys" on api_keys;
create policy "owners manage their api keys" on api_keys
  for all using (project_id in (select id from projects where owner_id = auth.uid()));

drop policy if exists "owners read their jobs" on email_jobs;
create policy "owners read their jobs" on email_jobs
  for select using (project_id in (select id from projects where owner_id = auth.uid()));

drop policy if exists "owners read their logs" on email_logs;
create policy "owners read their logs" on email_logs
  for select using (project_id in (select id from projects where owner_id = auth.uid()));
