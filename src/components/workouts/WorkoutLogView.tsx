"use client";

import { useState } from 'react';
import { WorkoutForm } from '@/components/workouts/WorkoutForm';
import { WorkoutHistory } from '@/components/workouts/WorkoutHistory';

export function WorkoutLogView() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
        <WorkoutForm onSessionSaved={() => setRefreshToken((token) => token + 1)} />
      </div>
      <WorkoutHistory refreshToken={refreshToken} />
    </div>
  );
}
