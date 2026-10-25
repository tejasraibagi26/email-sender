import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/Logo';
import { SidebarNav } from '@/components/SidebarNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/server';
import { signOut } from './dashboard/actions';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const email = user.email ?? '';
  const initials = (email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-wrap bg-bg md:h-screen md:overflow-hidden">
      <aside className="flex min-h-[420px] flex-[0_0_248px] flex-col md:sticky md:top-0 md:h-screen md:self-start md:overflow-y-auto justify-between gap-7 border-r border-border bg-surface px-4 py-6 max-md:min-h-0 max-md:flex-[1_1_100%] max-md:border-b max-md:border-r-0">
        <div className="flex flex-col gap-7">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
            <LogoMark size={30} />
            <span className="text-lg font-bold tracking-[-0.02em]">Send</span>
          </Link>
          <SidebarNav />
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 rounded-[10px] border border-border p-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12.5px] font-bold text-accent-text">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{email}</span>
              <form action={signOut}>
                <button type="submit" className="text-xs text-mute hover:text-ink">
                  Sign out
                </button>
              </form>
            </span>
          </div>
          <ThemeToggle className="w-full" />
        </div>
      </aside>
      <main className="min-w-0 flex-[999_1_560px] md:h-screen md:overflow-y-auto">{children}</main>
    </div>
  );
}
