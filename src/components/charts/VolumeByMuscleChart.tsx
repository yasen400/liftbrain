"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type VolumeDatum = {
  muscle: string;
  sets: number;
};

export function VolumeByMuscleChart({ data }: { data: VolumeDatum[] }) {
  if (data.length === 0) {
    return <p className="h-64 text-sm text-slate-500">Log sets this week to see muscle group volume.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis dataKey="muscle" axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} />
          <Tooltip cursor={{ fill: 'rgba(15,118,110,0.08)' }} />
          <Bar dataKey="sets" fill="#0f766e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
