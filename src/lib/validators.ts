import { z } from 'zod';

export const workoutSetSchema = z.object({
  exerciseId: z.string().cuid(),
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.number().nonnegative().nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  notes: z.string().max(280).optional(),
  isPr: z.boolean().optional(),
});

export const workoutSessionSchema = z.object({
  sessionDate: z.string().datetime(),
  templateDayId: z.string().cuid().optional(),
  durationMinutes: z.number().int().positive().optional(),
  perceivedDifficulty: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
  sets: z.array(workoutSetSchema).min(1),
});

export type WorkoutSessionInput = z.infer<typeof workoutSessionSchema>;
