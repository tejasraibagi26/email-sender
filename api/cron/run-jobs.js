import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import cronParser from 'cron-parser';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function computeNextRun(cronExpression) {
  try {
    return cronParser.parseExpression(cronExpression).next().toISOString();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date().toISOString();

  const { data: jobs, error } = await supabase
    .from('email_jobs')
    .select('*')
    .eq('status', 'active')
    .lte('next_run_at', now);

  if (error) {
    console.error('Failed to fetch due jobs:', error.message);
    return res.status(500).json({ error: error.message });
  }

  const results = await Promise.allSettled(
    jobs.map(async (job) => {
      try {
        await transporter.sendMail({
          from: `"Email Service" <${process.env.GMAIL_USER}>`,
          to: job.recipient,
          subject: job.subject,
          html: job.body_html ?? undefined,
          text: job.body_text ?? undefined,
        });

        await supabase.from('email_logs').insert({
          job_id: job.id,
          recipient: job.recipient,
          subject: job.subject,
          status: 'sent',
        });

        await supabase
          .from('email_jobs')
          .update({
            last_run_at: now,
            next_run_at: computeNextRun(job.cron_expression),
          })
          .eq('id', job.id);
      } catch (err) {
        await supabase.from('email_logs').insert({
          job_id: job.id,
          recipient: job.recipient,
          subject: job.subject,
          status: 'failed',
          error: err.message,
        });
        throw err;
      }
    })
  );

  const fired = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`Cron run: ${fired} sent, ${failed} failed out of ${jobs.length} due jobs`);
  return res.status(200).json({ fired, failed, total: jobs.length });
}
