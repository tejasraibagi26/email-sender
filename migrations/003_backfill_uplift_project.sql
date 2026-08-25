-- Run manually, once, after signing up on the new dashboard and creating the
-- real "Uplift" project + API key. Replace <uplift-project-id> below with that
-- project's actual id before running. Attaches pre-existing email_jobs/email_logs
-- rows (created before projects existed) to that project.

update email_jobs set project_id = '<uplift-project-id>' where project_id is null;
update email_logs set project_id = '<uplift-project-id>' where project_id is null;
