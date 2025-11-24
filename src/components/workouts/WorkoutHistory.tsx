"use client";

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';

interface WorkoutSetEntry {
  id: string;
  reps: number;
  weightKg: number | null;
  rpe: number | null;
}

interface WorkoutSessionSummary {
  id: string;
  sessionDate: string;
  durationMinutes: number | null;
  perceivedDifficulty: number | null;
  setEntries: WorkoutSetEntry[];
  notes: string | null;
}

interface WorkoutHistoryProps {
  refreshToken: number;
}

export function WorkoutHistory({ refreshToken }: WorkoutHistoryProps) {
  const [sessions, setSessions] = useState<WorkoutSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const loadSessions = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/workout-sessions', { signal });
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }
      const data = await response.json();
      setSessions(data.sessions ?? []);
      setError(null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error(err);
      setError('Unable to load recent workouts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadSessions(controller.signal);
    return () => controller.abort();
  }, [loadSessions, refreshToken, reloadCount]);

  const recentSessions = sessions.slice(0, 5);

  function formatVolume(session: WorkoutSessionSummary) {
    const volume = session.setEntries.reduce((total, set) => {
      if (!set.weightKg) {
        return total;
      }
      return total + set.weightKg * (set.reps ?? 0);
    }, 0);
    if (volume === 0) {
      return '–';
    }
    return `${volume.toFixed(0)} kg`; // Light UX cue for cumulative load
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-600">Recent</p>
          <h2 className="text-lg font-semibold text-slate-900">Last 5 sessions</h2>
        </div>
        <button
          type="button"
          onClick={() => setReloadCount((count) => count + 1)}
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-500"
          disabled={isLoading}
        >
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </header>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!error && recentSessions.length === 0 && !isLoading ? (
        <p className="text-sm text-slate-500">No workouts logged yet. Your next session will appear here.</p>
      ) : null}
      <ul className="space-y-3">
        {recentSessions.map((session) => (
          <li key={session.id} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-900">{format(new Date(session.sessionDate), 'MMM d, yyyy')}</p>
                <p className="text-xs text-slate-500">
                  {session.setEntries.length} set{session.setEntries.length === 1 ? '' : 's'} · Volume {formatVolume(session)}
                </p>
              </div>
              {session.perceivedDifficulty ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  RPE {session.perceivedDifficulty}
                </span>
              ) : null}
            </div>
            {session.notes ? <p className="mt-2 text-xs text-slate-600">{session.notes}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
