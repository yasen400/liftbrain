import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const exercises = [
  {
    name: 'Barbell Back Squat',
    primaryMuscle: 'LEGS',
    secondaryMuscles: ['GLUTES', 'CORE'],
    movementPattern: 'SQUAT',
    equipment: 'FULL_GYM',
    difficulty: 'HARD',
    defaultSets: 4,
    defaultReps: '6-8',
  },
  {
    name: 'Romanian Deadlift',
    primaryMuscle: 'LEGS',
    secondaryMuscles: ['GLUTES', 'BACK'],
    movementPattern: 'HINGE',
    equipment: 'BARBELL_ONLY',
    difficulty: 'HARD',
    defaultSets: 3,
    defaultReps: '8-10',
  },
  {
    name: 'Barbell Bench Press',
    primaryMuscle: 'CHEST',
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    movementPattern: 'PUSH_HORIZONTAL',
    equipment: 'BARBELL_ONLY',
    difficulty: 'HARD',
    defaultSets: 4,
    defaultReps: '5-8',
  },
  {
    name: 'Dumbbell Incline Press',
    primaryMuscle: 'CHEST',
    secondaryMuscles: ['SHOULDERS', 'TRICEPS'],
    movementPattern: 'PUSH_HORIZONTAL',
    equipment: 'DUMBBELLS_ONLY',
    difficulty: 'MODERATE',
    defaultSets: 3,
    defaultReps: '8-12',
  },
  {
    name: 'Pull-Up',
    primaryMuscle: 'BACK',
    secondaryMuscles: ['ARMS'],
    movementPattern: 'PULL_VERTICAL',
    equipment: 'HOME_MINIMAL',
    difficulty: 'HARD',
    defaultSets: 3,
    defaultReps: 'max',
  },
  {
    name: 'Seated Cable Row',
    primaryMuscle: 'BACK',
    secondaryMuscles: ['ARMS'],
    movementPattern: 'PULL_HORIZONTAL',
    equipment: 'FULL_GYM',
    difficulty: 'MODERATE',
    defaultSets: 3,
    defaultReps: '10-12',
  },
  {
    name: 'Standing Overhead Press',
    primaryMuscle: 'SHOULDERS',
    secondaryMuscles: ['TRICEPS', 'CORE'],
    movementPattern: 'PUSH_VERTICAL',
    equipment: 'BARBELL_ONLY',
    difficulty: 'HARD',
    defaultSets: 3,
    defaultReps: '6-8',
  },
  {
    name: 'Single-Leg Romanian Deadlift',
    primaryMuscle: 'GLUTES',
    secondaryMuscles: ['LEGS', 'CORE'],
    movementPattern: 'HINGE',
    equipment: 'DUMBBELLS_ONLY',
    difficulty: 'MODERATE',
    defaultSets: 3,
    defaultReps: '10-12',
  },
  {
    name: 'Plank',
    primaryMuscle: 'CORE',
    secondaryMuscles: ['SHOULDERS'],
    movementPattern: 'CORE',
    equipment: 'HOME_MINIMAL',
    difficulty: 'EASY',
    defaultSets: 3,
    defaultReps: '45-60s',
  },
  {
    name: 'Walking Lunge',
    primaryMuscle: 'LEGS',
    secondaryMuscles: ['GLUTES', 'CORE'],
    movementPattern: 'LUNGE',
    equipment: 'DUMBBELLS_ONLY',
    difficulty: 'MODERATE',
    defaultSets: 3,
    defaultReps: '12/leg',
  },
];

async function main() {
  console.log('Seeding exercises...');
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: JSON.stringify(exercise.secondaryMuscles),
        movementPattern: exercise.movementPattern,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        defaultSets: exercise.defaultSets,
        defaultReps: exercise.defaultReps,
      },
      create: {
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: JSON.stringify(exercise.secondaryMuscles),
        movementPattern: exercise.movementPattern,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        defaultSets: exercise.defaultSets,
        defaultReps: exercise.defaultReps,
      },
    });
  }

  const demoEmail = 'demo@liftbrain.app';
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existingUser) {
    console.log('Creating demo user demo@liftbrain.app / password: demo1234');
    await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash: await hash('demo1234', 10),
        experienceLevel: 'INTERMEDIATE',
        equipmentProfile: 'FULL_GYM',
        goalFocus: 'STRENGTH',
        scheduleWorkoutsPerWeek: 4,
        scheduleMinutesPerSession: 65,
      },
    });
  }
}

main()
  .then(async () => {
    console.log('Seed completed');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
