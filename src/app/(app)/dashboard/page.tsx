import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { KeyStats } from '@/components/dashboard/KeyStats';
import { AiCoachCard } from '@/components/dashboard/AiCoachCard';
import { UpcomingSessionsCard } from '@/components/dashboard/UpcomingSessionsCard';
import { CoachFeedbackCard } from '@/components/dashboard/CoachFeedbackCard';
import { WeeklyScheduleCard } from '@/components/dashboard/WeeklyScheduleCard';
import { MealPlanCard } from '@/components/dashboard/MealPlanCard';
import { VolumeByMuscleChart } from '@/components/charts/VolumeByMuscleChart';
import { OneRmTrendChart } from '@/components/charts/OneRmTrendChart';
import { Card, CardHeader } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import { getDashboardData } from '@/lib/dashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { keyStats, volumeByMuscle, oneRmTrends, upcomingSessions, recommendation, complianceSummary, bodyCompSummary, weeklyPlan } =
    await getDashboardData(
    session.user.id,
    );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-600">LiftBrain</p>
        <h1 className="text-3xl font-semibold text-gray-900">Training Control Tower</h1>
        <p className="mt-2 text-gray-600">
          Snapshot across adherence, load progression, and the latest AI adjustments for the week.
        </p>
      </header>
      <KeyStats stats={keyStats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Weekly volume" description="Hard sets per muscle group" />
          <VolumeByMuscleChart data={volumeByMuscle} />
        </Card>
        <Card>
          <CardHeader title="Estimated 1RM" description="Trailing 90 days" />
          <OneRmTrendChart data={oneRmTrends} />
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingSessionsCard sessions={upcomingSessions} />
        <CoachFeedbackCard compliance={complianceSummary} bodyComp={bodyCompSummary} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklyScheduleCard plan={weeklyPlan} />
        <MealPlanCard plan={weeklyPlan} />
      </div>
      <AiCoachCard recommendation={recommendation} />
    </div>
  );
}
