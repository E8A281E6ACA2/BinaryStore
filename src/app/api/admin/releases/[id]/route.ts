import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth-api';
import { prisma } from '@/lib/prisma';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Config } from '@/lib/r2-utils';
import { safeErrorResponse } from '@/lib/api-error';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户权限
    const auth = await requireAdminUser();
    if ('response' in auth) return auth.response;
    const { user } = auth;

    const releaseId = params.id;

    // 查询版本信息
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { downloads: true },
        },
      },
    });

    if (!release) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    const stats = {
      downloads: release._count.downloads,
      version: release.version,
      productName: release.product.name,
    };

    // 删除 R2 文件
    try {
      const r2Config = await getR2Config();
      if (r2Config.bucket && r2Config.endpoint && r2Config.accessKeyId) {
        const s3Client = new S3Client({
          region: r2Config.region,
          endpoint: r2Config.endpoint,
          credentials: {
            accessKeyId: r2Config.accessKeyId,
            secretAccessKey: r2Config.secretAccessKey,
          },
        });

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: r2Config.bucket,
            Key: release.r2Key,
          })
        );
      }
    } catch (r2Error) {
      console.error('Failed to delete R2 file:', r2Error);
      // 继续执行数据库删除
    }

    // 删除版本（会级联删除相关的 downloads）
    await prisma.release.delete({
      where: { id: releaseId },
    });

    // 记录日志
    try {
      await prisma.adminLog.create({
        data: {
          userId: user.id,
          action: 'delete_release',
          resourceType: 'release',
          resourceId: releaseId,
          details: {
            productName: release.product.name,
            productSlug: release.product.slug,
            version: release.version,
            deletedDownloads: stats.downloads,
            r2Key: release.r2Key,
          },
        },
      });
    } catch (e) {
      console.warn('Failed to write admin log', e);
    }

    return NextResponse.json({
      success: true,
      message: '版本删除成功',
      stats,
    });
  } catch (error: any) {
    console.error('Delete release error:', error);
    return safeErrorResponse('删除失败，请稍后重试', 500, error);
  }
}
