import { Resend } from 'resend';
import supabase from './supabase.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const DOMAIN = 'mails.useuplift.live';
const DEFAULT_APP = 'Uplift';

const TYPE_MAP = {
  invite:       { label: 'Invites',      address: 'invite' },
  notification: { label: null,           address: 'notifications' },
  alert:        { label: 'Alerts',       address: 'alerts' },
  digest:       { label: 'Digest',       address: 'digest' },
};

function resolveFrom(type, appName) {
  const app = appName || DEFAULT_APP;
  const entry = type && TYPE_MAP[type];
  if (!entry) return `${app} <noreply@${DOMAIN}>`;
  const name = entry.label ? `${app} ${entry.label}` : app;
  return `${name} <${entry.address}@${DOMAIN}>`;
}

export async function sendEmail({ to, subject, html, text, type = null, appName = null, jobId = null }) {
  try {
    await resend.emails.send({
      from: resolveFrom(type, appName),
      to,
      subject,
      html,
      text,
    });

    await supabase.from('email_logs').insert({
      job_id: jobId,
      recipient: to,
      subject,
      status: 'sent',
    });
  } catch (err) {
    await supabase.from('email_logs').insert({
      job_id: jobId,
      recipient: to,
      subject,
      status: 'failed',
      error: err.message,
    });
    throw err;
  }
}
