"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export function RegeneratePlanButton({ className }: { className?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const response = await fetch('/api/ai/weekly-plan', { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error ?? 'Failed to regenerate plan');
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
          'inline-flex w-full items-center justify-center rounded-md border border-emerald-500 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50',
          isPending && 'opacity-70'
        )}
      >
        {isPending ? 'Generating...' : 'Regenerate plan'}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-600">New plan queued. Refreshing...</p> : null}
    </div>
  );
}
