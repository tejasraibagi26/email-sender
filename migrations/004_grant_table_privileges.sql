-- RLS policies restrict rows but do not grant table-level access — without an
-- explicit GRANT, Postgres returns "permission denied for table X" before RLS
-- even runs. Migration 002 added policies for these tables but no grants.
grant select, insert, update, delete on projects to authenticated;
grant select, insert, update, delete on api_keys to authenticated;

-- Dashboard only reads these two directly (writes go through service-role routes).
grant select on email_jobs to authenticated;
grant select on email_logs to authenticated;

-- service_role (used by lib/apiAuth.ts and all api/v1 route handlers) hits the
-- same missing-grant wall independent of RLS bypass — RLS bypass only skips
-- policy checks, not the table-level privilege check. Without this, API-key
-- auth on api_keys/projects fails with "permission denied for table X",
-- which lib/apiAuth.ts masks as a generic INVALID_API_KEY 401.
grant select, insert, update, delete on projects to service_role;
grant select, insert, update, delete on api_keys to service_role;
grant select, insert, update, delete on email_jobs to service_role;
grant select, insert, update, delete on email_logs to service_role;
