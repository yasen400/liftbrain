import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { callOpenAI } from './client';
import { ComplianceRecommendation, ComplianceRecommendationSchema } from './schemas';
import { buildCompliancePrompt, CompliancePromptContext } from './prompts';

const COMPLIANCE_SCHEMA_EXAMPLE = JSON.stringify(
  {
    training_summary: 'Sets completed at 82% with moderate fatigue rise. Lower volume midweek to hit technique work fresh.',
    issues: ['Missed rear delt work twice', 'Lower day RPE drifting +1.2 above target'],
    set_adjustments: [
      {
        exercise: 'Romanian Deadlift',
        adjustment: 'Reduce to 3 sets this week and reintroduce paused work next block',
        rationale: 'Athlete overshooting RPE +1.5 with hamstring soreness notes',
        priority: 'high',
      },
    ],
    day_reschedules: [
      {
        day: 'Friday Lower',
        recommendation: 'Slide to Saturday to create 48h recovery after tempo squats',
      },
    ],
    recovery_notes: 'Add 10 minutes of easy cycling after lower days to drive blood flow.',
  },
  null,
  2,
);

type SessionExerciseStat = {
  exercise: string;
  targetSets: number;
  actualSets: number;
  avgRpe: number | null;
  targetRpe: number | null;
};

