import cron from 'node-cron';
import supabase from './supabase.js';
import { sendEmail } from './mailer.js';
import { computeNextRun } from './cronHelper.js';

const registry = new Map(); // jobId → ScheduledTask

export async function loadAndRegisterJobs() {
  const { data: jobs, error } = await supabase
    .from('email_jobs')
    .select('*')
    .eq('status', 'active');

  if (error) throw new Error(`Failed to load jobs from Supabase: ${error.message}`);

  for (const job of jobs) {
    registerJob(job);
  }

  console.log(`Loaded ${jobs.length} scheduled job(s)`);
}

export function registerJob(job) {
  if (registry.has(job.id)) return;

  const task = cron.schedule(job.cron_expression, async () => {
    try {
      await sendEmail({
        to: job.recipient,
        subject: job.subject,
        html: job.body_html,
        text: job.body_text,
        type: job.metadata?.emailType ?? null,
        appName: job.app_name ?? null,
        jobId: job.id,
      });

      await supabase
        .from('email_jobs')
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: computeNextRun(job.cron_expression),
        })
        .eq('id', job.id);
    } catch (err) {
      console.error(`Job ${job.id} (${job.name}) failed:`, err.message);
    }
  });

  registry.set(job.id, task);
}

export function deregisterJob(jobId) {
  const task = registry.get(jobId);
  if (task) {
    task.stop();
    registry.delete(jobId);
  }
}

export function getRegisteredJobIds() {
  return Array.from(registry.keys());
}
