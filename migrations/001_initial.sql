-- Scheduled email job definitions
create table email_jobs (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  recipient        text not null,
  subject          text not null,
  body_html        text,
  body_text        text,
  cron_expression  text not null,
  status           text not null default 'active'
                     check (status in ('active', 'paused', 'completed')),
  created_at       timestamptz not null default now(),
  last_run_at      timestamptz,
  next_run_at      timestamptz
);

create index on email_jobs (status);

-- Immutable audit log of every send attempt (ad-hoc and scheduled)
create table email_logs (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references email_jobs(id) on delete set null,
  recipient   text not null,
  subject     text not null,
  status      text not null check (status in ('sent', 'failed')),
  error       text,
  sent_at     timestamptz not null default now()
);

create index on email_logs (job_id);
create index on email_logs (sent_at desc);
