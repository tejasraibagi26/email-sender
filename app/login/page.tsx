'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setPending(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'radial-gradient(ellipse 900px 500px at 50% 0%, rgba(193,87,31,0.07), transparent 70%), #F6F1E7' }}
    >
      <div className="w-[380px]">
        <div className="mb-[34px] flex flex-col items-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBF3E7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
          <h1 className="mb-1.5 font-serif text-[26px] italic">Sign in to Send</h1>
          <p className="text-center text-sm text-ink/60">Access your Uplift projects and API keys.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-8 shadow-[0_18px_50px_-22px_rgba(28,23,18,.18)]">
          <div className="mb-[18px]">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink/70">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@useuplift.live"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-[14.5px]"
            />
          </div>
          <div className="mb-2.5">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink/70">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-[14.5px]"
            />
          </div>

          {error && <p className="mb-3 text-[13px] text-error">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-[18px] w-full rounded-lg bg-accent py-3.5 text-[14.5px] font-bold text-[#FBF3E7] disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-[22px] text-center text-[13px] text-ink/40">Don&apos;t have access? Contact an Uplift admin.</p>
      </div>
    </div>
  );
}
