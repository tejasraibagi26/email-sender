import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

const DOMAIN = 'mails.useuplift.live';
const DEFAULT_APP = 'Uplift';

const TYPE_MAP = {
  invite:       { label: 'Invites',      address: 'invite' },
  notification: { label: null,           address: 'notifications' },
  alert:        { label: 'Alerts',       address: 'alerts' },
  digest:       { label: 'Digest',       address: 'digest' },
};

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
  const { appName } = req.body;
  const app = appName || DEFAULT_APP;
  const entry = type && TYPE_MAP[type];
  const fromName = entry ? (entry.label ? `${app} ${entry.label}` : app) : app;
  const fromAddress = entry ? `${entry.address}@${DOMAIN}` : `noreply@${DOMAIN}`;
  const from = `${fromName} <${fromAddress}>`;

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    const result = await resend.emails.send({ from, to, subject, html, text });
    console.log('[send] resend result:', JSON.stringify(result));
    if (result.error) {
      await supabase.from('email_logs').insert({ job_id: null, recipient: to, subject, status: 'failed', error: result.error.message });
      return res.status(502).json({ error: result.error.message, code: 'SEND_FAILED' });
    }
    await supabase.from('email_logs').insert({ job_id: null, recipient: to, subject, status: 'sent' });
    return res.status(200).json({ success: true, data: { message: 'Email sent', recipient: to } });
  } catch (err) {
    console.error('[send] error:', err.message);
    await supabase.from('email_logs').insert({ job_id: null, recipient: to, subject, status: 'failed', error: err.message });
    return res.status(502).json({ error: err.message, code: 'SEND_FAILED' });
  }
}
