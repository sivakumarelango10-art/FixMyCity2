'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { HandGrabbing, Spinner } from '@phosphor-icons/react';
import { workerClaimTask } from '@/actions/worker-complaints';

interface Props {
  complaintId: string;
}

export function ClaimButton({ complaintId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClaim = () => {
    startTransition(async () => {
      const res = await workerClaimTask({ complaintId });
      if (!res.success) {
        alert(res.error || 'Failed to claim task');
      } else {
        router.push(`/worker/tasks/${complaintId}`);
      }
    });
  };

  return (
    <button
      onClick={handleClaim}
      disabled={isPending}
      data-testid={`claim-task-btn-${complaintId}`}
      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
    >
      {isPending ? (
        <Spinner size={14} className="animate-spin" />
      ) : (
        <HandGrabbing size={14} weight="bold" />
      )}
      Claim Task
    </button>
  );
}
