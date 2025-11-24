import { WorkoutLogView } from '@/components/workouts/WorkoutLogView';

export default function WorkoutsPage() {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Sessions</p>
        <h1 className="text-3xl font-semibold text-gray-900">Log a workout</h1>
        <p className="text-gray-600">Capture sets, loads, RPE, and notes for each workout, then review your latest sessions.</p>
      </header>
      <WorkoutLogView />
    </section>
  );
}
