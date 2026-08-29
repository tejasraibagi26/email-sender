import { createHash, randomBytes } from 'crypto';
import { supabaseAdmin } from './supabase/admin';

const KEY_PREFIX = 'sbu_live_';

export function generateApiKey() {
  const raw = `${KEY_PREFIX}${randomBytes(24).toString('hex')}`;
  const hash = hashApiKey(raw);
  const displayPrefix = raw.slice(0, KEY_PREFIX.length + 8);
  return { raw, hash, displayPrefix };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export type AuthenticatedProject = {
  id: string;
  name: string;
  app_name: string;
  sender_address: string | null;
};

type AuthResult = { project: AuthenticatedProject } | { error: Response };

export async function authenticateApiKey(request: Request): Promise<AuthResult> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token || !token.startsWith(KEY_PREFIX)) {
    return { error: unauthorized() };
  }

  const hash = hashApiKey(token);

  const { data: key, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, revoked_at, projects(id, name, app_name, sender_address)')
    .eq('key_hash', hash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !key) {
    return { error: unauthorized() };
  }

  const projectRow = Array.isArray(key.projects) ? key.projects[0] : key.projects;
  if (!projectRow) {
    return { error: unauthorized() };
  }

  void supabaseAdmin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id);

  return { project: projectRow as AuthenticatedProject };
}

function unauthorized() {
  return Response.json({ error: 'Unauthorized', code: 'INVALID_API_KEY' }, { status: 401 });
}
