import { Receiver } from '@upstash/qstash';
import { computeNextRun } from '@/lib/cron';
import { sendEmail } from '@/lib/mailer';
import { supabaseAdmin } from '@/lib/supabase/admin';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

type EmailJobMetadata = {
  type?: string;
  emailType?: string;
  digestUrl?: string;
  symbols?: string[];
};

type EmailJob = {
  id: string;
  project_id: string | null;
  app_name: string | null;
  recipient: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  cron_expression: string;
  metadata: EmailJobMetadata | null;
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('upstash-signature') ?? '';

  const isValid = await receiver.verify({ signature, body: rawBody, url: request.url }).catch(() => false);
  if (!isValid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data: jobs, error } = await supabaseAdmin
    .from('email_jobs')
    .select('*')
    .eq('status', 'active')
    .lte('next_run_at', now);

  if (error) {
    console.error('Failed to fetch due jobs:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (jobs as EmailJob[]).map(async (job) => {
      console.log(`[job:${job.id}] Starting — type: ${job.metadata?.type ?? 'standard'}, recipient: ${job.recipient}`);

      // Jobs created before the SaaS migration may still carry a null project_id
      // until the one-time backfill (migration 003) runs; app_name is always set.
      const project = { id: job.project_id ?? '', app_name: job.app_name ?? 'Uplift' };

      try {
        if (job.metadata?.type === 'digest') {
          const digestUrl = job.metadata.digestUrl ?? `${process.env.MARKET_ANALYTICS_URL}/api/email-digest`;
          const symbols = job.metadata.symbols ?? [];

          console.log(`[job:${job.id}] Calling digest endpoint: ${digestUrl}`);
          console.log(`[job:${job.id}] Symbols: ${symbols.join(', ')}`);

          // Pass dryRun=true so the digest endpoint returns html+subject without
          // trying to call back into this service to send (circular loop).
          const digestRes = await fetch(digestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: job.recipient, symbols, dryRun: true }),
          });

          console.log(`[job:${job.id}] Digest endpoint responded: ${digestRes.status}`);

          if (!digestRes.ok) {
            const errBody = await digestRes.json().catch(() => ({}));
            throw new Error(errBody.error ?? `Digest endpoint returned ${digestRes.status}`);
          }

          const { subject, html } = await digestRes.json();
          console.log(`[job:${job.id}] Got digest — subject: "${subject}", html length: ${html?.length ?? 0}`);

          await sendEmail({
            project,
            to: job.recipient,
            subject,
            html,
            type: job.metadata?.emailType ?? 'digest',
            jobId: job.id,
          });
          console.log(`[job:${job.id}] Email sent to ${job.recipient}`);
        } else {
          await sendEmail({
            project,
            to: job.recipient,
            subject: job.subject,
            html: job.body_html,
            text: job.body_text,
            type: job.metadata?.emailType ?? null,
            jobId: job.id,
          });
          console.log(`[job:${job.id}] Standard email sent to ${job.recipient}`);
        }

        const nextRun = computeNextRun(job.cron_expression);
        console.log(`[job:${job.id}] Next run scheduled: ${nextRun}`);

        await supabaseAdmin.from('email_jobs').update({ last_run_at: now, next_run_at: nextRun }).eq('id', job.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[job:${job.id}] Failed: ${message}`);
        throw err;
      }
    }),
  );

  const fired = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`Cron run: ${fired} sent, ${failed} failed out of ${jobs.length} due jobs`);
  return Response.json({ fired, failed, total: jobs.length });
}
