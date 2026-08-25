import { authenticateApiKey } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) return auth.error;
  const { project } = auth;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: 'Invalid job id', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { data: job, error } = await supabaseAdmin
    .from('email_jobs')
    .select('*')
    .eq('id', id)
    .eq('project_id', project.id)
    .maybeSingle();

  if (error) return Response.json({ error: error.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  if (!job) return Response.json({ error: 'Job not found', code: 'JOB_NOT_FOUND' }, { status: 404 });

  return Response.json({ success: true, data: { job } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) return auth.error;
  const { project } = auth;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: 'Invalid job id', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { data: job, error: fetchErr } = await supabaseAdmin
    .from('email_jobs')
    .select('id')
    .eq('id', id)
    .eq('project_id', project.id)
    .maybeSingle();

  if (fetchErr) return Response.json({ error: fetchErr.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  if (!job) return Response.json({ error: 'Job not found', code: 'JOB_NOT_FOUND' }, { status: 404 });

  const { error: delErr } = await supabaseAdmin.from('email_jobs').delete().eq('id', id);
  if (delErr) return Response.json({ error: delErr.message, code: 'INTERNAL_ERROR' }, { status: 500 });

  return Response.json({ success: true, data: { message: 'Job deleted', id } });
}
