import Link from 'next/link';
import { LogoMark } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="bg-bg">
      <header className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-8 py-[22px]">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="text-[19px] font-bold tracking-[-0.02em]">Send</span>
          <span className="mt-[3px] font-mono text-[11px] tracking-[.08em] text-mute">BY UPLIFT</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/docs" className="px-3.5 py-2.5 text-[14.5px] font-medium text-mute hover:text-ink">
            Docs
          </Link>
          <ThemeToggle />
          <Link href="/login" className="rounded-[10px] bg-ink px-[18px] py-2.5 text-[14.5px] font-semibold text-bg">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-14 px-8 pb-6 pt-[72px]">
        <div className="min-w-0 flex-[1_1_440px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-[11.5px] uppercase tracking-[.06em] text-mute">
            <span className="h-[7px] w-[7px] rounded-full bg-success" />
            Uplift internal tools
          </span>
          <h1 className="mb-5 mt-6 text-[62px] font-semibold leading-[1.02] tracking-[-0.035em]">
            Email infrastructure for every app you ship.
          </h1>
          <p className="mb-8 max-w-[520px] text-[18px] leading-[1.6] text-mute">
            One API to send transactional email, schedule recurring sends, and track delivery status — built for every
            product under the Uplift umbrella.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/docs" className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-[22px] py-3.5 text-[15px] font-semibold text-white hover:bg-accent-hover">
              Read the docs
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12H19" />
                <path d="M13 6L19 12L13 18" />
              </svg>
            </Link>
            <Link href="/login" className="rounded-[10px] border border-border bg-surface px-[22px] py-3.5 text-[15px] font-semibold hover:border-ink/30">
              Sign in
            </Link>
          </div>
        </div>

        <div className="min-w-0 flex-[1_1_480px] overflow-hidden rounded-2xl border border-code-border bg-code-bg shadow-[0_30px_60px_-30px_rgba(16,20,24,.45)]">
          <div className="flex items-center justify-between border-b border-code-border px-[18px] py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2B343E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#2B343E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#2B343E]" />
            </div>
            <span className="font-mono text-xs text-[#8793A0]">POST /api/v1/send</span>
            <span className="rounded-md bg-[#12301F] px-2 py-[3px] font-mono text-[11px] text-[#6FD6A0]">200 OK</span>
          </div>
          <pre className="whitespace-pre-wrap border-b border-code-border px-6 py-[22px] font-mono text-[13px] leading-[1.8] text-code-text">
            <span className="text-[#8793A0]">curl</span> https://send.useuplift.live/api/v1/send \{'\n'}
            {'  '}-H <span className="text-[#F0B27A]">&quot;Authorization: Bearer sbu_live_9f2c…&quot;</span> \{'\n'}
            {'  '}-H <span className="text-[#F0B27A]">&quot;Content-Type: application/json&quot;</span> \{'\n'}
            {'  '}-d <span className="text-[#F0B27A]">{`'{
    "to": "user@example.com",
    "subject": "Welcome to Aggregator",
    "html": "<p>You're in.</p>"
  }'`}</span>
          </pre>
          <pre className="whitespace-pre-wrap px-6 py-[22px] font-mono text-[13px] leading-[1.8] text-code-text">
            {'{\n  '}
            <span className="text-[#8FB4FF]">&quot;success&quot;</span>
            {': '}
            <span className="text-[#F0B27A]">true</span>
            {',\n  '}
            <span className="text-[#8FB4FF]">&quot;data&quot;</span>
            {': {\n    '}
            <span className="text-[#8FB4FF]">&quot;id&quot;</span>
            {': '}
            <span className="text-[#F0B27A]">&quot;3f2e1a9c…&quot;</span>
            {',\n    '}
            <span className="text-[#8FB4FF]">&quot;status&quot;</span>
            {': '}
            <span className="text-[#6FD6A0]">&quot;sent&quot;</span>
            {'\n  }\n}'}
          </pre>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-8 pt-[88px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          <FeatureCard
            n="01"
            title="Send in one request"
            body="POST a recipient, subject, and body. We handle delivery through Resend and log every attempt."
            icon={<path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />}
          />
          <FeatureCard
            n="02"
            title="Schedule recurring sends"
            body="Daily digests, weekly reports, monthly reminders — describe the cadence once, we handle the rest."
            icon={<><circle cx="12" cy="12" r="9" /><path d="M12 7V12L15.5 14" /></>}
          />
          <FeatureCard
            n="03"
            title="Track every send"
            body="Poll a send's status by id, or watch it live in the dashboard. Nothing goes out silently."
            icon={<><circle cx="12" cy="12" r="9" /><path d="M8 12.5L10.5 15L16 9" /></>}
          />
        </div>
      </section>

      <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-14 px-8 pt-28">
        <div className="min-w-0 flex-[1_1_400px]">
          <span className="font-mono text-xs uppercase tracking-[.08em] text-accent-text">Projects</span>
          <h2 className="mb-4 mt-3.5 text-[40px] font-semibold leading-[1.1] tracking-[-0.03em]">Every app gets its own project.</h2>
          <p className="mb-7 text-[16.5px] leading-[1.65] text-mute">
            Uplift, Portfolio Tracker, Aggregator Service — each one holds its own API key, scoped to its own sends and
            schedules.
          </p>
          <div className="flex flex-col gap-3.5">
            {['Scoped API keys per project', 'Revoke one key without touching another app', 'Logs and jobs, filtered per project'].map(
              (item) => (
                <div key={item} className="flex items-center gap-2.5 text-[15px]">
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="text-success">
                    <path d="M5 13L9 17L19 7" />
                  </svg>
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_440px] rounded-2xl border border-border bg-surface p-[22px] shadow-[0_20px_40px_-28px_rgba(16,20,24,.3)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-base font-semibold">Uplift</span>
            <span className="rounded-md bg-surface-alt px-[9px] py-[3px] font-mono text-[11.5px] text-mute">2 keys</span>
          </div>
          {['sbu_live_1a2b••••••••', 'sbu_live_7d9f••••••••'].map((key) => (
            <div key={key} className="mb-2 flex items-center justify-between rounded-[10px] border border-border bg-bg px-3.5 py-[13px] last:mb-0">
              <span className="font-mono text-[13px] text-mute">{key}</span>
              <span className="text-[13px] font-semibold text-error">Revoke</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-28 max-w-[1200px] px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[20px] border border-code-border bg-code-bg px-12 py-14">
          <div className="min-w-0 flex-[1_1_360px]">
            <h2 className="mb-2.5 text-[32px] font-semibold tracking-[-0.03em] text-white">Ready to send your first email?</h2>
            <p className="text-[15.5px] text-[#A8B1BA]">Sign in, create a project, copy a key. The docs take it from there.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="rounded-[10px] bg-white px-[22px] py-3.5 text-[15px] font-semibold text-[#101418]">
              Sign in
            </Link>
            <Link href="/docs" className="rounded-[10px] border border-[#3A444E] px-[22px] py-3.5 text-[15px] font-semibold text-white">
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-24 flex max-w-[1200px] flex-wrap items-center justify-between gap-4 border-t border-border px-8 pb-11 pt-7">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="text-[15px] font-bold tracking-[-0.01em]">Send by Uplift</span>
          <span className="text-[13.5px] text-mute">— internal service for Uplift products</span>
        </div>
        <div className="flex gap-6">
          <Link href="/docs" className="text-sm font-medium text-mute hover:text-ink">
            Docs
          </Link>
          <Link href="/login" className="text-sm font-medium text-mute hover:text-ink">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ n, title, body, icon }: { n: string; title: string; body: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-7">
      <div className="mb-10 flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
          <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </span>
        <span className="font-mono text-xs text-mute">{n}</span>
      </div>
      <h3 className="mb-2 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="text-[15px] leading-[1.6] text-mute">{body}</p>
    </div>
  );
}
