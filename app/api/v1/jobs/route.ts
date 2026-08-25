import { authenticateApiKey } from '@/lib/apiAuth';
import { computeNextRun, ScheduleValidationError, toCronExpression } from '@/lib/cron';
import { supabaseAdmin } from '@/lib/supabase/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) return auth.error;
  const { project } = auth;

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: 'Invalid JSON body', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { name, to, subject, html, text, body_text, cronExpression, frequency, time, day, metadata } = body;

  if (!name) return Response.json({ error: 'name is required', code: 'VALIDATION_ERROR' }, { status: 400 });
  if (!to || !EMAIL_RE.test(to)) {
    return Response.json({ error: 'Valid recipient email is required', code: 'VALIDATION_ERROR' }, { status: 400 });
  }
  if (!subject) return Response.json({ error: 'subject is required', code: 'VALIDATION_ERROR' }, { status: 400 });

  const isDigest = metadata?.type === 'digest';
  const bodyText = text || body_text;
  if (!isDigest && !html && !bodyText) {
    return Response.json(
      { error: 'At least one of html or text is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  let resolvedCron: string;
  try {
    if (cronExpression) {
      resolvedCron = toCronExpression(cronExpression);
    } else if (frequency) {
      resolvedCron = toCronExpression({ frequency, time, day });
    } else {
      return Response.json({ error: 'cronExpression or frequency is required', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof ScheduleValidationError) {
      return Response.json({ error: err.message, code: err.code }, { status: err.status });
    }
    throw err;
  }

  const nextRunAt = computeNextRun(resolvedCron);

  const { data: job, error } = await supabaseAdmin
    .from('email_jobs')
    .insert({
      project_id: project.id,
      name,
      app_name: project.app_name,
      recipient: to,
      subject,
      body_html: html || null,
      body_text: bodyText || null,
      cron_expression: resolvedCron,
      next_run_at: nextRunAt,
      metadata: metadata ?? null,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }

  return Response.json({ success: true, data: { job } }, { status: 201 });
}

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) return auth.error;
  const { project } = auth;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let query = supabaseAdmin
    .from('email_jobs')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data: jobs, error } = await query;
  if (error) {
    return Response.json({ error: error.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }

  return Response.json({ success: true, data: { jobs } });
}
