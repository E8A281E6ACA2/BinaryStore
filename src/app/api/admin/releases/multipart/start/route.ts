import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromCookies } from '@/lib/auth-api';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';
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
    const { productSlug, version, filename, contentType, size, partSize = 5 * 1024 * 1024 } = body;
    if (!productSlug || !version || !filename || !size) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    
    const config = await getR2Config();
    if (!config.bucket) return NextResponse.json({ error: 'R2 未配置' }, { status: 500 });

    // Ensure product exists
    let product = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) product = await prisma.product.create({ data: { slug: productSlug, name: productSlug } });

    // 使用新的路径生成函数
    const key = await generateR2Key(productSlug, version, filename);

    // create DB release record (uploading)
    const release = await prisma.release.create({ data: { productId: product.id, version, r2Key: key, url: '', uploadedBy: user.id, status: 'uploading' } });

    const client = await createS3Client();
    const create = await client.send(new CreateMultipartUploadCommand({ Bucket: config.bucket, Key: key, ContentType: contentType || 'application/octet-stream' }));
    const uploadId = create.UploadId;

    const parts = [];
    const partCount = Math.ceil(Number(size) / partSize);
    for (let i = 1; i <= partCount; i++) {
      const cmd = new UploadPartCommand({ Bucket: config.bucket, Key: key, UploadId: uploadId!, PartNumber: i });
      const url = await getSignedUrl(client, cmd, { expiresIn: 60 * 60 });
      parts.push({ partNumber: i, url });
    }

    // audit
    try {
      await prisma.adminLog.create({ data: { userId: user.id, action: 'multipart_start', resourceType: 'release', resourceId: release.id, details: { key, partCount }, ip: undefined } });
    } catch (e) {
      console.warn('Failed to write admin log', e);
    }

    return NextResponse.json({ success: true, releaseId: release.id, uploadId, key, parts });
  } catch (err) {
    console.error('Multipart start error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
