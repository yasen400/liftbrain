import { Card, CardHeader } from '@/components/ui/card';
import type { WeeklyPlanSummary } from '@/lib/dashboard';
import { buildIcsForWeeklyPlan } from '@/lib/weeklyPlans';
import { ApplyPlanButton } from './ApplyPlanButton';

export function WeeklyScheduleCard({ plan }: { plan: WeeklyPlanSummary }) {
  if (!plan) {
    return (
      <Card>
        <CardHeader title="AI Schedule" description="Generate a plan to see each day's focus" />
        <p className="mt-4 text-sm text-gray-600">No plan available yet. Generate one from the Meal Plan card to unlock scheduling tools.</p>
      </Card>
    );
  }

  const ics = buildIcsForWeeklyPlan(plan.payload, plan.weekOf);
  const downloadHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;

  return (
    <Card>
      <CardHeader title="AI Schedule" description={`Week of ${plan.weekLabel}`} />
      <div className="mt-4 space-y-4">
        {plan.payload.workout_schedule.map((day) => (
          <div key={day.day} className="rounded-lg border border-gray-100 p-3">
            <p className="text-sm font-semibold text-gray-800">{day.day}</p>
            <p className="text-xs uppercase tracking-wide text-gray-500">{day.focus}</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {day.key_lifts.map((lift) => (
                <li key={`${day.day}-${lift.name}`}>
                  {lift.name} · {lift.sets}x{lift.reps}{lift.target_rpe ? ` @ RPE ${lift.target_rpe}` : ''}
                </li>
              ))}
            </ul>
            {day.accessory_focus ? <p className="mt-1 text-xs text-gray-500">Accessory: {day.accessory_focus}</p> : null}
          </div>
        ))}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <a
            href={downloadHref}
            download={`liftbrain-week-${plan.weekLabel}.ics`}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Download calendar (.ics)
          </a>
          {!plan.applied ? <ApplyPlanButton planId={plan.id} className="flex-1" /> : null}
        </div>
        {plan.applied ? <p className="text-xs text-emerald-600">Plan already applied to your workout templates.</p> : null}
      </div>
    </Card>
  );
}
