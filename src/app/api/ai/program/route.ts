import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { buildInitialProgramPrompt } from '@/lib/ai/prompts';
import { callOpenAI } from '@/lib/ai/client';
import { authOptions } from '@/lib/auth';

const ProgramSchema = z.object({
  plan_summary: z.string(),
  weekly_schedule: z.array(z.object({
    day_name: z.string(),
    focus: z.string(),
    exercises: z.array(z.object({
      name: z.string(),
      sets: z.number().int().positive(),
      reps: z.union([z.string(), z.number()]),
      target_rpe: z.number().min(5).max(9).optional(),
      initial_weight_kg: z.number().nonnegative().nullable().optional(),
      notes: z.string().optional(),
    })),
  })),
  progression_strategy: z.string(),
  recovery_guidelines: z.string(),
});

type ProgramPlan = z.infer<typeof ProgramSchema>;

const programSchemaPrompt = JSON.stringify(
  {
    plan_summary: 'string',
    weekly_schedule: [
      {
        day_name: 'Day 1 - Upper',
        focus: 'Upper Body',
        exercises: [
          {
            name: 'Barbell Bench Press',
            sets: 4,
            reps: '6-8',
            target_rpe: 8,
            initial_weight_kg: 80,
            notes: 'Explosive concentric',
          },
        ],
      },
    ],
    progression_strategy: 'string',
    recovery_guidelines: 'string',
  },
  null,
  2,
);

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { goals: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  const prompt = buildInitialProgramPrompt(
    {
      userProfile: {
        name: user.email,
        age: user.age ?? undefined,
        sex: user.sex ?? undefined,
        bodyweightKg: user.bodyweightKg ?? undefined,
        experienceLevel: user.experienceLevel,
        equipmentProfile: user.equipmentProfile,
        goalFocus: user.goalFocus ?? undefined,
        schedule: {
          workoutsPerWeek: user.scheduleWorkoutsPerWeek ?? undefined,
          minutesPerSession: user.scheduleMinutesPerSession ?? undefined,
        },
      },
      goals: user.goals.map((goal: typeof user.goals[number]) => ({
        type: goal.type,
        targetMetric: goal.targetMetric,
        targetValue: goal.targetValue ?? undefined,
        targetDate: goal.targetDate ?? undefined,
      })),
      baselineLifts: [],
    },
    programSchemaPrompt,
  );

  const aiPlan = await callOpenAI<ProgramPlan>({
    prompt,
    schema: ProgramSchema,
  });

  const recommendation = await prisma.aiRecommendation.create({
    data: {
      userId: user.id,
      type: 'INITIAL',
      promptSnapshot: prompt,
      responsePayload: JSON.stringify(aiPlan),
    },
  });

  return NextResponse.json({
    recommendation: {
      ...recommendation,
      responsePayload: aiPlan,
    },
    plan: aiPlan,
  });
}
