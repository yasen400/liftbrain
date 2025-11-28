import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { callOpenAI } from './client';
import { BodyCompInsight, BodyCompInsightSchema } from './schemas';
import { BodyCompPromptContext, buildBodyCompPrompt } from './prompts';

const BODY_COMP_SCHEMA_EXAMPLE = JSON.stringify(
  {
    trend: 'leaning',
    weight_summary: 'Down 0.6 kg across two weeks while readiness stayed >7.',
    visual_callouts: ['Waist taper improved vs earliest photo', 'Shoulders still hold water on low sleep days'],
    macro_adjustments: {
      calorie_delta: -150,
      protein_g: 190,
      carbs_g: 240,
      fats_g: 60,
    },
    next_actions: ['Add post-training shake on lower days', 'Keep sodium steady before photo updates'],
    caution_notes: 'If weight drops >1 kg next week re-feed on Sunday.',
  },
  null,
  2,
);

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function buildBodyCompContext(userId: string): Promise<BodyCompPromptContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, goalFocus: true, bodyweightKg: true },
  });
  if (!user) {
    throw new Error('User not found for body-composition analysis.');
  }

  const checkIns = await prisma.progressCheckIn.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  if (!checkIns.length) {
    throw new Error('Log at least one progress check-in before running body-composition analysis.');
  }

  const weightSeries = checkIns
    .filter((entry) => typeof entry.weightKg === 'number')
    .slice(0, 5)
    .map((entry) => ({ dateLabel: format(entry.createdAt, 'MMM d'), weightKg: entry.weightKg as number }))
    .reverse();

  const photoUrls = checkIns
    .filter((entry) => entry.photoUrl)
    .map((entry) => entry.photoUrl as string);

  if (weightSeries.length < 2 && !photoUrls.length) {
    throw new Error('Need either two weight entries or a recent progress photo to run the evaluator.');
  }

  const readinessAvg = average(
    checkIns
      .map((entry) => entry.readinessScore)
      .filter((value): value is number => typeof value === 'number'),
  );
  const appetiteAvg = average(
    checkIns
      .map((entry) => entry.appetiteScore)
      .filter((value): value is number => typeof value === 'number'),
  );
  const sorenessAvg = average(
    checkIns
      .map((entry) => entry.sorenessScore)
      .filter((value): value is number => typeof value === 'number'),
  );

  const notes = checkIns
    .map((entry) => entry.notes)
    .filter((note): note is string => Boolean(note));

  return {
    user: {
      name: user.email,
      goalFocus: user.goalFocus,
      bodyweightKg: user.bodyweightKg,
    },
    weightSeries,
    readinessAvg: readinessAvg !== null ? Number(readinessAvg.toFixed(1)) : null,
    appetiteAvg: appetiteAvg !== null ? Number(appetiteAvg.toFixed(1)) : null,
    sorenessAvg: sorenessAvg !== null ? Number(sorenessAvg.toFixed(1)) : null,
    notes,
    photoUrls,
  };
}

export async function runBodyCompEvaluation(userId: string) {
  const ctx = await buildBodyCompContext(userId);
  const prompt = buildBodyCompPrompt(ctx, BODY_COMP_SCHEMA_EXAMPLE);

  const insight = await callOpenAI<BodyCompInsight>({
    prompt,
    schema: BodyCompInsightSchema,
    model: process.env.AI_BODY_COMP_MODEL ?? 'gpt-4.1-mini',
  });

  const recommendation = await prisma.aiRecommendation.create({
    data: {
      userId,
      type: 'BODY_COMP',
      promptSnapshot: prompt,
      responsePayload: JSON.stringify(insight),
    },
  });

  return { insight, recommendationId: recommendation.id };
}