type SessionSummary = CompliancePromptContext['sessions'][number] & {
  exerciseStats: SessionExerciseStat[];
};

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function buildComplianceContext(userId: string): Promise<{ ctx: CompliancePromptContext; sessions: SessionSummary[] }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      goalFocus: true,
      scheduleWorkoutsPerWeek: true,
    },
  });

  if (!user) {
    throw new Error('User not found for compliance analysis.');
  }

  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { sessionDate: 'desc' },
    take: 7,
    include: {
      templateDay: {
        include: {
          exercises: {
            include: { exercise: true },
          },
        },
      },
      setEntries: {
        include: { exercise: true },
      },
      progressCheckIns: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!sessions.length) {
    throw new Error('Log at least one workout before running compliance analysis.');
  }

  const sessionSummaries: SessionSummary[] = sessions.map((session) => {
    const templateExercises = session.templateDay?.exercises ?? [];
    const templateMap = new Map(templateExercises.map((exercise) => [exercise.exerciseId, exercise]));

    const totalTargetSets = templateExercises.reduce((sum, exercise) => sum + exercise.prescribedSets, 0);
    const totalActualSets = session.setEntries.length;
    const completionRate = totalTargetSets ? Math.min(1, totalActualSets / totalTargetSets) * 100 : 100;

    const targetRpes = templateExercises.map((exercise) => exercise.targetRpe).filter((value): value is number => typeof value === 'number');
    const actualRpes = session.setEntries.map((set) => set.rpe).filter((value): value is number => typeof value === 'number');
    const avgTargetRpe = average(targetRpes);
    const avgActualRpe = average(actualRpes);
    const avgRpeDelta = avgActualRpe !== null && avgTargetRpe !== null ? Number((avgActualRpe - avgTargetRpe).toFixed(1)) : null;

    const exerciseStatsMap = new Map<string, SessionExerciseStat & { rpeSamples: number[] }>();
    session.setEntries.forEach((set) => {
      const key = set.exercise?.name ?? 'Unknown movement';
      const current = exerciseStatsMap.get(key) ?? {
        exercise: key,
        targetSets: 0,
        actualSets: 0,
        avgRpe: null,
        targetRpe: null,
        rpeSamples: [],
      };
      current.actualSets += 1;
      if (typeof set.rpe === 'number') {
        current.rpeSamples.push(set.rpe);
      }
      if (!current.targetSets) {
        const template = templateMap.get(set.exerciseId);
        if (template) {
          current.targetSets = template.prescribedSets;
          current.targetRpe = template.targetRpe ?? null;
        } else if (set.targetSets) {
          current.targetSets = set.targetSets;
        }
      }
      exerciseStatsMap.set(key, current);
    });

    templateExercises.forEach((template) => {
      const key = template.exercise.name;
      if (!exerciseStatsMap.has(key)) {
        exerciseStatsMap.set(key, {
          exercise: key,
          targetSets: template.prescribedSets,
          actualSets: 0,
          avgRpe: null,
          targetRpe: template.targetRpe ?? null,
          rpeSamples: [],
        });
      }
    });

    const exerciseStats: SessionExerciseStat[] = Array.from(exerciseStatsMap.values()).map((stat) => ({
      exercise: stat.exercise,
      targetSets: stat.targetSets,
      actualSets: stat.actualSets,
      avgRpe: stat.rpeSamples.length ? Number(average(stat.rpeSamples)?.toFixed(1)) : null,
      targetRpe: stat.targetRpe,
    }));

    const notedIssues = exerciseStats
      .filter((stat) => stat.targetSets && stat.actualSets < stat.targetSets)
      .sort((a, b) => (a.actualSets / Math.max(a.targetSets, 1)) - (b.actualSets / Math.max(b.targetSets, 1)))
      .slice(0, 2)
      .map((stat) => `${stat.exercise} ${stat.actualSets}/${stat.targetSets} sets`);

    const readinessScore = session.progressCheckIns[0]?.readinessScore ?? null;
    const sorenessScore = session.progressCheckIns[0]?.sorenessScore ?? null;

    return {
      dateLabel: format(session.sessionDate, 'EEE MMM d'),
      templateName: session.templateDay?.dayName ?? 'Ad-hoc session',
      completionRate: Number(completionRate.toFixed(1)),
      avgRpeDelta,
      volumeDelta: totalActualSets - totalTargetSets,
      readinessScore,
      sorenessScore,
      notes: session.notes,
      notedIssues,
      exerciseStats,
    };
  });

  const aggregateCompletion = Number(
    (
      sessionSummaries.reduce((sum, session) => sum + session.completionRate, 0) /
      Math.max(sessionSummaries.length, 1)
    ).toFixed(1),
  );
  const avgRpeDelta = average(
    sessionSummaries
      .map((session) => session.avgRpeDelta)
      .filter((value): value is number => typeof value === 'number'),
  );
  const avgVolumeDelta = Number(
    (
      sessionSummaries.reduce((sum, session) => sum + session.volumeDelta, 0) /
      Math.max(sessionSummaries.length, 1)
    ).toFixed(1),
  );

  const laggingAggregation = new Map<string, { actual: number; target: number; rpeDeltaSum: number; rpeCount: number }>();
  sessionSummaries.forEach((session) => {
    session.exerciseStats.forEach((stat) => {
      if (!stat.targetSets) return;
      const entry = laggingAggregation.get(stat.exercise) ?? { actual: 0, target: 0, rpeDeltaSum: 0, rpeCount: 0 };
      entry.actual += stat.actualSets;
      entry.target += stat.targetSets;
      if (stat.avgRpe !== null && stat.targetRpe !== null) {
        entry.rpeDeltaSum += stat.avgRpe - stat.targetRpe;
        entry.rpeCount += 1;
      }
      laggingAggregation.set(stat.exercise, entry);
    });
  });

  const laggingPatterns = Array.from(laggingAggregation.entries())
    .map(([exercise, entry]) => ({
      exercise,
      completionRate: entry.target ? Number(((entry.actual / entry.target) * 100).toFixed(1)) : 100,
      avgRpeDelta: entry.rpeCount ? Number((entry.rpeDeltaSum / entry.rpeCount).toFixed(1)) : null,
    }))
    .filter((pattern) => pattern.completionRate < 95 || (pattern.avgRpeDelta !== null && Math.abs(pattern.avgRpeDelta) >= 0.5))
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 5);

  const oldestSession = sessions[sessions.length - 1];
  const newestSession = sessions[0];
  const windowLabel = `${format(oldestSession.sessionDate, 'MMM d')} – ${format(newestSession.sessionDate, 'MMM d')}`;

  const ctx: CompliancePromptContext = {
    user: {
      name: user.email,
      goalFocus: user.goalFocus,
      scheduleWorkoutsPerWeek: user.scheduleWorkoutsPerWeek,
    },
    windowLabel,
    aggregate: {
      completionRate: aggregateCompletion,
      avgRpeDelta: avgRpeDelta !== null ? Number(avgRpeDelta.toFixed(1)) : null,
      avgVolumeDelta,
    },
    sessions: sessionSummaries,
    laggingPatterns,
  };

  return { ctx, sessions: sessionSummaries };
}

export async function runComplianceAnalysis(userId: string) {
  const { ctx } = await buildComplianceContext(userId);
  const prompt = buildCompliancePrompt(ctx, COMPLIANCE_SCHEMA_EXAMPLE);
  const report = await callOpenAI<ComplianceRecommendation>({
    prompt,
    schema: ComplianceRecommendationSchema,
    model: process.env.AI_COMPLIANCE_MODEL ?? 'gpt-4.1-mini',
  });

  const recommendation = await prisma.aiRecommendation.create({
    data: {
      userId,
      type: 'COMPLIANCE_REVIEW',
      promptSnapshot: prompt,
      responsePayload: JSON.stringify(report),
    },
  });

  return { report, recommendationId: recommendation.id };
}
