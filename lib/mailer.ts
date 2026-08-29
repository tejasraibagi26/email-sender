import { Resend } from 'resend';
import { supabaseAdmin } from './supabase/admin';
import type { AuthenticatedProject } from './apiAuth';
import { DOMAIN } from './emailDomain';

const resend = new Resend(process.env.RESEND_API_KEY);

export { DOMAIN };

export const TYPE_MAP: Record<string, { label: string | null; address: string }> = {
  invite: { label: 'Invites', address: 'invite' },
  notification: { label: null, address: 'notifications' },
  alert: { label: 'Alerts', address: 'alerts' },
  digest: { label: 'Digest', address: 'digest' },
};

export function resolveFrom(
  type: string | null | undefined,
  appName: string,
  senderAddress?: string | null,
): string {
  const entry = type ? TYPE_MAP[type] : undefined;
  if (!entry) return `${appName} <${senderAddress || 'noreply'}@${DOMAIN}>`;
  const name = entry.label ? `${appName} ${entry.label}` : appName;
  return `${name} <${entry.address}@${DOMAIN}>`;
}

export type SendEmailInput = {
  project: Pick<AuthenticatedProject, 'id' | 'app_name' | 'sender_address'>;
  to: string;
  subject: string;
  html?: string | null;
  text?: string | null;
  type?: string | null;
  jobId?: string | null;
};

export type EmailLog = {
  id: string;
  project_id: string | null;
  job_id: string | null;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  error: string | null;
  provider_message_id: string | null;
  sent_at: string;
};

/**
 * Sends via Resend and records the attempt in email_logs, returning the inserted
 * row so callers (POST /api/v1/send) can hand back an id for status polling.
 */
export async function sendEmail({
  project,
  to,
  subject,
  html,
  text,
  type = null,
  jobId = null,
}: SendEmailInput): Promise<EmailLog> {
  const from = resolveFrom(type, project.app_name, project.sender_address);

  if (!html && !text) {
    throw new Error('At least one of html or text is required');
  }

  try {
    // Cast is safe: the check above guarantees at least one of html/text is
    // present, satisfying Resend's RequireAtLeastOne<html | text | react> type.
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html: html ?? undefined,
      text: text ?? undefined,
    } as Parameters<typeof resend.emails.send>[0]);

    if (result.error) {
      throw new Error(result.error.message);
    }

    const { data: log, error } = await supabaseAdmin
      .from('email_logs')
      .insert({
        project_id: project.id,
        job_id: jobId,
        recipient: to,
        subject,
        status: 'sent',
        provider_message_id: result.data?.id ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return log as EmailLog;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await supabaseAdmin.from('email_logs').insert({
      project_id: project.id,
      job_id: jobId,
      recipient: to,
      subject,
      status: 'failed',
      error: message,
    });

    throw new Error(message);
  }
}
