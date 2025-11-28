import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { applyWeeklyPlan } from '@/lib/weeklyPlans';

type ApplyContext = { params: Promise<{ planId: string }> };

export async function PATCH(_request: NextRequest, context: ApplyContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planId } = await context.params;
  if (!planId) {
    return NextResponse.json({ error: 'Plan id required' }, { status: 400 });
  }

  try {
    const result = await applyWeeklyPlan(session.user.id, planId);
    return NextResponse.json({ success: true, templateId: result.templateId, templateName: result.templateName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to apply plan';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
