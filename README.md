# Send by Uplift

Email infrastructure for every app under the Uplift umbrella — a Next.js app that serves the marketing site, docs, dashboard, and the `/api/v1` email API from one deployment.

Each Uplift app gets its own **project** with project-scoped **API keys**. Sends and scheduled jobs are authenticated by key, not by a single shared secret.

## Stack

- **Next.js** (App Router) — site, dashboard, and API routes
- **Supabase** — Postgres + Auth (dashboard accounts, RLS-scoped reads) + service-role client (API routes, cron worker)
- **Resend** — outbound mail, from `mails.useuplift.live`
- **Upstash QStash** — triggers `/api/cron/run-jobs` on a schedule to fire due jobs (Vercel serverless can't run a persistent scheduler)
- **Fumadocs** — the `/docs` section

## Setup

### 1. Supabase

Run the migrations in the Supabase SQL editor, in order:

```
migrations/001_initial.sql
migrations/002_saas_accounts.sql
```

`002` adds `projects` and `api_keys`, plus RLS policies scoping dashboard reads to the signed-in user's own projects.

In **Authentication → Providers → Email**, turn **off** "Allow new users to sign up" — this app is invite-only. Create accounts directly from the Supabase dashboard (Authentication → Users → Add user).

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in Resend, Supabase (both the service-role and public keys — see comments in `.env.example`), and QStash values.

### 3. Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production build
```

## Project layout

```
app/
  page.tsx                          marketing landing page
  docs/                             Fumadocs section (content in content/docs/*.mdx)
  login/                            dashboard sign-in
  (dashboard)/dashboard/            projects list, project detail (keys / logs / jobs tabs)
  api/v1/                           public API — send, emails, jobs (Bearer sbu_live_... auth)
  api/cron/run-jobs/                QStash-triggered worker that fires due scheduled jobs
lib/
  apiAuth.ts                        API key generation/hashing/lookup
  mailer.ts                         Resend send + email_logs bookkeeping
  cron.ts                           cron expression parsing/validation
  supabase/                         admin (service-role), server, client (RLS-scoped)
migrations/                         SQL, run in order against Supabase
```

## API

Full reference lives at `/docs` once deployed. Summary:

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/v1/send` | API key | Send an email immediately |
| `GET /api/v1/emails` | API key | List recent sends for the project |
| `GET /api/v1/emails/:id` | API key | Check a single send's status |
| `POST /api/v1/jobs` | API key | Create a scheduled recurring send |
| `GET /api/v1/jobs` / `GET /api/v1/jobs/:id` | API key | List / inspect scheduled jobs |
| `DELETE /api/v1/jobs/:id` | API key | Cancel a scheduled job |
| `POST /api/cron/run-jobs` | QStash signature | Internal — fires due jobs |

Every API key is scoped to one project; the "From" name on every email is derived from that project, never from the request body.

## Migrating existing callers (Uplift, portfolio-tracker, aggregator-service)

This repo previously exposed a single global `API_KEY`-authenticated API (`src/`, `api/` — removed in this rewrite). To cut existing callers over:

1. Deploy this app to a preview URL first.
2. Sign in, create a project per existing caller (or one shared "Uplift" project), generate an API key for each.
3. Run `migrations/003_backfill_uplift_project.sql` (fill in the real project id first) to attach pre-existing `email_jobs`/`email_logs` rows.
4. Update each calling app's `EMAIL_SERVICE_URL`/`EMAIL_SERVICE_API_KEY` to point at the new deployment and key, and switch endpoints from `/send` and `/schedule` to `/api/v1/send` and `/api/v1/jobs`.
5. Repoint the QStash schedule at the new `/api/cron/run-jobs` URL (same signing keys).
6. Once verified, point `send.useuplift.live` at this deployment and remove the old `API_KEY` env var from the previous Vercel project.
