import { getCurrentUserFromCookies } from '@/lib/auth-api';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');
  const format = searchParams.get('format') || 'csv'; // csv or json

  try {
    // 计算时间范围
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取下载记录
    const downloads = await prisma.download.findMany({
      where: {
        downloadedAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        platform: true,
        arch: true,
        version: true,
        downloadedAt: true,
        release: {
          select: {
            version: true,
            product: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        downloadedAt: 'desc',
      },
    });

    if (format === 'json') {
      // JSON 格式导出
      return NextResponse.json({
        period: `${days}天`,
        exportDate: new Date().toISOString(),
        totalRecords: downloads.length,
        data: downloads.map((d) => ({
          产品名称: d.release?.product.name || '-',
          产品标识: d.release?.product.slug || '-',
          版本: d.release?.version || d.version,
          平台: d.platform,
          架构: d.arch,
          下载时间: d.downloadedAt.toISOString(),
        })),
      });
    }

    // CSV 格式导出
    const csvHeaders = ['产品名称', '产品标识', '版本', '平台', '架构', '下载时间'];
    const csvRows = downloads.map((d) => [
      d.release?.product.name || '-',
      d.release?.product.slug || '-',
      d.release?.version || d.version,
      d.platform,
      d.arch,
      new Date(d.downloadedAt).toLocaleString('zh-CN'),
    ]);

    const csv = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // 添加 BOM 以支持 Excel 正确显示中文
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="download-stats-${days}days-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
