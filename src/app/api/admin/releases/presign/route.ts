import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromCookies } from '@/lib/auth-api';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Config, generateR2Key } from '@/lib/r2-utils';

async function createS3Client() {
  const config = await getR2Config();
  
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { productSlug, version, filename, contentType } = body;
    if (!productSlug || !version || !filename) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 读取 R2 配置
    const storageConfig = await getR2Config();
    if (!storageConfig.bucket) {
      return NextResponse.json({ error: 'R2 未配置' }, { status: 500 });
    }

    // Ensure product exists
    let product = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) {
      product = await prisma.product.create({ data: { slug: productSlug, name: productSlug } });
    }

    // 使用新的路径生成函数
    const key = await generateR2Key(productSlug, version, filename);

    // create DB release record (uploading)
    const release = await prisma.release.create({
      data: {
        productId: product.id,
        version,
        r2Key: key,
        url: '',
        uploadedBy: user.id,
        status: 'uploading',
      },
    });

    // audit log
    try {
      await prisma.adminLog.create({ data: { userId: user.id, action: 'presign', resourceType: 'release', resourceId: release.id, details: { key, filename }, ip: undefined } });
    } catch (e) {
      console.warn('Failed to write admin log', e);
    }

    // Create presigned PUT URL
    const client = await createS3Client();
    const cmd = new PutObjectCommand({ Bucket: storageConfig.bucket, Key: key, ContentType: contentType || 'application/octet-stream' });
    const signedUrl = await getSignedUrl(client, cmd, { expiresIn: 60 * 60 });

    return NextResponse.json({ success: true, presignedUrl: signedUrl, releaseId: release.id, key });
  } catch (err) {
    console.error('Presign error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
