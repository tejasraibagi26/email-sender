'use client';

import { useActionState, useState } from 'react';
import { createApiKey, type CreateKeyState } from '@/app/(dashboard)/dashboard/actions';

const initialState: CreateKeyState = { rawKey: null, error: null };

export function NewApiKeyButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = createApiKey.bind(null, projectId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [copied, setCopied] = useState(false);

  function close() {
    setOpen(false);
    setCopied(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-[18px] py-2.5 text-[13.5px] font-bold text-[#FBF3E7]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5V19" />
          <path d="M5 12H19" />
        </svg>
        New key
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45" onClick={() => !state.rawKey && close()}>
          <div onClick={(e) => e.stopPropagation()} className="w-[460px] rounded-2xl border border-border bg-surface p-7 shadow-2xl">
            {!state.rawKey ? (
              <form action={formAction}>
                <h2 className="mb-1 font-serif text-xl">New API key</h2>
                <p className="mb-5 text-[13.5px] text-ink/60">Name it after where it&apos;s used, e.g. &quot;Production&quot; or &quot;CI&quot;.</p>
                <input
                  name="name"
                  required
                  placeholder="Production"
                  className="mb-5 w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-[14.5px]"
                />
                {state.error && <p className="mb-4 text-[13px] text-error">{state.error}</p>}
                <div className="flex gap-2.5">
                  <button type="button" onClick={close} className="flex-1 rounded-lg border border-border py-2.5 text-[13.5px] font-semibold">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 rounded-lg bg-accent py-2.5 text-[13.5px] font-bold text-[#FBF3E7] disabled:opacity-60"
                  >
                    {pending ? 'Creating…' : 'Create key'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="mb-1.5 flex items-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D5B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 12.5L10.5 15L16 9" />
                  </svg>
                  <h2 className="font-serif text-xl">Key created</h2>
                </div>
                <p className="mb-[18px] text-[13.5px] text-ink/60">Copy this key now — for your security, it won&apos;t be shown again.</p>
                <div className="mb-[22px] flex items-center justify-between gap-3 rounded-[10px] border border-code-border bg-code-bg px-4 py-3.5">
                  <span className="break-all font-mono text-[12.5px] text-code-text">{state.rawKey}</span>
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(state.rawKey ?? '');
                      setCopied(true);
                    }}
                    className="flex-1 rounded-lg border border-border py-2.5 text-[13.5px] font-semibold"
                  >
                    {copied ? 'Copied' : 'Copy key'}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 rounded-lg bg-accent py-2.5 text-[13.5px] font-bold text-[#FBF3E7]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
