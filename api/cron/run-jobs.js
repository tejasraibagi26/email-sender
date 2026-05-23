import { Receiver } from '@upstash/qstash';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import cronParser from 'cron-parser';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

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
    return cronParser.parseExpression(cronExpression, { utc: true }).next().toISOString();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Read raw body for signature verification
  const rawBody = await new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
  });

  const signature = req.headers['upstash-signature'];
  const isValid = await receiver.verify({
    signature,
    body: rawBody,
    url: `https://${req.headers.host}${req.url}`,
  }).catch(() => false);

  if (!isValid) {
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
      console.log(`[job:${job.id}] Starting — type: ${job.metadata?.type ?? 'standard'}, recipient: ${job.recipient}`);
      try {
        if (job.metadata?.type === 'digest') {
          const digestUrl = job.metadata.digestUrl
            ?? `${process.env.MARKET_ANALYTICS_URL}/api/email-digest`;
          const symbols = job.metadata.symbols ?? [];

          console.log(`[job:${job.id}] Calling digest endpoint: ${digestUrl}`);
          console.log(`[job:${job.id}] Symbols: ${symbols.join(', ')}`);

          // Pass dryRun=true so the digest endpoint returns html+subject without
          // trying to call back into the email service to send (circular loop).
          const digestRes = await fetch(digestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: job.recipient, symbols, dryRun: true }),
          });

          console.log(`[job:${job.id}] Digest endpoint responded: ${digestRes.status}`);

          if (!digestRes.ok) {
            const body = await digestRes.json().catch(() => ({}));
            throw new Error(body.error ?? `Digest endpoint returned ${digestRes.status}`);
          }

          const { subject, html } = await digestRes.json();
          console.log(`[job:${job.id}] Got digest — subject: "${subject}", html length: ${html?.length ?? 0}`);

          await transporter.sendMail({
            from: `"Market Analytics" <${process.env.GMAIL_USER}>`,
            to: job.recipient,
            subject,
            html,
          });
          console.log(`[job:${job.id}] Email sent to ${job.recipient}`);
        } else {
          await transporter.sendMail({
            from: `"${job.app_name ?? 'Email Service'}" <${process.env.GMAIL_USER}>`,
            to: job.recipient,
            subject: job.subject,
            html: job.body_html ?? undefined,
            text: job.body_text ?? undefined,
          });
          console.log(`[job:${job.id}] Standard email sent to ${job.recipient}`);
        }

        await supabase.from('email_logs').insert({
          job_id: job.id,
          recipient: job.recipient,
          subject: job.subject,
          status: 'sent',
        });

        const nextRun = computeNextRun(job.cron_expression);
        console.log(`[job:${job.id}] Next run scheduled: ${nextRun}`);

        await supabase
          .from('email_jobs')
          .update({
            last_run_at: now,
            next_run_at: nextRun,
          })
          .eq('id', job.id);
      } catch (err) {
        console.error(`[job:${job.id}] Failed: ${err.message}`);
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
