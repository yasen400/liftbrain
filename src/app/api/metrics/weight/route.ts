import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const weightEntrySchema = z.object({
  weightKg: z.number().min(30).max(300),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().max(280).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: z.infer<typeof weightEntrySchema>;
  try {
    payload = weightEntrySchema.parse(await req.json());
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload', details: error }, { status: 400 });
  }

  const entry = await prisma.progressCheckIn.create({
    data: {
      userId: session.user.id,
      workoutSessionId: null,
      weightKg: payload.weightKg,
      notes: payload.notes,
      createdAt: payload.recordedAt ? new Date(payload.recordedAt) : undefined,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
