import { prisma } from '@/lib/prisma';
import { subDays, addDays, format } from 'date-fns';

export type KeyStat = { label: string; value: string; delta: string };
export type VolumeDatum = { muscle: string; sets: number };
export type OneRmPoint = { date: string; bench: number | null; squat: number | null; deadlift: number | null };
export type UpcomingSession = { day: string; focus: string; duration: string; readiness: string };
export type RecommendationSummary = { summary: string; issuedAt: string; keyChanges: string[] };

type SessionWithSets = Array<{
  sessionDate: Date;
  durationMinutes: number | null;
  setEntries: Array<{
    reps: number;
    weightKg: number | null;
    rpe: number | null;
    exercise?: {
      name: string;
      primaryMuscle: string | null;
    } | null;
  }>;
}>;

type TemplateDayData = Array<{
  dayIndex: number;
  dayName: string | null;
  focusArea: string | null;
}>;

const PRIMARY_LIFT_KEYWORDS: Record<'bench' | 'squat' | 'deadlift', string[]> = {
  bench: ['bench'],
  squat: ['squat'],
  deadlift: ['deadlift', 'pull'],
};

function normalizeMuscle(name: string | null | undefined) {
  if (!name) return 'Other';
  const lower = name.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function determineLiftKind(exerciseName: string) {
  const normalized = exerciseName.toLowerCase();
  if (PRIMARY_LIFT_KEYWORDS.bench.some((kw) => normalized.includes(kw))) return 'bench';
  if (PRIMARY_LIFT_KEYWORDS.squat.some((kw) => normalized.includes(kw))) return 'squat';
  if (PRIMARY_LIFT_KEYWORDS.deadlift.some((kw) => normalized.includes(kw))) return 'deadlift';
  return null;
}

function estimateOneRm(weightKg: number, reps: number) {
  if (!weightKg || !reps) return null;
  return weightKg * (1 + reps / 30);
}

export async function getLatestRecommendation(userId: string): Promise<RecommendationSummary | null> {
  const latest = await prisma.aiRecommendation.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!latest) {
    return null;
  }

  let parsed: unknown = null;
  try {
    parsed = latest.responsePayload ? JSON.parse(latest.responsePayload) : null;
  } catch {
    parsed = null;
  }

  const parsedObject = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;

  const summary =
    (typeof parsedObject?.summary === 'string' && parsedObject.summary) ||
    (typeof parsedObject?.planSummary === 'string' && parsedObject.planSummary) ||
    'Latest AI recommendation available.';

  const keyChangesCandidate =
    (parsedObject?.keyChanges as unknown) ?? (parsedObject?.adjustments as unknown) ?? (parsedObject?.actions as unknown);
  const keyChanges = Array.isArray(keyChangesCandidate)
    ? keyChangesCandidate.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
  const normalizedKeyChanges = keyChanges.length ? keyChanges : ['Review the plan to apply adjustments.'];

  return {
    summary,
    issuedAt: format(latest.createdAt, 'MMM d, yyyy'),
    keyChanges: normalizedKeyChanges,
  };
}

