import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLatestWeeklyPlan } from '@/lib/weeklyPlans';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const latest = await getLatestWeeklyPlan(session.user.id);
  if (!latest) {
    return NextResponse.json({ plan: null });
  }

  const { plan, payload } = latest;
  return NextResponse.json({
    plan: {
      id: plan.id,
      weekOf: plan.weekOf,
      applied: plan.applied,
      payload,
    },
  });
}
