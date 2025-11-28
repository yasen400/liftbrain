-- Hotfix SQL to align production SQLite schema with AI feature tables
PRAGMA foreign_keys = ON;

ALTER TABLE "SetEntry" ADD COLUMN IF NOT EXISTS "targetSets" INTEGER;
ALTER TABLE "SetEntry" ADD COLUMN IF NOT EXISTS "targetRpe" REAL;

CREATE TABLE IF NOT EXISTS "ProgressCheckIn" (
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

CREATE TABLE IF NOT EXISTS "WeeklyPlan" (
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

CREATE TABLE IF NOT EXISTS "MealPrep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weeklyPlanId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "mealsJson" TEXT NOT NULL,
    "dailyCalories" INTEGER,
    "macrosJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealPrep_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
