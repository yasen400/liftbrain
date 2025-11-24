export const mockStats = {
  keyStats: [
    { label: 'Weekly Volume', value: '52 sets', delta: '+6% vs target' },
    { label: 'Sessions Completed', value: '3/4', delta: '75% adherence' },
    { label: 'Estimated Bench 1RM', value: '118 kg', delta: '+3 kg' },
    { label: 'AI Program Version', value: 'v4', delta: 'Last updated 4d ago' },
  ],
  volumeByMuscle: [
    { muscle: 'Chest', sets: 14 },
    { muscle: 'Back', sets: 16 },
    { muscle: 'Legs', sets: 18 },
    { muscle: 'Shoulders', sets: 10 },
    { muscle: 'Arms', sets: 8 },
  ],
  oneRmTrends: [
    { date: '2024-09-01', bench: 110, squat: 150, deadlift: 180 },
    { date: '2024-10-01', bench: 112, squat: 152, deadlift: 182 },
    { date: '2024-11-01', bench: 115, squat: 155, deadlift: 185 },
    { date: '2024-12-01', bench: 118, squat: 158, deadlift: 188 },
  ],
  upcomingSessions: [
    {
      day: 'Tue - Upper 1',
      focus: 'Horizontal push/pull + arms accessories',
      duration: '60 min',
      readiness: 'Good',
    },
    {
      day: 'Thu - Lower 1',
      focus: 'Squat + hinge emphasis',
      duration: '65 min',
      readiness: 'Moderate',
    },
  ],
  latestRecommendation: {
    summary: 'Maintain Upper/Lower split, shift bench volume to dumbbell variation next week.',
    issuedAt: '2024-11-18',
    keyChanges: [
      'Swap last bench set for tempo DB press',
      'Add single-leg RDLs on Lower 2 for pelvic stability',
      'Deload deadlift top set by -7% next week',
    ],
  },
};
