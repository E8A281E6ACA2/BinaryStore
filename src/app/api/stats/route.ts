import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('password');

  // Simple password protection
  if (password !== process.env.STATS_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Total downloads
    const totalDownloads = await prisma.download.count();

    // Downloads by product
    const productStats = await prisma.product.findMany({
      include: {
        _count: {
          select: { downloads: true },
        },
        downloads: {
          select: {
            platform: true,
            version: true,
            downloadedAt: true,
          },
          orderBy: {
            downloadedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    // Platform distribution
    const platformStats = await prisma.download.groupBy({
      by: ['platform'],
      _count: true,
    });

    // Recent downloads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDownloads = await prisma.download.count({
      where: {
        downloadedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return NextResponse.json({
      totalDownloads,
      recentDownloads,
      productStats: productStats.map((p) => ({
        slug: p.slug,
        name: p.name,
        downloads: p._count.downloads,
        recentDownloads: p.downloads,
      })),
      platformStats: platformStats.map((p) => ({
        platform: p.platform,
        count: p._count,
      })),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
