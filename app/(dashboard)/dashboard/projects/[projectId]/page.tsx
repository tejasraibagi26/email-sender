import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NewApiKeyButton } from '@/components/NewApiKeyButton';
import { SenderAddressForm } from '@/components/SenderAddressForm';
import { DOMAIN } from '@/lib/emailDomain';
import { formatDate, formatRelative } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import { deleteJob, revokeApiKey, toggleJobStatus } from '../../actions';

type Tab = 'keys' | 'logs' | 'jobs' | 'settings';

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { projectId } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === 'logs' || tabParam === 'jobs' || tabParam === 'settings' ? tabParam : 'keys';

  const supabase = await createClient();
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
  if (!project) notFound();

  const tabHref = (t: Tab) => `/dashboard/projects/${projectId}${t === 'keys' ? '' : `?tab=${t}`}`;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'keys', label: 'API Keys' },
    { id: 'logs', label: 'Logs' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-12 py-8 pb-11 max-sm:px-5">
      <div className="mb-4 flex items-center gap-2 text-[13.5px] text-mute">
        <Link href="/dashboard" className="hover:text-ink">
          Projects
        </Link>
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18L15 12L9 6" />
        </svg>
        <span className="font-semibold text-ink">{project.name}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">{project.name}</h1>
        <span className="rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[12.5px] text-mute">
          {project.sender_address ?? 'noreply'}@{DOMAIN}
        </span>
      </div>

      <div className="mb-7 flex gap-7 overflow-x-auto border-b border-border">
        {tabs.map(({ id, label }) => (
          <Link
            key={id}
            href={tabHref(id)}
            aria-current={id === tab ? 'page' : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-[14.5px] ${
              id === tab ? 'border-accent font-semibold text-ink' : 'border-transparent font-medium text-mute hover:text-ink'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === 'keys' && <KeysTab supabase={supabase} projectId={projectId} />}
      {tab === 'logs' && <LogsTab supabase={supabase} projectId={projectId} />}
      {tab === 'jobs' && <JobsTab supabase={supabase} projectId={projectId} />}
      {tab === 'settings' && <SenderAddressForm projectId={projectId} senderAddress={project.sender_address} />}
    </div>
  );
}

async function KeysTab({
  supabase,
  projectId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  projectId: string;
}) {
  const { data: keys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14.5px] text-mute">Keys authenticate requests to this project only.</p>
        <NewApiKeyButton projectId={projectId} />
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
        <div className="grid min-w-[680px] grid-cols-[2fr_1.4fr_1fr_1fr_0.6fr] gap-3 border-b border-border bg-bg px-5 py-[13px] font-mono text-[11.5px] uppercase tracking-[.06em] text-mute">
          <span>Name</span>
          <span>Key</span>
          <span>Created</span>
          <span>Last used</span>
          <span />
        </div>
        {(keys ?? []).length === 0 && <div className="px-5 py-8 text-center text-sm text-mute">No keys yet.</div>}
        {(keys ?? []).map((key) => (
          <div key={key.id} className="grid min-w-[680px] grid-cols-[2fr_1.4fr_1fr_1fr_0.6fr] items-center gap-3 border-b border-border px-5 py-4 last:border-b-0">
            <span className="text-[14.5px] font-semibold">{key.name}</span>
            <span className="font-mono text-[13px] text-mute">{key.key_prefix}••••••••</span>
            <span className="text-[13px] text-mute">{formatDate(key.created_at)}</span>
            <span className="text-[13px] text-mute">{formatRelative(key.last_used_at)}</span>
            {key.revoked_at ? (
              <span className="justify-self-end rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-mute">Revoked</span>
            ) : (
              <form action={revokeApiKey} className="justify-self-end">
                <input type="hidden" name="key_id" value={key.id} />
                <input type="hidden" name="project_id" value={projectId} />
                <button type="submit" className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-error hover:bg-error-soft">
                  Revoke
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

async function LogsTab({
  supabase,
  projectId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  projectId: string;
}) {
  const { data: logs } = await supabase
    .from('email_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('sent_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <p className="mb-4 text-[14.5px] text-mute">Every send attempt for this project, most recent first.</p>
      <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
        <div className="grid min-w-[680px] grid-cols-[1fr_1.6fr_0.9fr_1fr] gap-3 border-b border-border bg-bg px-5 py-[13px] font-mono text-[11.5px] uppercase tracking-[.06em] text-mute">
          <span>Recipient</span>
          <span>Subject</span>
          <span>Status</span>
          <span>Sent</span>
        </div>
        {(logs ?? []).length === 0 && <div className="px-5 py-8 text-center text-sm text-mute">No sends yet.</div>}
        {(logs ?? []).map((log) => (
          <div key={log.id} className="grid min-w-[680px] grid-cols-[1fr_1.6fr_0.9fr_1fr] items-center gap-3 border-b border-border px-5 py-4 last:border-b-0">
            <span className="truncate font-mono text-[13px]">{log.recipient}</span>
            <span className="truncate text-[13.5px] text-ink">{log.subject}</span>
            <span>
              {log.status === 'sent' ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[12.5px] font-semibold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Sent
                </span>
              ) : (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-error-soft px-2.5 py-1 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-error hover:bg-error-soft" title={log.error ?? undefined}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Failed
                </span>
              )}
            </span>
            <span className="text-[13px] text-mute">{formatRelative(log.sent_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function JobsTab({
  supabase,
  projectId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  projectId: string;
}) {
  const { data: jobs } = await supabase
    .from('email_jobs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  return (
    <div>
      <p className="mb-4 text-[14.5px] text-mute">Recurring sends, scheduled and managed per project.</p>
      <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
        <div className="grid min-w-[680px] grid-cols-[1.6fr_1.2fr_1fr_0.9fr_0.9fr] gap-3 border-b border-border bg-bg px-5 py-[13px] font-mono text-[11.5px] uppercase tracking-[.06em] text-mute">
          <span>Job</span>
          <span>Recipient</span>
          <span>Next run</span>
          <span>Status</span>
          <span />
        </div>
        {(jobs ?? []).length === 0 && <div className="px-5 py-8 text-center text-sm text-mute">No scheduled jobs yet.</div>}
        {(jobs ?? []).map((job) => (
          <div key={job.id} className="grid min-w-[680px] grid-cols-[1.6fr_1.2fr_1fr_0.9fr_0.9fr] items-center gap-3 border-b border-border px-5 py-4 last:border-b-0">
            <span className="text-[13.5px] font-semibold">{job.name}</span>
            <span className="font-mono text-[13px] text-mute">{job.recipient}</span>
            <span className="text-[13px] text-mute">{job.next_run_at ? formatRelative(job.next_run_at) : '—'}</span>
            <span>
              {job.status === 'active' ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[12.5px] font-semibold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Active
                </span>
              ) : (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-pending-soft px-2.5 py-1 text-[12.5px] font-semibold text-pending">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Paused
                </span>
              )}
            </span>
            <div className="flex justify-end gap-3">
              <form action={toggleJobStatus}>
                <input type="hidden" name="job_id" value={job.id} />
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="next_status" value={job.status === 'active' ? 'paused' : 'active'} />
                <button type="submit" className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-mute hover:text-ink">
                  {job.status === 'active' ? 'Pause' : 'Resume'}
                </button>
              </form>
              <form action={deleteJob}>
                <input type="hidden" name="job_id" value={job.id} />
                <input type="hidden" name="project_id" value={projectId} />
                <button type="submit" className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-error hover:bg-error-soft">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
