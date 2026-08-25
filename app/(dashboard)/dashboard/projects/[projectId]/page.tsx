import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NewApiKeyButton } from '@/components/NewApiKeyButton';
import { createClient } from '@/lib/supabase/server';
import { deleteJob, revokeApiKey, toggleJobStatus } from '../../actions';

type Tab = 'keys' | 'logs' | 'jobs';

function formatDate(value: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(value: string | null) {
  if (!value) return 'Never';
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { projectId } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === 'logs' || tabParam === 'jobs' ? tabParam : 'keys';

  const supabase = await createClient();
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
  if (!project) notFound();

  const tabHref = (t: Tab) => `/dashboard/projects/${projectId}${t === 'keys' ? '' : `?tab=${t}`}`;
  const tabClass = (t: Tab) =>
    `border-b-2 pb-2.5 text-[13.5px] font-semibold ${t === tab ? 'border-accent text-ink' : 'border-transparent text-ink/60'}`;

  return (
    <div className="mx-auto max-w-[1120px] px-16 py-8 pb-11">
      <div className="mb-[18px] flex items-center gap-2 text-[13px] text-ink/40">
        <Link href="/dashboard">Projects</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M9 18L15 12L9 6" />
        </svg>
        <span className="font-semibold text-ink">{project.name}</span>
      </div>

      <h1 className="font-serif text-[28px]">{project.name}</h1>

      <div className="my-[22px] flex gap-7 border-b border-border">
        <Link href={tabHref('keys')} className={tabClass('keys')}>
          API Keys
        </Link>
        <Link href={tabHref('logs')} className={tabClass('logs')}>
          Logs
        </Link>
        <Link href={tabHref('jobs')} className={tabClass('jobs')}>
          Jobs
        </Link>
      </div>

      {tab === 'keys' && <KeysTab supabase={supabase} projectId={projectId} />}
      {tab === 'logs' && <LogsTab supabase={supabase} projectId={projectId} />}
      {tab === 'jobs' && <JobsTab supabase={supabase} projectId={projectId} />}
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
        <p className="text-[13.5px] text-ink/60">Keys authenticate requests to this project only.</p>
        <NewApiKeyButton projectId={projectId} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_0.6fr] gap-2 border-b border-border bg-surface-alt px-5 py-3.5 text-[11.5px] font-bold uppercase tracking-wide text-ink/40">
          <span>Name</span>
          <span>Key</span>
          <span>Created</span>
          <span>Last used</span>
          <span />
        </div>
        {(keys ?? []).length === 0 && <div className="px-5 py-8 text-center text-sm text-ink/40">No keys yet.</div>}
        {(keys ?? []).map((key) => (
          <div key={key.id} className="grid grid-cols-[2fr_1.4fr_1fr_1fr_0.6fr] items-center gap-2 border-b border-border px-5 py-3.5 last:border-b-0">
            <span className="text-sm font-semibold">{key.name}</span>
            <span className="font-mono text-[13px] text-ink/60">{key.key_prefix}••••••••</span>
            <span className="text-[13px] text-ink/60">{formatDate(key.created_at)}</span>
            <span className="text-[13px] text-ink/60">{formatRelative(key.last_used_at)}</span>
            {key.revoked_at ? (
              <span className="justify-self-end text-[12.5px] font-semibold text-ink/30">Revoked</span>
            ) : (
              <form action={revokeApiKey} className="justify-self-end">
                <input type="hidden" name="key_id" value={key.id} />
                <input type="hidden" name="project_id" value={projectId} />
                <button type="submit" className="text-[12.5px] font-semibold text-error">
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
      <p className="mb-4 text-[13.5px] text-ink/60">Every send attempt for this project, most recent first.</p>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[1fr_1.6fr_0.9fr_1fr] gap-2 border-b border-border bg-surface-alt px-5 py-3.5 text-[11.5px] font-bold uppercase tracking-wide text-ink/40">
          <span>Recipient</span>
          <span>Subject</span>
          <span>Status</span>
          <span>Sent</span>
        </div>
        {(logs ?? []).length === 0 && <div className="px-5 py-8 text-center text-sm text-ink/40">No sends yet.</div>}
        {(logs ?? []).map((log) => (
          <div key={log.id} className="grid grid-cols-[1fr_1.6fr_0.9fr_1fr] items-center gap-2 border-b border-border px-5 py-3.5 last:border-b-0">
            <span className="truncate font-mono text-[13.5px]">{log.recipient}</span>
            <span className="truncate text-[13.5px] text-ink/70">{log.subject}</span>
            <span>
              {log.status === 'sent' ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-bold text-success">
                  Sent
                </span>
              ) : (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-error-soft px-2.5 py-1 text-[12px] font-bold text-error" title={log.error ?? undefined}>
                  Failed
                </span>
              )}
            </span>
            <span className="text-[13px] text-ink/60">{formatRelative(log.sent_at)}</span>
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
      <p className="mb-4 text-[13.5px] text-ink/60">Recurring sends, scheduled and managed per project.</p>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[1.6fr_1.2fr_1fr_0.9fr_0.9fr] gap-2 border-b border-border bg-surface-alt px-5 py-3.5 text-[11.5px] font-bold uppercase tracking-wide text-ink/40">
          <span>Job</span>
          <span>Recipient</span>
          <span>Next run</span>
          <span>Status</span>
          <span />
        </div>
        {(jobs ?? []).length === 0 && <div className="px-5 py-8 text-center text-sm text-ink/40">No scheduled jobs yet.</div>}
        {(jobs ?? []).map((job) => (
          <div key={job.id} className="grid grid-cols-[1.6fr_1.2fr_1fr_0.9fr_0.9fr] items-center gap-2 border-b border-border px-5 py-3.5 last:border-b-0">
            <span className="text-[13.5px] font-semibold">{job.name}</span>
            <span className="font-mono text-[13px] text-ink/60">{job.recipient}</span>
            <span className="text-[13px] text-ink/60">{job.next_run_at ? formatRelative(job.next_run_at) : '—'}</span>
            <span>
              {job.status === 'active' ? (
                <span className="inline-flex w-fit rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-bold text-success">Active</span>
              ) : (
                <span className="inline-flex w-fit rounded-full bg-pending-soft px-2.5 py-1 text-[12px] font-bold text-pending">Paused</span>
              )}
            </span>
            <div className="flex justify-end gap-3">
              <form action={toggleJobStatus}>
                <input type="hidden" name="job_id" value={job.id} />
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="next_status" value={job.status === 'active' ? 'paused' : 'active'} />
                <button type="submit" className="text-[12.5px] font-semibold text-ink/60">
                  {job.status === 'active' ? 'Pause' : 'Resume'}
                </button>
              </form>
              <form action={deleteJob}>
                <input type="hidden" name="job_id" value={job.id} />
                <input type="hidden" name="project_id" value={projectId} />
                <button type="submit" className="text-[12.5px] font-semibold text-error">
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
