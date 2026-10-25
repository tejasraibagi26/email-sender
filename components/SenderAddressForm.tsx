'use client';

import { useActionState } from 'react';
import { updateSenderAddress, type UpdateSenderState } from '@/app/(dashboard)/dashboard/actions';
import { DOMAIN } from '@/lib/emailDomain';

const initialState: UpdateSenderState = { error: null, success: false };

export function SenderAddressForm({ projectId, senderAddress }: { projectId: string; senderAddress: string | null }) {
  const [state, formAction, pending] = useActionState(updateSenderAddress.bind(null, projectId), initialState);

  return (
    <form action={formAction} className="max-w-[640px] overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="px-7 pb-6 pt-7">
        <h2 className="mb-1.5 text-lg font-semibold tracking-[-0.02em]">Sender address</h2>
        <p className="mb-[22px] text-sm leading-[1.55] text-mute">
          Used as the default &quot;From&quot; address for this project&apos;s emails. Leave blank to use noreply@{DOMAIN}.
        </p>
        <label htmlFor="sender_address" className="mb-[7px] block text-[13.5px] font-semibold">
          Address
        </label>
        <div className="flex items-stretch overflow-hidden rounded-[10px] border border-border bg-surface focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/20">
          <input
            id="sender_address"
            name="sender_address"
            defaultValue={senderAddress ?? ''}
            placeholder="noreply"
            className="min-w-0 flex-1 bg-transparent px-3.5 py-[13px] font-mono text-[14.5px] focus:outline-none"
          />
          <span className="flex items-center whitespace-nowrap border-l border-border bg-bg px-3.5 font-mono text-[13.5px] text-mute">
            @{DOMAIN}
          </span>
        </div>

        {state.error && (
          <p role="alert" className="mt-4 rounded-[10px] bg-error-soft px-[13px] py-[11px] text-[13.5px] font-medium text-error">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="mt-4 rounded-[10px] bg-success-soft px-[13px] py-[11px] text-[13.5px] font-medium text-success">
            Saved.
          </p>
        )}
      </div>
      <div className="flex justify-end border-t border-border bg-bg px-7 py-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
