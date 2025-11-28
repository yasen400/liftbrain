import { format } from 'date-fns';

export type CoachPromptContext = {
  userProfile: {
    name: string;
    age?: number;
    sex?: string;
    bodyweightKg?: number;
    experienceLevel?: string;
    equipmentProfile?: string;
    goalFocus?: string;
    schedule?: { workoutsPerWeek?: number; minutesPerSession?: number };
  };
  goals: Array<{ type: string; targetMetric: string; targetValue?: number; targetDate?: Date | null }>;
  baselineLifts: Array<{ name: string; bestSet: string }>;
  constraints?: string[];
  summaryNotes?: string;
};

export type AdjustmentContext = CoachPromptContext & {
  currentPlan: string;
  recentStats: Array<{
    weekLabel: string;
    totalSets: number;
    avgRpe: number;
    sessionsCompleted: number;
    estOneRmChanges: Array<{ lift: string; delta: number }>;
  }>;
  issues?: string[];
};

export type CompliancePromptContext = {
  user: {
    name: string;
    goalFocus?: string | null;
    scheduleWorkoutsPerWeek?: number | null;
  };
  windowLabel: string;
  aggregate: {
    completionRate: number;
    avgRpeDelta: number | null;
    avgVolumeDelta: number | null;
  };
  sessions: Array<{
    dateLabel: string;
    templateName: string;
    completionRate: number;
    avgRpeDelta: number | null;
    volumeDelta: number;
    readinessScore: number | null;
    sorenessScore: number | null;
    notes?: string | null;
    notedIssues: string[];
  }>;
  laggingPatterns: Array<{
    exercise: string;
    completionRate: number;
    avgRpeDelta: number | null;
  }>;
};

export type BodyCompPromptContext = {
  user: {
    name: string;
    goalFocus?: string | null;
    bodyweightKg?: number | null;
  };
  weightSeries: Array<{ dateLabel: string; weightKg: number }>;
  readinessAvg: number | null;
  appetiteAvg: number | null;
  sorenessAvg: number | null;
  notes: string[];
  photoUrls: string[];
};

export type WeeklyPlanPromptContext = {
  user: {
    name: string;
    goalFocus?: string | null;
    scheduleWorkoutsPerWeek?: number | null;
    minutesPerSession?: number | null;
    equipmentProfile?: string | null;
  };
  compliance: {
    trainingSummary: string;
    issues: string[];
    setAdjustments: string[];
    dayReschedules: string[];
    recoveryNotes?: string;
  };
  bodyComp: {
    trend: string;
    weightSummary: string;
    macroAdjustmentSummary: string;
    nextActions: string[];
    cautionNotes?: string;
  };
};

export function buildInitialProgramPrompt(ctx: CoachPromptContext, schemaExample: string) {
  return `You are LiftBrain, an elite strength coach for recreational lifters. Respond ONLY with JSON matching this schema: ${schemaExample}.
No additional commentary, no markdown, no code fences.

Client profile:
- Name: ${ctx.userProfile.name}
- Age/Sex: ${ctx.userProfile.age ?? 'n/a'} / ${ctx.userProfile.sex ?? 'n/a'}
- Bodyweight: ${ctx.userProfile.bodyweightKg ?? 'n/a'} kg
- Experience: ${ctx.userProfile.experienceLevel}
- Equipment: ${ctx.userProfile.equipmentProfile}
- Goal focus: ${ctx.userProfile.goalFocus}
- Schedule: ${ctx.userProfile.schedule?.workoutsPerWeek ?? '?'} sessions/week at ${ctx.userProfile.schedule?.minutesPerSession ?? '?'} minutes each

Goals:
${ctx.goals.map((goal) => `- ${goal.type}: ${goal.targetMetric} => ${goal.targetValue ?? 'n/a'} by ${goal.targetDate ? format(goal.targetDate, 'yyyy-MM-dd') : 'flexible'}`).join('\n')}

Baseline lifts:
${ctx.baselineLifts.map((lift) => `- ${lift.name}: ${lift.bestSet}`).join('\n') || 'No baseline data'}

Constraints:
${ctx.constraints?.join('\n') ?? 'None reported'}

Guidelines:
- Keep total weekly hard sets between 10 and 16 per main muscle group unless goal requires otherwise.
- Favor compound movements first, then accessories.
- Respect equipment limitations.
- Provide sensible starting loads or RPE-based guidance.
- Include short explanation for plan_summary and progression strategy inside JSON fields.
- Emphasize recovery recommendations.
Remember: JSON only.`;
}

export function buildAdjustmentPrompt(ctx: AdjustmentContext, schemaExample: string) {
  return `You are LiftBrain, an elite strength coach. Respond ONLY with JSON matching: ${schemaExample}.

Client recap:
- Experience: ${ctx.userProfile.experienceLevel}
- Goal: ${ctx.userProfile.goalFocus}
- Equipment: ${ctx.userProfile.equipmentProfile}
- Schedule: ${ctx.userProfile.schedule?.workoutsPerWeek} days @ ${ctx.userProfile.schedule?.minutesPerSession} min

Current plan summary:
${ctx.currentPlan}

Recent training (latest first):
${ctx.recentStats
    .map((stat) => `Week ${stat.weekLabel}: ${stat.sessionsCompleted} sessions, ${stat.totalSets} hard sets, avg RPE ${stat.avgRpe}. 1RM deltas: ${stat.estOneRmChanges
        .map((lift) => `${lift.lift} ${lift.delta >= 0 ? '+' : ''}${lift.delta}kg`)
        .join(', ')}`)
    .join('\n')}

Issues/notable notes:
${ctx.issues?.join('\n') ?? 'None reported'}

Constraints:
${ctx.constraints?.join('\n') ?? 'None'}

Guidelines:
- Keep load/progression jumps <=10% unless recommending deload.
- Flag deload weeks explicitly.
- Suggest exercise swaps only if justified in JSON.
- Provide rationale in changes_explanation.
- JSON only, no prose outside the structure.`;
}

