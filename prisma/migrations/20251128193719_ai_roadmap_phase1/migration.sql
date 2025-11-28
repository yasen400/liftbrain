-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'athlete',
    "age" INTEGER,
    "sex" TEXT,
    "bodyweightKg" REAL,
    "experienceLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "equipmentProfile" TEXT NOT NULL DEFAULT 'FULL_GYM',
    "goalFocus" TEXT DEFAULT 'HYPERTROPHY',
    "scheduleWorkoutsPerWeek" INTEGER,
    "scheduleMinutesPerSession" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetMetric" TEXT NOT NULL,
    "targetValue" REAL,
    "targetDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "primaryMuscle" TEXT NOT NULL,
    "secondaryMuscles" TEXT NOT NULL DEFAULT '[]',
    "movementPattern" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "defaultReps" TEXT,
    "defaultSets" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserExercisePreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserExercisePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserExercisePreference_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weeklyDays" INTEGER NOT NULL,
    "aiVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutTemplateId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "dayName" TEXT NOT NULL,
    "focusArea" TEXT,
    CONSTRAINT "TemplateDay_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateDayExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateDayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "prescribedSets" INTEGER NOT NULL,
    "prescribedReps" TEXT NOT NULL,
    "targetRpe" REAL,
    "initialWeightKg" REAL,
    "instructions" TEXT,
    CONSTRAINT "TemplateDayExercise_templateDayId_fkey" FOREIGN KEY ("templateDayId") REFERENCES "TemplateDay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TemplateDayExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "templateDayId" TEXT,
    "sessionDate" DATETIME NOT NULL,
    "perceivedDifficulty" INTEGER,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkoutSession_templateDayId_fkey" FOREIGN KEY ("templateDayId") REFERENCES "TemplateDay" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SetEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutSessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weightKg" REAL,
    "rpe" REAL,
    "isPr" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "targetSets" INTEGER,
    "targetRpe" REAL,
    CONSTRAINT "SetEntry_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SetEntry_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "promptSnapshot" TEXT NOT NULL,
    "responsePayload" TEXT NOT NULL,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgressCheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workoutSessionId" TEXT,
    "weightKg" REAL,
    "readinessScore" INTEGER,
    "appetiteScore" INTEGER,
    "sorenessScore" INTEGER,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProgressCheckIn_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekOf" DATETIME NOT NULL,
    "workoutPlanJson" TEXT NOT NULL,
    "mealPlanJson" TEXT NOT NULL,
    "aiRecommendationId" TEXT,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WeeklyPlan_aiRecommendationId_fkey" FOREIGN KEY ("aiRecommendationId") REFERENCES "AiRecommendation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealPrep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weeklyPlanId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "mealsJson" TEXT NOT NULL,
    "dailyCalories" INTEGER,
    "macrosJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealPrep_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");
