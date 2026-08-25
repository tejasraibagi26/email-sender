import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-bg">
      <header className="flex h-[76px] items-center justify-between border-b border-border px-16">
        <div className="flex items-center gap-3">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBF3E7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </span>
          <span className="flex flex-col leading-[1.05]">
            <span className="font-serif text-[21px] italic">Send</span>
            <span className="font-mono text-[9.5px] tracking-[.12em] text-ink/40">BY UPLIFT</span>
          </span>
        </div>
        <div className="flex items-center gap-7">
          <Link href="/docs" className="text-[14.5px] font-semibold text-ink/60 hover:text-ink">
            Docs
          </Link>
          <Link href="/login" className="rounded-lg border border-border px-[18px] py-[9px] text-sm font-semibold hover:border-ink/30">
            Sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[700px] px-8 pt-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-3.5 py-1.5 font-mono text-[11.5px] uppercase tracking-[.07em] text-ink/40">
          Uplift internal tools
        </span>
        <h1 className="mt-[26px] mb-[22px] text-[60px] leading-[1.08] tracking-[-0.01em]">
          Email infrastructure
          <br />
          for every app you ship.
        </h1>
        <p className="mx-auto mb-9 max-w-[560px] text-[18.5px] leading-[1.62] text-ink/60">
          One API to send transactional email, schedule recurring sends, and track delivery status — built for every
          product under the Uplift umbrella.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/docs" className="inline-flex items-center gap-2 rounded-lg bg-accent px-[22px] py-[13px] text-[15px] font-bold text-[#FBF3E7]">
            Read the docs
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12H19" />
              <path d="M13 6L19 12L13 18" />
            </svg>
          </Link>
          <Link href="/login" className="rounded-lg border border-border px-[22px] py-[13px] text-[15px] font-bold">
            Sign in
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-[76px] max-w-[1120px] px-8">
        <div className="overflow-hidden rounded-2xl border border-code-border bg-code-bg shadow-[0_24px_60px_-24px_rgba(28,23,18,.35)]">
          <div className="flex items-center gap-2 border-b border-code-border px-5 py-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4A3D2C]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#4A3D2C]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#4A3D2C]" />
            <span className="ml-2 font-mono text-xs text-[#8A7A62]">send.sh</span>
          </div>
          <div className="grid grid-cols-2">
            <div className="border-r border-code-border px-[26px] py-6">
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-[1.85] text-code-text">
                <span className="text-[#8A7A62]">curl</span> https://send.useuplift.live/api/v1/send \{'\n'}
                {'  '}-H <span className="text-[#E39A5E]">&quot;Authorization: Bearer sbu_live_9f2c…&quot;</span> \{'\n'}
                {'  '}-H <span className="text-[#E39A5E]">&quot;Content-Type: application/json&quot;</span> \{'\n'}
                {'  '}-d <span className="text-[#E39A5E]">{`'{
    "to": "user@example.com",
    "subject": "Welcome to Aggregator",
    "html": "<p>You're in.</p>"
  }'`}</span>
              </pre>
            </div>
            <div className="px-[26px] py-6">
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-[1.85] text-code-text">
                {'{\n  '}
                <span className="text-[#8FB8A0]">&quot;success&quot;</span>
                {': '}
                <span className="text-[#E39A5E]">true</span>
                {',\n  '}
                <span className="text-[#8FB8A0]">&quot;data&quot;</span>
                {': {\n    '}
                <span className="text-[#8FB8A0]">&quot;id&quot;</span>
                {': '}
                <span className="text-[#E39A5E]">&quot;3f2e1a9c…&quot;</span>
                {',\n    '}
                <span className="text-[#8FB8A0]">&quot;status&quot;</span>
                {': '}
                <span className="text-[#8FB8A0]">&quot;sent&quot;</span>
                {'\n  }\n}'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-[120px] grid max-w-[1120px] grid-cols-3 gap-[22px] px-8">
        <FeatureCard
          title="Send in one request"
          body="POST a recipient, subject, and body. We handle delivery through Resend and log every attempt."
          icon={
            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
          }
        />
        <FeatureCard
          title="Schedule recurring sends"
          body="Daily digests, weekly reports, monthly reminders — describe the cadence once, we handle the rest."
          icon={<><circle cx="12" cy="12" r="9" /><path d="M12 7V12L15.5 14" /></>}
        />
        <FeatureCard
          title="Track every send"
          body="Poll a send's status by id, or watch it live in the dashboard. Nothing goes out silently."
          icon={<><circle cx="12" cy="12" r="9" /><path d="M8 12.5L10.5 15L16 9" /></>}
        />
      </div>

      <div className="mx-auto mt-32 grid max-w-[1120px] grid-cols-2 items-center gap-16 px-8">
        <div>
          <h2 className="mb-[18px] font-serif text-[34px] italic leading-[1.2]">Every app gets its own project.</h2>
          <p className="mb-[22px] text-[15.5px] leading-[1.65] text-ink/60">
            Uplift, Portfolio Tracker, Aggregator Service — each one holds its own API key, scoped to its own sends
            and schedules.
          </p>
          <div className="flex flex-col gap-3.5">
            {['Scoped API keys per project', 'Revoke one key without touching another app', 'Logs and jobs, filtered per project'].map(
              (item) => (
                <div key={item} className="flex items-center gap-2.5 text-[14.5px]">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E7D5B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13L9 17L19 7" />
                  </svg>
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
        <div className="rounded-[14px] border border-border bg-surface p-[22px]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[15px] font-bold">Uplift</span>
            <span className="rounded-md border border-border bg-surface-alt px-2 py-0.5 font-mono text-[11px] text-ink/40">3 keys</span>
          </div>
          {['sbu_live_1a2b••••••••', 'sbu_live_7d9f••••••••'].map((key) => (
            <div key={key} className="mb-2 flex items-center justify-between rounded-[9px] border border-border bg-surface-alt px-3.5 py-3 last:mb-0">
              <span className="font-mono text-[13px] text-ink/60">{key}</span>
              <span className="text-[12.5px] font-semibold text-error">Revoke</span>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-[150px] flex items-center justify-between border-t border-border px-16 py-9 pb-11">
        <div className="flex items-center gap-2.5">
          <span className="font-serif text-base italic">Send by Uplift</span>
          <span className="text-[13px] text-ink/40">— internal service for Uplift products</span>
        </div>
        <div className="flex gap-6">
          <Link href="/docs" className="text-[13.5px] font-semibold text-ink/60">
            Docs
          </Link>
          <Link href="/login" className="text-[13.5px] font-semibold text-ink/60">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-border bg-surface p-7">
      <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-accent-soft">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C1571F" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <h3 className="mt-[18px] mb-2 font-serif text-[19px] italic">{title}</h3>
      <p className="text-[14.5px] leading-[1.6] text-ink/60">{body}</p>
    </div>
  );
}