export async function getDashboardData(userId: string) {
  const now = new Date();
  const sinceSevenDays = subDays(now, 7);
  const sinceNinetyDays = subDays(now, 90);

  const userPromise = prisma.user.findUnique({ where: { id: userId } });
  const sessionsPromise = prisma.workoutSession.findMany({
    where: { userId, sessionDate: { gte: sinceNinetyDays } },
    include: {
      setEntries: {
        include: {
          exercise: true,
        },
      },
    },
    orderBy: { sessionDate: 'desc' },
  });
  const templatePromise = prisma.templateDay.findMany({
    where: { workoutTemplate: { userId } },
    orderBy: { dayIndex: 'asc' },
    take: 4,
  });

  const [user, recommendation] = await Promise.all([userPromise, getLatestRecommendation(userId)]);
  const [sessions, templateDays] = (await Promise.all([sessionsPromise, templatePromise])) as [
    SessionWithSets,
    TemplateDayData,
  ];

  const weeklySessions = sessions.filter((session) => session.sessionDate >= sinceSevenDays);
  const weeklySetCount = weeklySessions.reduce((total, session) => total + session.setEntries.length, 0);
  const schedulePerWeek = user?.scheduleWorkoutsPerWeek ?? 0;
  const scheduledMinutes = user?.scheduleMinutesPerSession ?? 60;
  const expectedWeeklySets = schedulePerWeek ? schedulePerWeek * 12 : null;

  const keyStats: KeyStat[] = [
    {
      label: 'Sessions (7d)',
      value: schedulePerWeek ? `${weeklySessions.length}/${schedulePerWeek}` : `${weeklySessions.length}`,
      delta: schedulePerWeek
        ? `${Math.round((weeklySessions.length / schedulePerWeek) * 100 || 0)}% of weekly goal`
        : 'Logged past 7 days',
    },
    {
      label: 'Weekly sets',
      value: `${weeklySetCount} sets`,
      delta: expectedWeeklySets
        ? `${Math.round((weeklySetCount / expectedWeeklySets) * 100 || 0)}% of ${expectedWeeklySets}-set target`
        : 'Hard sets this week',
    },
  ];

  const durations = weeklySessions
    .map((session) => session.durationMinutes)
    .filter((value): value is number => typeof value === 'number');
  const avgDuration = durations.length ? Math.round(durations.reduce((sum, val) => sum + val, 0) / durations.length) : null;
  keyStats.push({
    label: 'Avg session length',
    value: avgDuration ? `${avgDuration} min` : '—',
    delta: durations.length ? `Across ${durations.length} session${durations.length === 1 ? '' : 's'}` : 'Log duration to track',
  });

  const rpeValues = weeklySessions
    .flatMap((session) => session.setEntries.map((set) => set.rpe))
    .filter((value): value is number => typeof value === 'number');
  const avgRpe = rpeValues.length ? (rpeValues.reduce((sum, val) => sum + val, 0) / rpeValues.length).toFixed(1) : null;
  keyStats.push({
    label: 'Avg set RPE',
    value: avgRpe ?? '—',
    delta: rpeValues.length ? `From ${rpeValues.length} sets` : 'Log RPE to trend fatigue',
  });

  const volumeMap = new Map<string, number>();
  weeklySessions.forEach((session) => {
    session.setEntries.forEach((set) => {
      const muscle = normalizeMuscle(set.exercise?.primaryMuscle);
      volumeMap.set(muscle, (volumeMap.get(muscle) ?? 0) + 1);
    });
  });
  const volumeByMuscle: VolumeDatum[] = Array.from(volumeMap.entries())
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets)
    .slice(0, 6);

  const oneRmByDate = new Map<string, { bench: number | null; squat: number | null; deadlift: number | null }>();
  sessions.forEach((session) => {
    const dateKey = format(session.sessionDate, 'yyyy-MM-dd');
    session.setEntries.forEach((set) => {
      if (!set.weightKg || !set.reps) return;
      const lift = determineLiftKind(set.exercise?.name ?? '');
      if (!lift) return;
      const e1rm = estimateOneRm(set.weightKg, set.reps);
      if (!e1rm) return;
      const current = oneRmByDate.get(dateKey) ?? { bench: null, squat: null, deadlift: null };
      const prev = current[lift];
      current[lift] = Math.max(prev ?? 0, Math.round(e1rm));
      oneRmByDate.set(dateKey, current);
    });
  });

  const oneRmTrends: OneRmPoint[] = Array.from(oneRmByDate.entries())
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(-12);

  const upcomingSessions: UpcomingSession[] = templateDays.length
    ? templateDays.slice(0, 3).map((day, idx) => ({
        day: day.dayName || `Day ${day.dayIndex + 1}`,
        focus: day.focusArea ?? 'Coach-led focus coming soon',
        duration: `${scheduledMinutes} min`,
        readiness: `Planned #${idx + 1}`,
      }))
    : Array.from({ length: Math.max(2, Math.min(schedulePerWeek || 2, 3)) }).map((_, idx) => ({
        day: format(addDays(now, idx + 1), 'EEE · Session'),
        focus: user?.goalFocus ? `${user.goalFocus.toLowerCase()} focus` : 'General strength session',
        duration: `${scheduledMinutes} min`,
        readiness: 'Plan',
      }));

  return {
    keyStats,
    volumeByMuscle,
    oneRmTrends,
    upcomingSessions,
    recommendation,
  };
}
