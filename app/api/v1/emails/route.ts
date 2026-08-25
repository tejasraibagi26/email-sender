import { authenticateApiKey } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) return auth.error;
  const { project } = auth;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const recipient = url.searchParams.get('recipient');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 25, 100);
  const offset = Number(url.searchParams.get('offset')) || 0;

  let query = supabaseAdmin
    .from('email_logs')
    .select('*')
    .eq('project_id', project.id)
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (recipient) query = query.ilike('recipient', `%${recipient}%`);

  const { data: emails, error } = await query;
  if (error) {
    return Response.json({ error: error.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }

  return Response.json({ success: true, data: { emails } });
}
