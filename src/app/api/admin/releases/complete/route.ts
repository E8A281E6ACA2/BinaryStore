import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromCookies } from '@/lib/auth-api';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { deleteOldReleases } from '@/lib/r2-utils';

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
    const { releaseId, key } = body;
    if (!S3_BUCKET) return NextResponse.json({ error: 'S3 not configured' }, { status: 500 });

    // find release
    const release = releaseId 
      ? await prisma.release.findUnique({ 
          where: { id: releaseId },
          include: { product: { select: { name: true } } }
        }) 
      : await prisma.release.findFirst({ 
          where: { r2Key: key },
          include: { product: { select: { name: true } } }
        });
    if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });

    // Inspect object in S3/R2
    const client = createS3Client();
    const head = await client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: release.r2Key }));

    const size = head.ContentLength || undefined;
    const etag = head.ETag || undefined;

    // Construct public URL if possible
    let publicUrl = release.url;
    if (!publicUrl) {
      if (process.env.R2_PUBLIC_URL) {
        publicUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${encodeURIComponent(release.r2Key)}`;
      } else if (S3_ENDPOINT) {
        publicUrl = `${S3_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}/${encodeURIComponent(release.r2Key)}`;
      }
    }

    const updated = await prisma.release.update({ 
      where: { id: release.id }, 
      data: { 
        size: size ? Number(size) : undefined, 
        url: publicUrl || release.url, 
        status: 'ready' 
      } 
    });

    // 删除该产品的所有旧版本（只保留刚上传的新版本）
    const deleteResult = await deleteOldReleases(release.productId, [release.id]);

    // audit log
    try {
      await prisma.adminLog.create({ 
        data: { 
          userId: user.id, 
          action: 'complete_upload', 
          resourceType: 'release', 
          resourceId: release.id, 
          details: { key: release.r2Key, size, etag }, 
          ip: undefined 
        } 
      });
      
      // 记录自动删除旧版本的日志
      if (deleteResult.deletedCount > 0) {
        await prisma.adminLog.create({
          data: {
            userId: user.id,
            action: 'auto_delete_old_releases',
            resourceType: 'release',
            resourceId: release.id,
            details: {
              productName: release.product.name,
              newVersion: release.version,
              deletedVersions: deleteResult.versions,
              deletedCount: deleteResult.deletedCount,
              preservedDownloads: deleteResult.totalDownloads,
            },
          },
        });
      }
    } catch (e) {
      console.warn('Failed to write admin log', e);
    }

    return NextResponse.json({ 
      success: true, 
      release: updated, 
      etag,
      message: deleteResult.deletedCount > 0 
        ? `上传完成，已自动删除 ${deleteResult.deletedCount} 个旧版本` 
        : '上传完成',
    });
  } catch (err) {
    console.error('Complete upload error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
