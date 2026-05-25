import { Resend } from 'resend';
import supabase from './supabase.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const DOMAIN = 'mail.useuplift.live';

const FROM_MAP = {
  invite: `Uplift Invites <invite@${DOMAIN}>`,
  notification: `Uplift <notifications@${DOMAIN}>`,
  alert: `Uplift Alerts <alerts@${DOMAIN}>`,
};

const DEFAULT_FROM = `Uplift <noreply@${DOMAIN}>`;

function resolveFrom(type) {
  return (type && FROM_MAP[type]) || DEFAULT_FROM;
}

export async function sendEmail({ to, subject, html, text, type = null, jobId = null }) {
  try {
    await resend.emails.send({
      from: resolveFrom(type),
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
