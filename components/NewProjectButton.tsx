'use client';

import { useActionState, useState } from 'react';
import { createProject, type CreateProjectState } from '@/app/(dashboard)/dashboard/actions';

const initialState: CreateProjectState = { error: null };

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createProject, initialState);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-[18px] py-2.5 text-[13.5px] font-bold text-[#FBF3E7]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5V19" />
          <path d="M5 12H19" />
        </svg>
        New project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45" onClick={() => setOpen(false)}>
          <form
            action={formAction}
            onClick={(e) => e.stopPropagation()}
            className="w-[420px] rounded-2xl border border-border bg-surface p-7 shadow-2xl"
          >
            <h2 className="mb-1 font-serif text-xl">New project</h2>
            <p className="mb-5 text-[13.5px] text-ink/60">Each project gets its own API keys, logs, and jobs.</p>

            <label className="mb-1.5 block text-[13px] font-semibold text-ink/70">Project name</label>
            <input
              name="name"
              required
              placeholder="Portfolio Tracker"
              className="mb-4 w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-[14.5px]"
            />

            <label className="mb-1.5 block text-[13px] font-semibold text-ink/70">Sends as</label>
            <input
              name="app_name"
              required
              placeholder="Portfolio Tracker"
              className="mb-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-[14.5px]"
            />
            <p className="mb-5 text-[12px] text-ink/40">Shown in the &quot;From&quot; name on every email this project sends.</p>

            {state.error && <p className="mb-4 text-[13px] text-error">{state.error}</p>}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-[13.5px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-lg bg-accent py-2.5 text-[13.5px] font-bold text-[#FBF3E7] disabled:opacity-60"
              >
                {pending ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
