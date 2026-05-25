import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

const DOMAIN = 'mail.useuplift.live';
const FROM_MAP = {
  invite: `Uplift Invites <invite@${DOMAIN}>`,
  notification: `Uplift <notifications@${DOMAIN}>`,
  alert: `Uplift Alerts <alerts@${DOMAIN}>`,
};
const DEFAULT_FROM = `Uplift <noreply@${DOMAIN}>`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireApiKey(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return false;
  try {
    const expected = Buffer.from(process.env.API_KEY);
    const provided = Buffer.from(token);
    return expected.length === provided.length && timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized', code: 'INVALID_API_KEY' });
  }

  const { to, subject, html, text, type } = req.body;

  if (!to || !EMAIL_RE.test(to)) {
    return res.status(400).json({ error: 'Valid recipient email is required', code: 'VALIDATION_ERROR' });
  }
  if (!subject) {
    return res.status(400).json({ error: 'subject is required', code: 'VALIDATION_ERROR' });
  }
  if (!html && !text) {
    return res.status(400).json({ error: 'At least one of html or text is required', code: 'VALIDATION_ERROR' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = (type && FROM_MAP[type]) || DEFAULT_FROM;

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    await resend.emails.send({ from, to, subject, html, text });
    await supabase.from('email_logs').insert({ job_id: null, recipient: to, subject, status: 'sent' });
    return res.status(200).json({ success: true, data: { message: 'Email sent', recipient: to } });
  } catch (err) {
    await supabase.from('email_logs').insert({ job_id: null, recipient: to, subject, status: 'failed', error: err.message });
    return res.status(502).json({ error: err.message, code: 'SEND_FAILED' });
  }
}
