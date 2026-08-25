import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const initials = (user.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-border px-10">
        <div className="flex items-center gap-10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-accent">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBF3E7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </span>
            <span className="font-serif text-lg italic">Send</span>
          </Link>
          <nav className="flex gap-7">
            <Link href="/dashboard" className="border-b-2 border-accent pb-2 text-[13.5px] font-semibold text-ink">
              Dashboard
            </Link>
            <Link href="/docs" className="pb-2 text-[13.5px] font-semibold text-ink/60 hover:text-ink">
              Docs
            </Link>
          </nav>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[12.5px] font-bold text-accent">
          {initials}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
