import { Card, CardHeader } from '@/components/ui/card';

type Session = {
  day: string;
  focus: string;
  duration: string;
  readiness: string;
};

export function UpcomingSessionsCard({ sessions }: { sessions: Session[] }) {
  return (
    <Card>
      <CardHeader title="Upcoming sessions" description="Next 7 days" />
      {sessions.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Add a template to see planned sessions here.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {sessions.map((session) => (
            <div key={`${session.day}-${session.focus}`} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{session.day}</p>
                  <p className="text-sm text-gray-500">{session.focus}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium text-gray-700">{session.duration}</p>
                  <p className="text-emerald-600">{session.readiness}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
