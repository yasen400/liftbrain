import { format, parseISO } from 'date-fns';
import { Prisma, WeeklyPlan } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { WeeklyPlanPayload, WeeklyPlanSchema } from '@/lib/ai/schemas';

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function coerceWeeklyPlanPayload(record: WeeklyPlan): WeeklyPlanPayload {
  const parsedPlan = safeParse<unknown>(record.workoutPlanJson);
  const parsedMealPlan = safeParse<WeeklyPlanPayload['meal_plan']>(record.mealPlanJson) ?? [];

  if (parsedPlan && typeof parsedPlan === 'object' && !Array.isArray(parsedPlan) && 'workout_schedule' in parsedPlan) {
    const planObject = parsedPlan as WeeklyPlanPayload;
    if (!planObject.meal_plan?.length && parsedMealPlan.length) {
      planObject.meal_plan = parsedMealPlan;
    }
    return WeeklyPlanSchema.parse(planObject);
  }

  if (Array.isArray(parsedPlan)) {
    return WeeklyPlanSchema.parse({
      week_label: format(record.weekOf, 'MMM d, yyyy'),
      coaching_focus: 'AI plan data (legacy format)',
      workout_schedule: parsedPlan,
      meal_plan: parsedMealPlan,
      accountability_notes: undefined,
    });
  }

  return WeeklyPlanSchema.parse({
    week_label: format(record.weekOf, 'MMM d, yyyy'),
    coaching_focus: 'Plan details unavailable',
    workout_schedule: [],
    meal_plan: parsedMealPlan,
    accountability_notes: undefined,
  });
}

export async function getLatestWeeklyPlan(userId: string) {
  const plan = await prisma.weeklyPlan.findFirst({
    where: { userId },
    orderBy: { weekOf: 'desc' },
    include: { meals: { orderBy: { dayIndex: 'asc' } } },
  });

  if (!plan) return null;

  const payload = coerceWeeklyPlanPayload(plan);
  return { plan, payload };
}

async function ensureExercise(tx: Prisma.TransactionClient, name: string) {
  return tx.exercise.upsert({
    where: { name },
    update: {},
    create: {
      name,
      primaryMuscle: 'CUSTOM',
      secondaryMuscles: '[]',
      movementPattern: 'CUSTOM',
      equipment: 'FULL_GYM',
      difficulty: 'MODERATE',
    },
  });
}

export async function applyWeeklyPlan(userId: string, planId: string) {
  return prisma.$transaction(async (tx) => {
    const weeklyPlan = await tx.weeklyPlan.findFirst({ where: { id: planId, userId } });
    if (!weeklyPlan) {
      throw new Error('Weekly plan not found.');
    }

    const payload = coerceWeeklyPlanPayload(weeklyPlan);
    if (!payload.workout_schedule.length) {
      throw new Error('Weekly plan has no scheduled workouts to apply.');
    }

    const latestTemplate = await tx.workoutTemplate.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const template = await tx.workoutTemplate.create({
      data: {
        userId,
        name: `AI Plan – ${payload.week_label}`,
        description: payload.coaching_focus,
        weeklyDays: payload.workout_schedule.length,
        aiVersion: (latestTemplate?.aiVersion ?? 0) + 1,
      },
    });

    for (const [dayIndex, day] of payload.workout_schedule.entries()) {
      const templateDay = await tx.templateDay.create({
        data: {
          workoutTemplateId: template.id,
          dayIndex,
          dayName: day.day,
          focusArea: day.focus,
        },
      });

      for (const lift of day.key_lifts) {
        const exercise = await ensureExercise(tx, lift.name);
        await tx.templateDayExercise.create({
          data: {
            templateDayId: templateDay.id,
            exerciseId: exercise.id,
            prescribedSets: lift.sets,
            prescribedReps: typeof lift.reps === 'number' ? `${lift.reps}` : lift.reps,
            targetRpe: lift.target_rpe ?? null,
            instructions: lift.notes ?? undefined,
          },
        });
      }
    }

    await tx.weeklyPlan.update({ where: { id: weeklyPlan.id }, data: { applied: true } });

    return { templateId: template.id, templateName: template.name };
  });
}

export function buildIcsForWeeklyPlan(plan: WeeklyPlanPayload, weekOf: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const weekStart = typeof weekOf === 'string' ? parseISO(weekOf) : weekOf;
  const dayNameToIndex: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LiftBrain//EN'];

  plan.workout_schedule.forEach((day, idx) => {
    const normalized = day.day.split(' ')[0].toLowerCase();
    const offset = dayNameToIndex[normalized] ?? idx;
    const eventDate = new Date(weekStart);
    eventDate.setDate(eventDate.getDate() + offset);
    const dateString = `${eventDate.getUTCFullYear()}${pad(eventDate.getUTCMonth() + 1)}${pad(eventDate.getUTCDate())}`;
    const summary = day.focus ? `${day.day} – ${day.focus}` : day.day;
    const description = day.key_lifts.map((lift) => `${lift.name} ${lift.sets}x${lift.reps}`).join(' | ');
    lines.push('BEGIN:VEVENT');
    lines.push(`DTSTART;VALUE=DATE:${dateString}`);
    lines.push(`DTEND;VALUE=DATE:${dateString}`);
    lines.push(`SUMMARY:${summary}`);
    if (description) {
      lines.push(`DESCRIPTION:${description.replace(/\n/g, ' ')}`);
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
