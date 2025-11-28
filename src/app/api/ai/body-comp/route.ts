import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runBodyCompEvaluation } from '@/lib/ai/bodyComp';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runBodyCompEvaluation(session.user.id);
    return NextResponse.json({ insight: result.insight, recommendationId: result.recommendationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to evaluate body composition';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
