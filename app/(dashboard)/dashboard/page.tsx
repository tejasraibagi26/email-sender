import { NewProjectButton } from '@/components/NewProjectButton';
import { ProjectList } from '@/components/ProjectList';
import { formatRelative } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getProjectStats(supabase: Supabase, projectId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const [sentRes, jobsRes, keysRes] = await Promise.all([
    supabase
      .from('email_logs')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'sent')
      .gte('sent_at', thirtyDaysAgo),
    supabase.from('email_jobs').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'active'),
    supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('project_id', projectId).is('revoked_at', null),
  ]);

  return {
    sent30d: sentRes.count ?? 0,
    activeJobs: jobsRes.count ?? 0,
    keys: keysRes.count ?? 0,
  };
}

// Daily send counts per project for the last TREND_DAYS days, oldest first.
function bucketTrend(logs: { project_id: string; sent_at: string }[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime() - (TREND_DAYS - 1) * DAY_MS;

  const byProject = new Map<string, number[]>();
  for (const log of logs) {
    const day = Math.floor((new Date(log.sent_at).getTime() - startMs) / DAY_MS);
    if (day < 0 || day >= TREND_DAYS) continue;
    const buckets = byProject.get(log.project_id) ?? new Array<number>(TREND_DAYS).fill(0);
    buckets[day] += 1;
    byProject.set(log.project_id, buckets);
  }
  return byProject;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const trendStart = new Date(Date.now() - TREND_DAYS * DAY_MS).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const [{ data: projects }, { data: trendLogs }, { data: recent }, failedRes] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('email_logs').select('project_id, sent_at').eq('status', 'sent').gte('sent_at', trendStart).limit(5000),
    supabase.from('email_logs').select('id, project_id, subject, status, sent_at').order('sent_at', { ascending: false }).limit(5),
    supabase.from('email_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('sent_at', thirtyDaysAgo),
  ]);

  const withStats = await Promise.all(
    (projects ?? []).map(async (project) => ({
      project,
      stats: await getProjectStats(supabase, project.id),
    })),
  );

  const trends = bucketTrend(trendLogs ?? []);
  const projectNames = new Map((projects ?? []).map((p) => [p.id, p.name]));

  const totals = withStats.reduce(
    (acc, { stats }) => ({
      sent: acc.sent + stats.sent30d,
      jobs: acc.jobs + stats.activeJobs,
      keys: acc.keys + stats.keys,
    }),
    { sent: 0, jobs: 0, keys: 0 },
  );
  const failed = failedRes.count ?? 0;
  const failRate = totals.sent + failed > 0 ? ((failed / (totals.sent + failed)) * 100).toFixed(1) : '0';

  return (
    <div className="mx-auto max-w-[1200px] px-12 py-10 max-sm:px-5">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1.5 text-[32px] font-semibold tracking-[-0.03em]">Projects</h1>
          <p className="text-[15px] text-mute">Each project holds its own API keys, logs, and scheduled jobs.</p>
        </div>
        <NewProjectButton />
      </div>

      {withStats.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-24 text-center">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
            <svg aria-hidden="true" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="M3 7L11.15 13.09a1.5 1.5 0 001.7 0L21 7" />
            </svg>
          </div>
          <h2 className="mb-1.5 text-xl font-semibold">No projects yet</h2>
          <p className="max-w-[300px] text-sm text-mute">
            Create a project to get an API key and start sending — each project keeps its own keys, logs, and jobs.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <StatTile label="Sent, last 30 days" value={totals.sent.toLocaleString()} note={`across ${withStats.length} project${withStats.length === 1 ? '' : 's'}`} />
            <StatTile label="Failed" value={failed.toLocaleString()} note={`${failRate}% of sends`} />
            <StatTile label="Active jobs" value={totals.jobs.toLocaleString()} note="scheduled sends" />
            <StatTile label="Live API keys" value={totals.keys.toLocaleString()} note="not revoked" />
          </div>

          <div className="flex flex-wrap items-start gap-5">
            <ProjectList
              projects={withStats.map(({ project, stats }) => ({
                id: project.id,
                name: project.name,
                appName: project.app_name,
                trend: trends.get(project.id) ?? new Array<number>(TREND_DAYS).fill(0),
                sent30d: stats.sent30d,
                activeJobs: stats.activeJobs,
                keys: stats.keys,
              }))}
            />

            <section className="min-w-0 flex-[1_1_300px]">
              <h2 className="mb-3 text-[17px] font-semibold tracking-[-0.02em]">Recent activity</h2>
              <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
                {(recent ?? []).length === 0 && <div className="px-5 py-8 text-center text-sm text-mute">No sends yet.</div>}
                {(recent ?? []).map((log) => {
                  const ok = log.status === 'sent';
                  return (
                    <div key={log.id} className="flex gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-success-soft text-success' : 'bg-error-soft text-error'}`}>
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                          {ok ? <path d="M5 13L9 17L19 7" /> : <path d="M6 6L18 18M18 6L6 18" />}
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {ok ? 'Sent' : 'Failed'}: {log.subject}
                        </span>
                        <span className="block truncate text-[12.5px] text-mute">
                          {projectNames.get(log.project_id) ?? 'Unknown project'} · {formatRelative(log.sent_at)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-surface px-5 py-[18px]">
      <div className="mb-3 text-[13.5px] font-medium text-mute">{label}</div>
      <div className="text-[30px] font-semibold tracking-[-0.03em]">{value}</div>
      <div className="mt-0.5 text-[12.5px] text-mute">{note}</div>
    </div>
  );
}
