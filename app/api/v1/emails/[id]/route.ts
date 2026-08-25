import { authenticateApiKey } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) return auth.error;
  const { project } = auth;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: 'Invalid email id', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { data: email, error } = await supabaseAdmin
    .from('email_logs')
    .select('*')
    .eq('id', id)
    .eq('project_id', project.id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
  if (!email) {
    return Response.json({ error: 'Email not found', code: 'EMAIL_NOT_FOUND' }, { status: 404 });
  }

  return Response.json({ success: true, data: { email } });
}
