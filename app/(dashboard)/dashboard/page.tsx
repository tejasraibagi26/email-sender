import Link from 'next/link';
import { NewProjectButton } from '@/components/NewProjectButton';
import { createClient } from '@/lib/supabase/server';

async function getProjectStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

  const withStats = await Promise.all(
    (projects ?? []).map(async (project) => ({
      project,
      stats: await getProjectStats(supabase, project.id),
    })),
  );

  return (
    <div className="mx-auto max-w-[1120px] px-16 py-11">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 font-serif text-[30px]">Projects</h1>
          <p className="text-sm text-ink/60">Each project holds its own API keys, logs, and scheduled jobs.</p>
        </div>
        <NewProjectButton />
      </div>

      {withStats.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-24 text-center">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#C1571F" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="M3 7L11.15 13.09a1.5 1.5 0 001.7 0L21 7" />
            </svg>
            <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg bg-accent">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBF3E7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5V19" />
                <path d="M5 12H19" />
              </svg>
            </div>
          </div>
          <h2 className="mb-1.5 font-serif text-xl">No projects yet</h2>
          <p className="max-w-[300px] text-sm text-ink/50">
            Create a project to get an API key and start sending — each project keeps its own keys, logs, and jobs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[18px]">
          {withStats.map(({ project, stats }) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="rounded-[14px] border border-border bg-surface p-6 transition hover:border-accent/40"
            >
              <div className="mb-[18px] flex items-center justify-between">
                <span className="text-[17px] font-bold">{project.name}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-ink/40">
                  <path d="M9 18L15 12L9 6" />
                </svg>
              </div>
              <p className="mb-5 font-mono text-[13px] text-ink/40">sends as &quot;{project.app_name}&quot;</p>
              <div className="flex gap-5 border-t border-border pt-4">
                <div>
                  <div className="text-[18px] font-bold">{stats.sent30d}</div>
                  <div className="text-[11.5px] text-ink/40">sent (30d)</div>
                </div>
                <div>
                  <div className="text-[18px] font-bold">{stats.activeJobs}</div>
                  <div className="text-[11.5px] text-ink/40">active jobs</div>
                </div>
                <div>
                  <div className="text-[18px] font-bold">{stats.keys}</div>
                  <div className="text-[11.5px] text-ink/40">keys</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
