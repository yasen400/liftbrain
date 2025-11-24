"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        experienceLevel: data.experienceLevel,
        equipmentProfile: data.equipmentProfile,
        goalFocus: data.goalFocus,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? 'Registration failed');
      return;
    }

    setSuccess(true);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {success ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
          Account created. You can sign in now.
        </p>
      ) : null}
      <div>
        <label className="text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Experience level</label>
        <select name="experienceLevel" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Equipment</label>
        <select name="equipmentProfile" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
          <option value="FULL_GYM">Full gym</option>
          <option value="BARBELL_ONLY">Barbell only</option>
          <option value="DUMBBELLS_ONLY">Dumbbells only</option>
          <option value="HOME_MINIMAL">Home / minimal</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Primary goal</label>
        <select name="goalFocus" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
          <option value="HYPERTROPHY">Build muscle</option>
          <option value="STRENGTH">Strength / PRs</option>
          <option value="FAT_LOSS">Cut / fat loss</option>
          <option value="POWERBUILDING">Powerbuilding</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
        disabled={loading}
      >
        {loading ? 'Creating…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-emerald-600">
          Sign in
        </Link>
      </p>
    </form>
  );
}
