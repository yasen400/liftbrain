import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runComplianceAnalysis } from '@/lib/ai/compliance';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runComplianceAnalysis(session.user.id);
    return NextResponse.json({ report: result.report, recommendationId: result.recommendationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run compliance analysis';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
