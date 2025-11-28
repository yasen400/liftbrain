import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { GOAL_FOCUS_VALUES } from '@/lib/constants/goalFocus';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().min(13).max(90).optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  bodyweightKg: z.number().min(30).max(300).optional(),
  experienceLevel: z.string().optional(),
  equipmentProfile: z.string().optional(),
  goalFocus: z.enum(GOAL_FOCUS_VALUES).optional(),
});

export async function POST(req: NextRequest) {
  const payload = registerSchema.parse(await req.json());
  const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
  }

  const passwordHash = await hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      email: payload.email.toLowerCase(),
      passwordHash,
      age: payload.age,
      sex: payload.sex,
      bodyweightKg: payload.bodyweightKg,
      experienceLevel: payload.experienceLevel ?? 'BEGINNER',
      equipmentProfile: payload.equipmentProfile ?? 'FULL_GYM',
      goalFocus: payload.goalFocus ?? 'HYPERTROPHY',
    },
  });

  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
}
