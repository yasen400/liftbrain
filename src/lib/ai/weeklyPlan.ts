import { addDays, startOfWeek } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { callOpenAI } from './client';
import { WeeklyPlanPayload, WeeklyPlanSchema } from './schemas';
import { buildWeeklyPlanPrompt, WeeklyPlanPromptContext } from './prompts';
import { runComplianceAnalysis } from './compliance';
import { runBodyCompEvaluation } from './bodyComp';

const WEEKLY_PLAN_SCHEMA_EXAMPLE = JSON.stringify(
  {
    week_label: 'Week of Jan 13',
    coaching_focus: 'Hold pressing volume steady, push lower-body density, tighten macros +150 kcal on rest days.',
    workout_schedule: [
      {
        day: 'Monday - Upper Power',
        focus: 'Bench priority with accessory shoulders',
        key_lifts: [
          { name: 'Barbell Bench Press', sets: 5, reps: '4-6', target_rpe: 8, notes: 'Add 2-sec pause on first rep' },
          { name: 'Weighted Pull-up', sets: 4, reps: '5-6', target_rpe: 8 },
        ],
        accessory_focus: 'Cable fly cluster, rear delt swings',
        recovery_focus: 'Post-session breathing drills',
      },
    ],
    meal_plan: [
      {
        day: 'Monday',
        calories: 2700,
        macros: { protein_g: 190, carbs_g: 300, fats_g: 70 },
        recipe_idea: 'Turkey pesto pasta + berry yogurt bowl',
      },
    ],
    accountability_notes: 'Send midweek photo if weight drops >0.8kg.',
  },
  null,
  2,
);

export async function generateWeeklyPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      goalFocus: true,
      scheduleWorkoutsPerWeek: true,
      scheduleMinutesPerSession: true,
      equipmentProfile: true,
    },
  });

  if (!user) {
    throw new Error('User not found for weekly plan generation.');
  }

  const [{ report: complianceReport }, { insight: bodyCompInsight }] = await Promise.all([
    runComplianceAnalysis(userId),
    runBodyCompEvaluation(userId),
  ]);

  const ctx: WeeklyPlanPromptContext = {
    user: {
      name: user.email,
      goalFocus: user.goalFocus,
      scheduleWorkoutsPerWeek: user.scheduleWorkoutsPerWeek,
      minutesPerSession: user.scheduleMinutesPerSession,
      equipmentProfile: user.equipmentProfile,
    },
    compliance: {
      trainingSummary: complianceReport.training_summary,
      issues: complianceReport.issues,
      setAdjustments: complianceReport.set_adjustments.map(
        (adjustment) => `${adjustment.exercise}: ${adjustment.adjustment} (${adjustment.rationale})`,
      ),
      dayReschedules: complianceReport.day_reschedules.map(
        (item) => `${item.day}: ${item.recommendation}`,
      ),
      recoveryNotes: complianceReport.recovery_notes,
    },
    bodyComp: {
      trend: bodyCompInsight.trend,
      weightSummary: bodyCompInsight.weight_summary,
      macroAdjustmentSummary: `Calories ${bodyCompInsight.macro_adjustments.calorie_delta >= 0 ? '+' : ''}${bodyCompInsight.macro_adjustments.calorie_delta} vs current; Protein ${bodyCompInsight.macro_adjustments.protein_g}g / Carbs ${bodyCompInsight.macro_adjustments.carbs_g}g / Fats ${bodyCompInsight.macro_adjustments.fats_g}g`,
      nextActions: bodyCompInsight.next_actions,
      cautionNotes: bodyCompInsight.caution_notes,
    },
  };

  const prompt = buildWeeklyPlanPrompt(ctx, WEEKLY_PLAN_SCHEMA_EXAMPLE);
  const plan = await callOpenAI<WeeklyPlanPayload>({
    prompt,
    schema: WeeklyPlanSchema,
    model: process.env.AI_WEEKLY_PLAN_MODEL ?? 'gpt-4.1',
  });

  const targetWeek = startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 });

  const { recommendation, weeklyPlan } = await prisma.$transaction(async (tx) => {
    const recommendationRecord = await tx.aiRecommendation.create({
      data: {
        userId,
        type: 'WEEKLY_PLAN',
        promptSnapshot: prompt,
        responsePayload: JSON.stringify(plan),
      },
    });

    const weeklyPlanRecord = await tx.weeklyPlan.create({
      data: {
        userId,
        weekOf: targetWeek,
        workoutPlanJson: JSON.stringify(plan.workout_schedule),
        mealPlanJson: JSON.stringify(plan.meal_plan),
        aiRecommendationId: recommendationRecord.id,
      },
    });

    if (plan.meal_plan.length) {
      await Promise.all(
        plan.meal_plan.map((meal, index) =>
          tx.mealPrep.create({
            data: {
              weeklyPlanId: weeklyPlanRecord.id,
              dayIndex: index,
              mealsJson: JSON.stringify({ recipeIdea: meal.recipe_idea }),
              dailyCalories: meal.calories,
              macrosJson: JSON.stringify(meal.macros),
            },
          }),
        ),
      );
    }

    return { recommendation: recommendationRecord, weeklyPlan: weeklyPlanRecord };
  });

  return { plan, recommendationId: recommendation.id, weeklyPlan };
}
