import { Card, CardHeader } from '@/components/ui/card';
import type { WeeklyPlanSummary } from '@/lib/dashboard';
import { RegeneratePlanButton } from './RegeneratePlanButton';

export function MealPlanCard({ plan }: { plan: WeeklyPlanSummary }) {
  return (
    <Card>
      <CardHeader title="Meal Plan" description={plan ? plan.payload.coaching_focus : 'Generate a 7-day macro outline'} />
      {plan ? (
        <div className="mt-4 space-y-4">
          {plan.payload.meal_plan.map((day) => (
            <div key={day.day} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">{day.day}</p>
                <p className="text-sm text-gray-600">{day.calories} kcal</p>
              </div>
              <p className="text-xs text-gray-500">
                Protein {day.macros.protein_g}g · Carbs {day.macros.carbs_g}g · Fats {day.macros.fats_g}g
              </p>
              <p className="mt-2 text-sm text-gray-700">{day.recipe_idea}</p>
            </div>
          ))}
          <RegeneratePlanButton />
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <p>Meal plan not generated yet.</p>
          <RegeneratePlanButton />
        </div>
      )}
    </Card>
  );
}
