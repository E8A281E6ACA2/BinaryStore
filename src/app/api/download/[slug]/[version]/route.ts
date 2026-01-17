import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { safeErrorResponse } from '@/lib/api-error';

const S3_BUCKET = process.env.R2_BUCKET;
const S3_ENDPOINT = process.env.R2_ENDPOINT;
const S3_REGION = process.env.R2_REGION || 'auto';

function createS3Client() {
  const opts: any = {};
  if (process.env.R2_ACCESS_KEY_ID) {
    opts.credentials = {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    };
  }
  if (S3_REGION) opts.region = S3_REGION;
  if (S3_ENDPOINT) opts.endpoint = S3_ENDPOINT;
  return new S3Client(opts);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; version: string } }
) {
  try {
    const { slug, version } = params;

    // 查找产品和版本
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, name: true }
    });

    if (!product) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    // 查找该版本的 release
    const release = await prisma.release.findFirst({
      where: {
        productId: product.id,
        version: version
      },
      select: {
        id: true,
        version: true,
        url: true,
        status: true,
        r2Key: true
      }
    });

    if (!release) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    if (release.status !== 'ready' && release.status !== 'active') {
      return NextResponse.json({ error: '版本未就绪' }, { status: 400 });
    }

    // 记录下载
    await prisma.download.create({
      data: {
        productId: product.id,
        version: release.version,
        platform: 'unknown',
        arch: 'unknown',
        releaseId: release.id
      }
    }).catch(err => {
      console.error('Failed to record download:', err);
    });

    // 检查是否有有效的公开 URL
    const hasValidPublicUrl = release.url && 
      !release.url.includes('你的CDN') && 
      !release.url.includes('example.com') &&
      release.url.startsWith('http');

    if (hasValidPublicUrl) {
      // 有公开 URL，直接重定向
      return NextResponse.redirect(release.url!);
    } else if (release.r2Key && S3_BUCKET) {
      // 没有公开 URL，生成临时签名 URL（有效期 1 小时）
      const client = createS3Client();
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: release.r2Key,
      });
      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      return NextResponse.redirect(signedUrl);
    } else {
      return NextResponse.json({ error: '下载链接不可用' }, { status: 404 });
    }
  } catch (error) {
    console.error('Download error:', error);
    return safeErrorResponse('下载失败，请稍后重试', 500, error);
  }
}
