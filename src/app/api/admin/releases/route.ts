import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookies } from '@/lib/auth-api';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import { getR2Config, generateR2Key, deleteOldReleases } from '@/lib/r2-utils';

export async function POST(req: NextRequest) {
  try {
    // 验证用户权限
    const user = await getCurrentUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 解析表单数据
    const formData = await req.formData();
    const productId = formData.get('productId') as string;
    const version = formData.get('version') as string;
    const releaseNotes = formData.get('releaseNotes') as string;
    const file = formData.get('file') as File;

    if (!productId || !version || !file) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    // 验证产品存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    // 获取 R2 配置
    const r2Config = await getR2Config();
    if (!r2Config.endpoint || !r2Config.accessKeyId || !r2Config.bucket) {
      return NextResponse.json({ error: 'R2 配置不完整，请先在系统设置中配置' }, { status: 500 });
    }

    // 上传到 R2
    const s3Client = new S3Client({
      region: r2Config.region,
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });

    // 生成文件名：使用新的路径生成函数
    const fileExtension = file.name.split('.').pop();
    const filename = `${nanoid()}.${fileExtension}`;
    const fileKey = await generateR2Key(product.slug, version, filename);

    // 读取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 上传到 R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: r2Config.bucket,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: file.type || 'application/octet-stream',
      })
    );

    // 生成下载 URL
    const downloadUrl = r2Config.publicUrl
      ? `${r2Config.publicUrl}/${fileKey}`
      : `${r2Config.endpoint}/${r2Config.bucket}/${fileKey}`;

    // 创建 Release 记录
    const release = await prisma.release.create({
      data: {
        product: {
          connect: { id: productId },
        },
        version,
        releaseNotes: releaseNotes || null,
        r2Key: fileKey,
        url: downloadUrl,
        size: file.size,
        uploader: {
          connect: { id: user.id },
        },
        status: 'active',
      },
    });

    // 删除该产品的所有旧版本（只保留刚创建的新版本）
    const deleteResult = await deleteOldReleases(productId, [release.id]);

    // 记录日志
    if (deleteResult.deletedCount > 0) {
      try {
        await prisma.adminLog.create({
          data: {
            userId: user.id,
            action: 'auto_delete_old_releases',
            resourceType: 'release',
            resourceId: release.id,
            details: {
              productName: product.name,
              newVersion: version,
              deletedVersions: deleteResult.versions,
              deletedCount: deleteResult.deletedCount,
              preservedDownloads: deleteResult.totalDownloads,
            },
          },
        });
      } catch (e) {
        console.warn('Failed to write admin log', e);
      }
    }

    return NextResponse.json({
      success: true,
      release: {
        id: release.id,
        version: release.version,
        url: release.url,
      },
      message: deleteResult.deletedCount > 0 
        ? `新版本上传成功，已自动删除 ${deleteResult.deletedCount} 个旧版本` 
        : '版本上传成功',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || '上传失败' },
      { status: 500 }
    );
  }
}