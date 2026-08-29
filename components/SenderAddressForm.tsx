'use client';

import { useActionState } from 'react';
import { updateSenderAddress, type UpdateSenderState } from '@/app/(dashboard)/dashboard/actions';
import { DOMAIN } from '@/lib/mailer';

const initialState: UpdateSenderState = { error: null, success: false };

export function SenderAddressForm({ projectId, senderAddress }: { projectId: string; senderAddress: string | null }) {
  const [state, formAction, pending] = useActionState(updateSenderAddress.bind(null, projectId), initialState);

  return (
    <form action={formAction} className="max-w-[420px]">
      <label className="mb-1.5 block text-[13px] font-semibold text-ink/70">Sender address</label>
      <div className="mb-1.5 flex items-center overflow-hidden rounded-lg border border-border bg-surface">
        <input
          name="sender_address"
          defaultValue={senderAddress ?? ''}
          placeholder="noreply"
          className="min-w-0 flex-1 px-3.5 py-3 text-[14.5px]"
        />
        <span className="whitespace-nowrap px-3.5 text-[13.5px] text-ink/40">@{DOMAIN}</span>
      </div>
      <p className="mb-4 text-[12px] text-ink/40">
        Used as the default &quot;From&quot; address for this project&apos;s emails. Leave blank to use noreply@{DOMAIN}.
      </p>

      {state.error && <p className="mb-4 text-[13px] text-error">{state.error}</p>}
      {state.success && <p className="mb-4 text-[13px] text-success">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-[18px] py-2.5 text-[13.5px] font-bold text-[#FBF3E7] disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