export function buildCompliancePrompt(ctx: CompliancePromptContext, schemaExample: string) {
  const sessionLines = ctx.sessions
    .map((session) => {
      const readinessLabel = session.readinessScore ? `, readiness ${session.readinessScore}/10` : '';
      const sorenessLabel = session.sorenessScore ? `, soreness ${session.sorenessScore}/10` : '';
      const issueLabel = session.notedIssues.length ? ` Issues: ${session.notedIssues.join('; ')}` : '';
      const noteLabel = session.notes ? ` Notes: ${session.notes}` : '';
      return `- ${session.dateLabel} (${session.templateName}): ${session.completionRate}% sets, volume delta ${session.volumeDelta}, RPE delta ${session.avgRpeDelta ?? 'n/a'}${readinessLabel}${sorenessLabel}.${issueLabel}${noteLabel}`;
    })
    .join('\n');
  const laggingLines = ctx.laggingPatterns.length
    ? ctx.laggingPatterns
        .map((pattern) => `- ${pattern.exercise}: ${pattern.completionRate}% sets, RPE delta ${pattern.avgRpeDelta ?? 'n/a'}`)
        .join('\n')
    : 'No persistent patterns logged.';

  return `You are LiftBrain's compliance analyst. Respond ONLY with JSON that matches: ${schemaExample}.

Athlete: ${ctx.user.name}
Goal focus: ${ctx.user.goalFocus ?? 'n/a'}
Scheduled sessions per week: ${ctx.user.scheduleWorkoutsPerWeek ?? 'n/a'}
Lookback window: ${ctx.windowLabel}

Overall metrics:
- Average completion: ${ctx.aggregate.completionRate}% of prescribed sets
- Average RPE delta: ${ctx.aggregate.avgRpeDelta ?? 'n/a'}
- Average volume delta (sets): ${ctx.aggregate.avgVolumeDelta ?? 'n/a'}

Session breakdown:
${sessionLines}

Lagging patterns:
${laggingLines}

Deliver actionable coaching guidance that ties directly to the metrics. JSON only.`;
}

export function buildBodyCompPrompt(ctx: BodyCompPromptContext, schemaExample: string) {
  const weightLines = ctx.weightSeries
    .map((point) => `- ${point.dateLabel}: ${point.weightKg.toFixed(1)} kg`)
    .join('\n');
  const notes = ctx.notes.length ? ctx.notes.join('\n') : 'No qualitative notes logged.';
  const photoBlock = ctx.photoUrls.length
    ? `Photo references (signed URLs, newest first):\n${ctx.photoUrls.join('\n')}`
    : 'No photo evidence provided.';

  return `You are LiftBrain's body composition specialist. Respond ONLY with JSON matching: ${schemaExample}.

Athlete: ${ctx.user.name}
Goal focus: ${ctx.user.goalFocus ?? 'n/a'}
Recent weight trend:
${weightLines}

Average readiness: ${ctx.readinessAvg ?? 'n/a'} / 10
Average appetite: ${ctx.appetiteAvg ?? 'n/a'} / 10
Average soreness: ${ctx.sorenessAvg ?? 'n/a'} / 10

Notes:
${notes}

${photoBlock}

Infer a weight trend, relate visual cues to the trend, and prescribe macro adjustments. JSON only.`;
}

export function buildWeeklyPlanPrompt(ctx: WeeklyPlanPromptContext, schemaExample: string) {
  const issuesBlock = ctx.compliance.issues.length ? ctx.compliance.issues.join('\n') : 'No issues logged.';
  const adjustmentsBlock = ctx.compliance.setAdjustments.length
    ? ctx.compliance.setAdjustments.join('\n')
    : 'No set-level adjustments.';
  const rescheduleBlock = ctx.compliance.dayReschedules.length
    ? ctx.compliance.dayReschedules.join('\n')
    : 'No reschedules suggested.';
  const nextActions = ctx.bodyComp.nextActions.length ? ctx.bodyComp.nextActions.join('\n') : 'No body-comp actions.';

  return `You are LiftBrain, creating a 7-day plan that merges training compliance data with body composition feedback. Respond ONLY with JSON matching: ${schemaExample}.

Athlete focus: ${ctx.user.goalFocus ?? 'n/a'}
Schedule capacity: ${ctx.user.scheduleWorkoutsPerWeek ?? 'n/a'} sessions at ${ctx.user.minutesPerSession ?? 'n/a'} minutes
Equipment: ${ctx.user.equipmentProfile ?? 'full access'}

Compliance summary: ${ctx.compliance.trainingSummary}
Issues:
${issuesBlock}
Set adjustments:
${adjustmentsBlock}
Day reschedules:
${rescheduleBlock}
Recovery notes: ${ctx.compliance.recoveryNotes ?? 'n/a'}

Body composition trend: ${ctx.bodyComp.trend}
Weight summary: ${ctx.bodyComp.weightSummary}
Macro guidance: ${ctx.bodyComp.macroAdjustmentSummary}
Next actions:
${nextActions}
Safety notes: ${ctx.bodyComp.cautionNotes ?? 'n/a'}

Produce a concrete 7-day workout schedule plus a matching meal plan (calories + macros + recipe ideas). Tie every recommendation back to the context. JSON only.`;
}
