import { getCurrentUserFromCookies } from '@/lib/auth-api';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Config } from '@/lib/r2-utils';

// 更新产品
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, name, tagline, description, icon, banner, website, repository, features } = body;

    // 检查 slug 是否已被其他产品使用
    const existingProduct = await prisma.product.findFirst({
      where: {
        slug,
        NOT: {
          id: params.id,
        },
      },
    });

    if (existingProduct) {
      return NextResponse.json({ error: '该 Slug 已被使用' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        slug,
        name,
        tagline,
        description,
        icon,
        banner,
        website,
        repository,
        features: features || [],
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// 删除产品
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const productId = params.id;

    // 查询产品及其所有版本和下载记录
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        releases: {
          select: { id: true, r2Key: true, version: true },
        },
        _count: {
          select: {
            downloads: true,
            releases: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    // 统计要删除的数据
    const stats = {
      releases: product._count.releases,
      downloads: product._count.downloads,
      files: product.releases.length,
    };

    // 获取 R2 配置并删除文件
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

        // 并发删除所有 R2 文件
        await Promise.allSettled(
          product.releases.map((release) =>
            s3Client.send(
              new DeleteObjectCommand({
                Bucket: r2Config.bucket,
                Key: release.r2Key,
              })
            )
          )
        );
      }
    } catch (r2Error) {
      console.error('Failed to delete R2 files:', r2Error);
      // 继续执行数据库删除
    }

    // 删除产品（会级联删除 releases 和 downloads）
    await prisma.product.delete({
      where: { id: productId },
    });

    // 记录日志
    try {
      await prisma.adminLog.create({
        data: {
          userId: user.id,
          action: 'delete_product',
          resourceType: 'product',
          resourceId: productId,
          details: {
            productName: product.name,
            slug: product.slug,
            deletedReleases: stats.releases,
            deletedDownloads: stats.downloads,
            deletedFiles: stats.files,
          },
        },
      });
    } catch (e) {
      console.warn('Failed to write admin log', e);
    }

    return NextResponse.json({
      success: true,
      message: '产品删除成功',
      stats,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
