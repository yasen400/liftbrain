export const GOAL_FOCUS_VALUES = [
  'HYPERTROPHY',
  'STRENGTH',
  'FAT_LOSS',
  'RECOMP',
  'POWER',
  'ENDURANCE',
] as const;

export type GoalFocusValue = typeof GOAL_FOCUS_VALUES[number];

const GOAL_FOCUS_LABELS: Record<GoalFocusValue, string> = {
  HYPERTROPHY: 'Build muscle',
  STRENGTH: 'Strength / PRs',
  FAT_LOSS: 'Cut / fat loss',
  RECOMP: 'Body recomposition',
  POWER: 'Power / athleticism',
  ENDURANCE: 'Endurance / conditioning',
};

export const GOAL_FOCUS_OPTIONS = GOAL_FOCUS_VALUES.map((value) => ({
  value,
  label: GOAL_FOCUS_LABELS[value],
}));
