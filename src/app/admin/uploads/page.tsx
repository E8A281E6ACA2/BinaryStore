import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import Link from 'next/link';

export default async function UploadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const releases = await prisma.release.findMany({
    include: {
      product: {
        select: {
          slug: true,
          name: true,
        },
      },
      uploader: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          downloads: true,
        },
      },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">上传管理</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          共 {releases.length} 个版本
        </div>
      </div>

      {releases.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <div className="mb-4 text-6xl">📦</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            暂无上传记录
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            还没有任何产品发布版本
          </p>
          <Link
            href="/admin/products"
            className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            前往产品管理
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  产品
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  版本
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  文件大小
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  下载次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  上传者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  上传时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-slate-800">
              {releases.map((release) => (
                <tr key={release.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/admin/products/${release.product.slug}`}
                      className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {release.product.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    v{release.version}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {release.size ? `${(release.size / 1024 / 1024).toFixed(2)} MB` : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {release._count.downloads.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {release.uploader?.name || release.uploader?.email || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(release.uploadedAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <a
                        href={release.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        下载
                      </a>
                      <Link
                        href={`/admin/products/${release.product.slug}`}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        查看
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">总版本数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {releases.length}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">总下载次数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {releases.reduce((sum, r) => sum + r._count.downloads, 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">总存储大小</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {(
              releases.reduce((sum, r) => sum + (r.size || 0), 0) /
              1024 /
              1024 /
              1024
            ).toFixed(2)}{' '}
            GB
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
