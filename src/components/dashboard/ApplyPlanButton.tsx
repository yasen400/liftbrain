"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export function ApplyPlanButton({ planId, className }: { planId: string; className?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    if (!planId) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const response = await fetch(`/api/weekly-plan/${planId}/apply`, { method: 'PATCH' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error ?? 'Failed to apply plan');
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={clsx(
          'inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700',
          isPending && 'opacity-70'
        )}
      >
        {isPending ? 'Applying...' : 'Apply plan to workouts'}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-600">Plan applied. Templates updated.</p> : null}
    </div>
  );
}
