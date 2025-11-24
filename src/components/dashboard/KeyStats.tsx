import { Card } from '@/components/ui/card';

export function KeyStats({ stats }: { stats: Array<{ label: string; value: string; delta: string }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="space-y-2">
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
          <p className="text-sm font-medium text-emerald-600">{stat.delta}</p>
        </Card>
      ))}
    </div>
  );
}
