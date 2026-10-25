'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { LogoMark } from '@/components/Logo';
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
    <div className="flex min-h-screen flex-wrap bg-bg">
      <div className="flex min-w-0 flex-[1_1_480px] flex-col justify-between gap-12 border-b border-code-border bg-code-bg p-11 px-14 text-white">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="text-[19px] font-bold tracking-[-0.02em]">Send</span>
          <span className="mt-[3px] font-mono text-[11px] tracking-[.08em] text-[#A8B1BA]">BY UPLIFT</span>
        </Link>
        <div>
          <h2 className="mb-4 max-w-[440px] text-[40px] font-semibold leading-[1.1] tracking-[-0.03em]">
            Email infrastructure for every app you ship.
          </h2>
          <p className="max-w-[400px] text-base leading-[1.6] text-[#A8B1BA]">
            Access your Uplift projects, API keys, logs and scheduled sends.
          </p>
        </div>
        <pre className="max-w-[440px] whitespace-pre-wrap rounded-xl border border-code-border bg-black/40 px-5 py-[18px] font-mono text-[12.5px] leading-[1.75] text-code-text">
          <span className="text-[#8793A0]">POST</span> /api/v1/send{'\n'}
          <span className="text-[#8FB4FF]">&quot;status&quot;</span>: <span className="text-[#6FD6A0]">&quot;sent&quot;</span>
        </pre>
      </div>

      <div className="flex min-w-0 flex-[1_1_480px] items-center justify-center px-8 py-12">
        <div className="w-full max-w-[400px]">
          <h1 className="mb-2 text-[30px] font-semibold tracking-[-0.03em]">Sign in to Send</h1>
          <p className="mb-8 text-[15px] text-mute">Access your Uplift projects and API keys.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
            <div>
              <label htmlFor="email" className="mb-[7px] block text-[13.5px] font-semibold">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@useuplift.live"
                className="w-full rounded-[10px] border border-border bg-surface px-3.5 py-[13px] text-[15px] placeholder:text-mute/70 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-[7px] block text-[13.5px] font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-[10px] border border-border bg-surface px-3.5 py-[13px] text-[15px] placeholder:text-mute/70 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20"
              />
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-[10px] bg-error-soft px-[13px] py-[11px] text-[13.5px] font-medium text-error">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8V12.5" />
                  <path d="M12 16H12.01" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-[10px] bg-accent py-3.5 text-[15px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-[13.5px] text-mute">Don&apos;t have access? Contact an Uplift admin.</p>
        </div>
      </div>
    </div>
  );
}
