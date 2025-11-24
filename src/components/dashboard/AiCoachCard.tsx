import { Card, CardHeader } from '@/components/ui/card';
import { RecommendationSummary } from '@/lib/dashboard';

interface AiCoachCardProps {
  recommendation: RecommendationSummary | null;
}

export function AiCoachCard({ recommendation }: AiCoachCardProps) {
  return (
    <Card>
      <CardHeader title="AI Coach" description="Latest update" />
      {recommendation ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-emerald-600">Issued {recommendation.issuedAt}</p>
          <p className="text-gray-700">{recommendation.summary}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
            {recommendation.keyChanges.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
          <button className="mt-2 inline-flex items-center justify-center rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
            Apply adjustments
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <p>No AI recommendations yet.</p>
          <p>Request an adjustment once you configure the OpenAI key and log a few sessions.</p>
          <button className="inline-flex items-center justify-center rounded-md border border-dashed border-emerald-300 px-3 py-1.5 font-semibold text-emerald-600">
            Request plan (coming soon)
          </button>
        </div>
      )}
    </Card>
  );
}
