import { z } from 'zod';

export const ComplianceRecommendationSchema = z.object({
  training_summary: z.string(),
  issues: z.array(z.string().min(3)).max(6),
  set_adjustments: z
    .array(
      z.object({
        exercise: z.string(),
        adjustment: z.string(),
        rationale: z.string(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
      }),
    )
    .max(6),
  day_reschedules: z
    .array(
      z.object({
        day: z.string(),
        recommendation: z.string(),
      }),
    )
    .max(4),
  recovery_notes: z.string().optional(),
});

export type ComplianceRecommendation = z.infer<typeof ComplianceRecommendationSchema>;

export const BodyCompInsightSchema = z.object({
  trend: z.enum(['leaning', 'stable', 'gaining']),
  weight_summary: z.string(),
  visual_callouts: z.array(z.string()).max(4),
  macro_adjustments: z.object({
    calorie_delta: z.number().int(),
    protein_g: z.number().int().nonnegative(),
    carbs_g: z.number().int().nonnegative(),
    fats_g: z.number().int().nonnegative(),
  }),
  next_actions: z.array(z.string()).max(5),
  caution_notes: z.string().optional(),
});

export type BodyCompInsight = z.infer<typeof BodyCompInsightSchema>;

const workoutDaySchema = z.object({
  day: z.string(),
  focus: z.string(),
  key_lifts: z.array(
    z.object({
      name: z.string(),
      sets: z.number().int().positive(),
      reps: z.union([z.string(), z.number()]),
      target_rpe: z.number().min(5).max(10).optional(),
      notes: z.string().optional(),
    }),
  ),
  accessory_focus: z.string().optional(),
  recovery_focus: z.string().optional(),
});

const mealDaySchema = z.object({
  day: z.string(),
  calories: z.number().int().positive(),
  macros: z.object({
    protein_g: z.number().int().positive(),
    carbs_g: z.number().int().nonnegative(),
    fats_g: z.number().int().nonnegative(),
  }),
  recipe_idea: z.string(),
});

export const WeeklyPlanSchema = z.object({
  week_label: z.string(),
  coaching_focus: z.string(),
  workout_schedule: z.array(workoutDaySchema).min(3),
  meal_plan: z.array(mealDaySchema).min(3),
  accountability_notes: z.string().optional(),
});

export type WeeklyPlanPayload = z.infer<typeof WeeklyPlanSchema>;
