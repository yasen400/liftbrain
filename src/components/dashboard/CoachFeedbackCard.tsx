import { Card, CardHeader } from '@/components/ui/card';
import type { BodyCompSummary, ComplianceSummary } from '@/lib/dashboard';

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function CoachFeedbackCard({
  compliance,
  bodyComp,
}: {
  compliance: ComplianceSummary;
  bodyComp: BodyCompSummary;
}) {
  if (!compliance && !bodyComp) {
    return (
      <Card>
        <CardHeader title="Coach Feedback" description="Run the Phase 3 analyzers to see tailored guidance" />
        <p className="mt-4 text-sm text-gray-600">
          No compliance or body composition insights yet. Log a few sessions, add a progress check-in, then trigger the
          analyzers from the AI menu.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Coach Feedback" description="Synthesized signals from the last AI run" />
      <div className="mt-4 space-y-4">
        {compliance ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-700">Training compliance</p>
            <p className="text-sm text-gray-700">{compliance.training_summary}</p>
            <Section title="Issues" items={compliance.issues} />
            <Section
              title="Set adjustments"
              items={compliance.set_adjustments.map((item) => `${item.exercise}: ${item.adjustment}`)}
            />
            <Section title="Day reschedules" items={compliance.day_reschedules.map((item) => `${item.day}: ${item.recommendation}`)} />
            {compliance.recovery_notes ? (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-700">Recovery:</span> {compliance.recovery_notes}
              </p>
            ) : null}
          </div>
        ) : null}
        {bodyComp ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-amber-700">Body composition</p>
            <p className="text-sm text-gray-700">Trend: {bodyComp.trend}</p>
            <p className="text-sm text-gray-600">{bodyComp.weight_summary}</p>
            <Section title="Visual callouts" items={bodyComp.visual_callouts} />
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Macros:</span> Δ{bodyComp.macro_adjustments.calorie_delta} kcal · Protein{' '}
              {bodyComp.macro_adjustments.protein_g}g · Carbs {bodyComp.macro_adjustments.carbs_g}g · Fats{' '}
              {bodyComp.macro_adjustments.fats_g}g
            </p>
            <Section title="Next actions" items={bodyComp.next_actions} />
            {bodyComp.caution_notes ? (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-700">Caution:</span> {bodyComp.caution_notes}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
