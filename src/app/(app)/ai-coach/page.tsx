import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getLatestRecommendation } from '@/lib/dashboard';

export default async function AiCoachPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const recommendation = await getLatestRecommendation(session.user.id);

  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm uppercase tracking-wide text-emerald-600">AI Advisor</p>
        <h1 className="text-3xl font-semibold text-gray-900">Coach conversation</h1>
        <p className="text-gray-600">
          This surface will call /api/ai/program and /api/ai/adjust to fetch JSON plans once the OpenAI key is configured.
        </p>
      </header>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
        {recommendation ? (
          <div className="space-y-3">
            <p className="font-semibold text-emerald-800">Latest plan summary</p>
            <p className="text-xs uppercase tracking-wide text-emerald-600">Issued {recommendation.issuedAt}</p>
            <p className="text-emerald-900">{recommendation.summary}</p>
            <div className="space-y-1 text-sm text-emerald-900">
              {recommendation.keyChanges.map((change) => (
                <p key={change}>• {change}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-emerald-900">
            <p className="font-semibold">No AI recommendations yet</p>
            <p>Once you connect OpenAI and log more sessions, the coach will summarize adjustments here.</p>
          </div>
        )}
        <button className="mt-4 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
          Request fresh adjustment
        </button>
      </div>
    </section>
  );
}
