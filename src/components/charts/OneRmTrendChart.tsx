"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type OneRmDatum = {
  date: string;
  bench: number | null;
  squat: number | null;
  deadlift: number | null;
};

export function OneRmTrendChart({ data }: { data: OneRmDatum[] }) {
  if (data.length === 0) {
    return <p className="h-64 text-sm text-slate-500">Log bench, squat, or deadlift sets to populate this chart.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
          <XAxis dataKey="date" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} width={40} unit="kg" allowDecimals={false} />
          <Tooltip formatter={(value: number | null) => (value ? `${value} kg` : 'No data')} />
          <Line type="monotone" dataKey="bench" stroke="#0f766e" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="squat" stroke="#0369a1" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="deadlift" stroke="#dc2626" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
