import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateWeeklyPlan } from '@/lib/ai/weeklyPlan';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await generateWeeklyPlan(session.user.id);
    return NextResponse.json({ plan: result.plan, weeklyPlanId: result.weeklyPlan.id, recommendationId: result.recommendationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate weekly plan';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
