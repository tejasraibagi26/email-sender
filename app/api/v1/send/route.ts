import { authenticateApiKey } from '@/lib/apiAuth';
import { sendEmail } from '@/lib/mailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) return auth.error;
  const { project } = auth;

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: 'Invalid JSON body', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { to, subject, html, text, type } = body;

  if (!to || !EMAIL_RE.test(to)) {
    return Response.json({ error: 'Valid recipient email is required', code: 'VALIDATION_ERROR' }, { status: 400 });
  }
  if (!subject) {
    return Response.json({ error: 'subject is required', code: 'VALIDATION_ERROR' }, { status: 400 });
  }
  if (!html && !text) {
    return Response.json(
      { error: 'At least one of html or text is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const log = await sendEmail({ project, to, subject, html, text, type: type ?? null, jobId: null });
    return Response.json({ success: true, data: { id: log.id, status: log.status, recipient: log.recipient } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed';
    return Response.json({ error: message, code: 'SEND_FAILED' }, { status: 502 });
  }
}
