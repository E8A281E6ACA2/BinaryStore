import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import ExportButtons from '@/components/admin/ExportButtons';
import StatsCharts from '@/components/admin/StatsCharts';
import Link from 'next/link';

// 获取统计数据
async function getStats(days: number = 30) {
  // 总下载次数
  const totalDownloads = await prisma.download.count();

  // 计算时间范围
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 时间范围内的下载次数
  const periodDownloads = await prisma.download.count({
    where: {
      downloadedAt: {
        gte: startDate,
      },
    },
  });

  // 产品统计
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      _count: {
        select: {
          downloads: true,
          releases: true,
        },
      },
    },
    orderBy: {
      downloads: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  // 版本统计
  const totalReleases = await prisma.release.count();

  // 用户统计
  const totalUsers = await prisma.user.count();

  // 最近下载记录
  const recentDownloads = await prisma.download.findMany({
    take: 20,
    orderBy: { downloadedAt: 'desc' },
    select: {
      id: true,
      platform: true,
      arch: true,
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
  });

  // 按日期统计下载量
  const downloadsByDate = await prisma.$queryRaw<
    Array<{ date: string; count: bigint }>
  >`
    SELECT 
      DATE("downloadedAt") as date,
      COUNT(*) as count
    FROM downloads
    WHERE "downloadedAt" >= ${startDate}
    GROUP BY DATE("downloadedAt")
    ORDER BY date DESC
  `;

  // 按平台统计
  const downloadsByPlatform = await prisma.download.groupBy({
    by: ['platform'],
    _count: true,
    orderBy: {
      _count: {
        platform: 'desc',
      },
    },
  });

  // 按架构统计
  const downloadsByArch = await prisma.download.groupBy({
    by: ['arch'],
    _count: true,
    orderBy: {
      _count: {
        arch: 'desc',
      },
    },
  });

  // 总存储大小
  const totalStorageResult = await prisma.release.aggregate({
    _sum: {
      size: true,
    },
  });

  const totalStorage = totalStorageResult._sum.size || 0;

  return {
    totalDownloads,
    periodDownloads,
    totalReleases,
    totalUsers,
    totalStorage,
    products,
    recentDownloads,
    downloadsByDate: downloadsByDate.map((d) => ({
      date: d.date,
      count: Number(d.count),
    })),
    downloadsByPlatform: downloadsByPlatform.map((p) => ({
      platform: p.platform,
      count: p._count,
    })),
    downloadsByArch: downloadsByArch.map((a) => ({
      arch: a.arch,
      count: a._count,
    })),
    days,
  };
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const days = parseInt(searchParams.days || '30');
  const stats = await getStats(days);

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">统计数据</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            系统整体数据概览
          </p>
        </div>
        
        <div className="flex gap-4">
          {/* 导出按钮 */}
          <ExportButtons days={stats.days} />
          
          {/* 时间范围选择 */}
          <div className="flex gap-2">
            {[7, 30, 90, 365].map((d) => (
              <Link
                key={d}
                href={`/admin/stats?days=${d}`}
                className={
                  'rounded-lg px-4 py-2 text-sm font-medium transition ' +
                  (days === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600')
                }
              >
                {d === 365 ? '全部' : `${d}天`}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:border-gray-700 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                最近{stats.days}天下载
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.periodDownloads.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                总计: {stats.totalDownloads.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-blue-500 p-3 text-white">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-6 dark:border-gray-700 dark:from-green-900/20 dark:to-green-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">产品数量</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.products.length}
              </p>
            </div>
            <div className="rounded-full bg-green-500 p-3 text-white">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 dark:border-gray-700 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">发布版本</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalReleases}
              </p>
            </div>
            <div className="rounded-full bg-purple-500 p-3 text-white">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100 p-6 dark:border-gray-700 dark:from-orange-900/20 dark:to-orange-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">存储空间</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {(stats.totalStorage / 1024 / 1024 / 1024).toFixed(2)} GB
              </p>
            </div>
            <div className="rounded-full bg-orange-500 p-3 text-white">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 图表可视化 */}
      <StatsCharts
        downloadsByDate={stats.downloadsByDate}
        downloadsByPlatform={stats.downloadsByPlatform}
        downloadsByArch={stats.downloadsByArch}
        products={stats.products}
      />

      {/* 最近下载记录 */}
      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-800">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">最近下载记录</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">最近20条下载记录</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  产品
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  版本
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  平台/架构
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  下载时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.recentDownloads.map((download: any) => (
                <tr key={download.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    {download.release ? (
                      <Link
                        href={`/admin/products/${download.release.product.slug}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {download.release.product.name}
                      </Link>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                    {download.release?.version || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {download.platform} / {download.arch}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {new Date(download.downloadedAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}