import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { applyWeeklyPlan } from '@/lib/weeklyPlans';

export async function PATCH(_: Request, { params }: { params: { planId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!params.planId) {
    return NextResponse.json({ error: 'Plan id required' }, { status: 400 });
  }

  try {
    const result = await applyWeeklyPlan(session.user.id, params.planId);
    return NextResponse.json({ success: true, templateId: result.templateId, templateName: result.templateName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to apply plan';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
