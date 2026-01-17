import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromCookies } from '@/lib/auth-api';
import { S3Client, CompleteMultipartUploadCommand, CompletedPart } from '@aws-sdk/client-s3';
import { HeadObjectCommand } from '@aws-sdk/client-s3';

const S3_BUCKET = process.env.R2_BUCKET || process.env.S3_BUCKET;
const S3_ENDPOINT = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
const S3_REGION = process.env.R2_REGION || process.env.S3_REGION || 'auto';

function createS3Client() {
  const opts: any = {};
  if (process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID) {
    opts.credentials = {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY!,
    };
  }
  if (S3_REGION) opts.region = S3_REGION;
  if (S3_ENDPOINT) opts.endpoint = S3_ENDPOINT;
  return new S3Client(opts);
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { releaseId, key, uploadId, parts } = body;
    if (!S3_BUCKET) return NextResponse.json({ error: 'S3 not configured' }, { status: 500 });

    const release = releaseId ? await prisma.release.findUnique({ where: { id: releaseId } }) : await prisma.release.findFirst({ where: { r2Key: key } });
    if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });

    const client = createS3Client();

    const completed: CompletedPart[] = (parts || []).map((p: any) => ({ ETag: p.ETag, PartNumber: p.PartNumber }));
    const cmd = new CompleteMultipartUploadCommand({ Bucket: S3_BUCKET, Key: key || release.r2Key, UploadId: uploadId, MultipartUpload: { Parts: completed } });
    await client.send(cmd);

    // head object
    const head = await client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key || release.r2Key }));
    const size = head.ContentLength || undefined;
    const etag = head.ETag || undefined;

    // public URL
    let publicUrl = release.url;
    if (!publicUrl) {
      if (process.env.R2_PUBLIC_URL) {
        publicUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${encodeURIComponent(release.r2Key)}`;
      } else if (S3_ENDPOINT) {
        publicUrl = `${S3_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}/${encodeURIComponent(release.r2Key)}`;
      }
    }

    const updated = await prisma.release.update({ where: { id: release.id }, data: { size: size ? Number(size) : undefined, url: publicUrl || release.url, status: 'ready' } });

    // audit
    try {
      await prisma.adminLog.create({ data: { userId: user.id, action: 'multipart_complete', resourceType: 'release', resourceId: release.id, details: { key: release.r2Key, etag }, ip: undefined } });
    } catch (e) {
      console.warn('Failed to write admin log', e);
    }

    return NextResponse.json({ success: true, release: updated, etag });
  } catch (err) {
    console.error('Multipart complete error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
