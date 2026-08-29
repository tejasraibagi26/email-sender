-- Lets each project register its own default sender local-part (e.g. "hello"
-- instead of the global "noreply") for the shared mails.useuplift.live domain.
-- Only backs the generic fallback in resolveFrom() — typed sends (invite,
-- notification, alert, digest) keep their fixed TYPE_MAP addresses.
alter table projects add column if not exists sender_address text;

alter table projects drop constraint if exists projects_sender_address_format;
alter table projects add constraint projects_sender_address_format
  check (sender_address is null or sender_address ~ '^[a-z0-9]([a-z0-9._-]{0,62}[a-z0-9])?$');
