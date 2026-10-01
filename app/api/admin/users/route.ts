import { randomBytes, timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Admin-only: create a dashboard account. Public sign-up stays disabled in
// Supabase; this route uses the service-role client, which bypasses that.
export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: 'Unauthorized', code: 'INVALID_ADMIN_KEY' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: 'Invalid JSON body', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: 'Valid email is required', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  // Use the given password, or generate one and return it (shown once)
  const generated = body.password === undefined;
  const password: string = generated ? randomBytes(12).toString('base64url') : String(body.password);
  if (password.length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      { error: `password must be at least ${MIN_PASSWORD_LENGTH} characters`, code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    if (error?.code === 'email_exists') {
      return Response.json({ error: 'A user with this email already exists', code: 'USER_EXISTS' }, { status: 409 });
    }
    return Response.json({ error: error?.message ?? 'Could not create user', code: 'INTERNAL_ERROR' }, { status: 500 });
  }

  return Response.json(
    {
      success: true,
      data: {
        id: data.user.id,
        email: data.user.email,
        ...(generated && { password }),
      },
    },
    { status: 201 },
  );
}

function isAdmin(request: Request): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false; // route is disabled until the key is configured

  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
