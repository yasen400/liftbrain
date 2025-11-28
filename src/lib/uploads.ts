import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

type UploadConfig = {
  bucket: string;
  region: string;
  publicBaseUrl?: string;
  accessKeyId: string;
  secretAccessKey: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: UploadConfig | null = null;

function ensureUploadsConfig(): UploadConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const bucket = process.env.PROGRESS_PHOTO_BUCKET;
  const region = process.env.PROGRESS_PHOTO_REGION ?? process.env.AWS_REGION;
  const accessKeyId = process.env.PROGRESS_PHOTO_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.PROGRESS_PHOTO_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.PROGRESS_PHOTO_PUBLIC_URL;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Progress photo uploads are not configured. Set PROGRESS_PHOTO_BUCKET, PROGRESS_PHOTO_REGION, and AWS credentials env vars.'
    );
  }

  cachedConfig = {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl,
  };
  return cachedConfig;
}

function getS3Client(config: UploadConfig) {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return cachedClient;
}

function buildObjectKey(userId: string, fileName?: string) {
  const safeName = fileName?.replace(/[^a-zA-Z0-9-_\.]/g, '') ?? 'upload';
  const extension = safeName.includes('.') ? safeName.split('.').pop() : undefined;
  const suffix = extension ? `.${extension}` : '';
  return `progress-photos/${userId}/${Date.now()}-${crypto.randomUUID()}${suffix}`;
}

function ensureAllowedFile(contentType: string, fileSize?: number) {
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error('Only JPEG, PNG, HEIC/HEIF, or WebP images are allowed.');
  }
  if (typeof fileSize === 'number' && fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds the 10MB limit.');
  }
}

export async function createProgressPhotoUpload(params: {
  userId: string;
  contentType: string;
  fileName?: string;
  fileSize?: number;
}) {
  ensureAllowedFile(params.contentType, params.fileSize);
  const config = ensureUploadsConfig();
  const key = buildObjectKey(params.userId, params.fileName);
  const client = getS3Client(config);

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: params.contentType,
    Metadata: {
      userId: params.userId,
    },
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
  const fileUrl = config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/$/, '')}/${key}`
    : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    fileUrl,
    key,
    expiresIn: 60,
  };
}
