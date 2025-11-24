"use client";

import { useEffect, useState } from 'react';
import { formatISO } from 'date-fns';
import { WorkoutSessionInput } from '@/lib/validators';

type WorkoutSetFormState = Omit<WorkoutSessionInput['sets'][number], 'weightKg' | 'rpe'> & {
  weightKg: number;
  rpe: number;
};

interface ExerciseOption {
  id: string;
  name: string;
  primaryMuscle: string;
}

interface WorkoutFormProps {
  onSessionSaved?: () => void;
}

const todayDate = () => formatISO(new Date(), { representation: 'date' });

const createDefaultSet = (exerciseId = '', setNumber = 1): WorkoutSetFormState => ({
  exerciseId,
  setNumber,
  reps: 8,
  weightKg: 60,
  rpe: 8,
});

export function WorkoutForm({ onSessionSaved }: WorkoutFormProps) {
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState(todayDate());
  const [sets, setSets] = useState<WorkoutSetFormState[]>([createDefaultSet()]);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadExercises() {
      try {
        const response = await fetch('/api/exercises');
        if (!response.ok) {
          throw new Error('Failed to load exercises');
        }
        const data = await response.json();
        setExercises(data.exercises ?? []);
        setExerciseError(null);
      } catch (error) {
        console.error(error);
        setExerciseError('Unable to load exercise list. Try refreshing the page.');
      } finally {
        setIsLoadingExercises(false);
      }
    }
    loadExercises();
  }, []);

  useEffect(() => {
    if (!exercises.length) return;
    setSets((prev) => prev.map((set) => (set.exerciseId ? set : { ...set, exerciseId: exercises[0]?.id ?? '' })));
  }, [exercises]);

  function updateSet<T extends keyof WorkoutSetFormState>(index: number, field: T, value: WorkoutSetFormState[T]) {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as WorkoutSetFormState;
      return next;
    });
  }

  function addSet() {
    setSets((prev) => [...prev, createDefaultSet(exercises[0]?.id ?? '', prev.length + 1)]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!exercises.length) {
      setFormMessage({ type: 'error', text: 'Load exercises before saving.' });
      return;
    }
    if (sets.some((set) => !set.exerciseId)) {
      setFormMessage({ type: 'error', text: 'Select an exercise for every set.' });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: WorkoutSessionInput = {
      sessionDate: sessionDate ? new Date(sessionDate).toISOString() : formatISO(new Date()),
      durationMinutes: Number(formData.get('durationMinutes')) || undefined,
      perceivedDifficulty: Number(formData.get('perceivedDifficulty')) || undefined,
      notes: formData.get('notes')?.toString(),
      sets: sets.map((set) => ({
        ...set,
        exerciseId: set.exerciseId,
      })),
    };

    const response = await fetch('/api/workout-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      form.reset();
      setSessionDate(todayDate());
      setSets([createDefaultSet(exercises[0]?.id ?? '')]);
      setFormMessage({ type: 'success', text: 'Workout logged.' });
      onSessionSaved?.();
    } else {
      const body = await response.json();
      setFormMessage({ type: 'error', text: body.error ?? 'Failed to save.' });
    }

    setIsSubmitting(false);
  }

  const canSubmit =
    isSubmitting ||
    !exercises.length ||
    sets.some((set) => set.setNumber <= 0 || set.reps <= 0 || set.weightKg < 0 || set.rpe < 1 || set.rpe > 10 || !set.exerciseId);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Date
          <input
            type="date"
            name="sessionDate"
            value={sessionDate}
            onChange={(event) => setSessionDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Duration (min)
          <input type="number" name="durationMinutes" min={0} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-700">
        Perceived difficulty (1-10)
        <input type="number" name="perceivedDifficulty" min={1} max={10} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Notes
        <textarea name="notes" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} />
      </label>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Sets</p>
          {exerciseError ? <span className="text-xs text-red-600">{exerciseError}</span> : null}
        </div>
        {sets.map((set, index) => (
          <div key={`${set.setNumber}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-5">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={set.exerciseId}
              onChange={(event) => updateSet(index, 'exerciseId', event.target.value)}
              disabled={isLoadingExercises || !exercises.length}
              required
            >
              <option value="">{isLoadingExercises ? 'Loading exercises...' : 'Select exercise'}</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={set.setNumber}
              onChange={(event) => updateSet(index, 'setNumber', Number(event.target.value))}
            />
            <input
              type="number"
              min={1}
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={set.reps}
              onChange={(event) => updateSet(index, 'reps', Number(event.target.value))}
            />
            <input
              type="number"
              min={0}
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={set.weightKg}
              onChange={(event) => updateSet(index, 'weightKg', Number(event.target.value))}
            />
            <input
              type="number"
              min={1}
              max={10}
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={set.rpe}
              onChange={(event) => updateSet(index, 'rpe', Number(event.target.value))}
            />
          </div>
        ))}
        <button
          type="button"
          className="rounded-lg border border-dashed border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-700"
          onClick={addSet}
          disabled={isLoadingExercises || !exercises.length}
        >
          + Add set
        </button>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={canSubmit}
      >
        {isSubmitting ? 'Saving...' : 'Save session'}
      </button>
      {formMessage ? (
        <p className={`text-sm ${formMessage.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`} aria-live="polite">
          {formMessage.text}
        </p>
      ) : null}
    </form>
  );
}
