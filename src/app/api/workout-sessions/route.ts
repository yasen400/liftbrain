import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { ProgressCheckIn } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { workoutSessionSchema, ProgressCheckInInput } from '@/lib/validators';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId: session.user.id,
      sessionDate: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    include: {
      setEntries: true,
      templateDay: true,
    },
    orderBy: { sessionDate: 'desc' },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const json = await req.json();
  const payload = workoutSessionSchema.parse(json);

  const createdSession = await prisma.workoutSession.create({
    data: {
      userId: session.user.id,
      sessionDate: new Date(payload.sessionDate),
      templateDayId: payload.templateDayId,
      durationMinutes: payload.durationMinutes,
      perceivedDifficulty: payload.perceivedDifficulty,
      notes: payload.notes,
      setEntries: {
        createMany: {
          data: payload.sets.map((set) => ({
            exerciseId: set.exerciseId,
            setNumber: set.setNumber,
            reps: set.reps,
            weightKg: set.weightKg ?? null,
            rpe: set.rpe ?? null,
            notes: set.notes,
            isPr: set.isPr ?? false,
          })),
        },
      },
    },
    include: {
      setEntries: true,
    },
  });

  const checkInPayload = payload.progressCheckIn;
  let progressCheckIn: ProgressCheckIn | null = null;
  if (checkInPayload && hasProgressCheckInData(checkInPayload)) {
    progressCheckIn = await prisma.progressCheckIn.create({
      data: {
        userId: session.user.id,
        workoutSessionId: createdSession.id,
        weightKg: checkInPayload.weightKg,
        readinessScore: checkInPayload.readinessScore,
        appetiteScore: checkInPayload.appetiteScore,
        sorenessScore: checkInPayload.sorenessScore,
        notes: checkInPayload.notes,
        photoUrl: checkInPayload.photoUrl,
      },
    });
  }

  return NextResponse.json({ session: createdSession, progressCheckIn }, { status: 201 });
}

function hasProgressCheckInData(data: ProgressCheckInInput) {
  return (
    data.weightKg !== undefined ||
    data.readinessScore !== undefined ||
    data.appetiteScore !== undefined ||
    data.sorenessScore !== undefined ||
    (typeof data.notes === 'string' && data.notes.trim().length > 0) ||
    (typeof data.photoUrl === 'string' && data.photoUrl.length > 0)
  );
}
