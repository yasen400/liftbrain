# AI Coaching Roadmap

## Goals
- Evaluate every completed workout against the assigned template to see if the user hit the prescribed sets/reps and perceived difficulty.
- Collect progress signals after each workout: logged bodyweight, perceived difficulty, optional progress photo.
- Generate an updated 7-day workout schedule aligned with the number of days the athlete can train and their current goal (strength, hypertrophy, recomposition, etc.).
- Generate a macro-targeted meal plan that adapts to the latest weight trends and visual progress.
- Surface clear coaching advice explaining *why* workout or nutrition changes were made.

## Phase 1 – Data Model Foundations
1. **New Prisma models**
   - `ProgressCheckIn` (id, userId, workoutSessionId?, weightKg, readinessScore, appetiteScore, sorenessScore, notes, photoUrl, createdAt)
   - `WeeklyPlan` (id, userId, weekOf, workoutPlanJson, mealPlanJson, aiRecommendationId, applied)
   - `MealPrep` (id, weeklyPlanId, dayIndex, mealsJson, dailyCalories, macros).
2. **Migrations**
   - Add `targetSets`/`targetRpe` to `SetEntry` (historical reference) for compliance scoring.
   - Add `goalType` enum to `User.goalFocus` for easier filtering.

## Phase 2 – Inputs & Storage
1. **Uploads**
   - Create `/api/uploads/progress-photo` that signs a PUT to S3 (or Supabase storage) and stores metadata on `ProgressCheckIn`.
   - Extend workout logging UI to capture weight + readiness + upload photo after hitting “Save session”.
2. **Weight trend logging**
   - Add lightweight `POST /api/metrics/weight` for manual entries (non-workout days).

## Phase 3 – AI Analysis Pipelines
1. **Workout compliance analyzer**
   - Cron job (daily) aggregates last 7 workouts: percent of prescribed sets completed, average RPE delta vs target, volume deltas.
   - Prompt template `buildCompliancePrompt` describing plan targets vs actual; schema returns `training_summary`, `issues`, `set_adjustments`, `day_reschedules`.
2. **Body comp evaluator**
   - Use Vision-capable model (e.g., `gpt-4.1`) with signed photo URL + latest weights to categorize `trend` (leaning, stable, gaining) and provide macro adjustments.
3. **Weekly generator**
   - Combine compliance + body comp context; prompt returns JSON with `workout_schedule` (list of days, focus, key lifts, set/rep ranges) and `meal_plan` (daily calories/macros + simple recipe ideas).
   - Persist as `WeeklyPlan` with pointer to stored AI payload.

## Phase 4 – API & UI
1. **API routes**
   - `POST /api/ai/weekly-plan` (manual trigger).
   - `GET /api/weekly-plan/current` (surface inside dashboard + mobile CTA).
   - `PATCH /api/weekly-plan/:id/apply` toggles `applied` + copies workouts into `WorkoutTemplate` rows.
2. **Dashboard modules**
   - "Coach Feedback" card summarizing compliance score + next steps.
   - "Meal Plan" accordion showing macros per day, CTA to regenerate.
   - "Schedule" widget that auto-syncs to calendar (ICS export).

## Phase 5 – Automation & Safety
1. **Schedulers**
   - Add weekly job via `cron` container to call `/api/ai/weekly-plan?auto=1` Sunday night if the user logged ≥2 sessions that week.
2. **Guardrails**
   - Enforce calorie floors/ceilings (e.g., never <10x bodyweight lbs) before saving AI output.
   - Reject workout plans that exceed 20 hard sets/muscle unless user is advanced.
3. **Audit trail**
   - Store every AI input/output pair in `AiRecommendation` for review, include reference to source check-ins/photos (only URLs, no binary data inside DB).

## Phase 6 – Stretch Enhancements
- `CoachChat` interface that lets users ask "why" adjustments were made using RAG over previous plans/check-ins.
- Habit nudges: send push/email when weight trend and workouts diverge for >5 days.
- Auto-tag exercises with fatigue levels to recommend swaps when soreness remains high.

## Implementation Order
1. Prisma migrations + seed updates.
2. Backend upload + metrics endpoints.
3. Compliance analytics utilities (pure TS functions + tests).
4. Prompt builders + OpenAI calls using existing `callOpenAI` helper.
5. API routes / cron jobs to orchestrate plan generation.
6. Frontend dashboard components + plan application workflow.

This roadmap keeps AI work focused and testable, while giving us clear checkpoints before handing full control to the model.
