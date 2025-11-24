"use client";

import { signOut } from 'next-auth/react';

export function AuthStatus({ email }: { email?: string | null }) {
  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
      <p className="text-sm font-semibold text-slate-900">{email}</p>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
      >
        Sign out
      </button>
    </div>
  );
}
