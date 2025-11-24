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
