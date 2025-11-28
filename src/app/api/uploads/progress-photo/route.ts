import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { createProgressPhotoUpload } from '@/lib/uploads';

const requestSchema = z.object({
  contentType: z.string().min(1),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await req.json());
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload', details: error }, { status: 400 });
  }

  try {
    const upload = await createProgressPhotoUpload({
      userId: session.user.id,
      contentType: payload.contentType,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
    });

    return NextResponse.json({
      uploadUrl: upload.uploadUrl,
      fileUrl: upload.fileUrl,
      expiresIn: upload.expiresIn,
      key: upload.key,
    });
  } catch (error) {
    console.error('progress photo upload error', error);
    return NextResponse.json({ error: 'Unable to create upload link' }, { status: 500 });
  }
}
