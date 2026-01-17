import { prisma } from '@/lib/prisma';
import ReleaseUploadForm from '@/components/admin/ReleaseUploadForm';
import AdminShell from '@/components/admin/AdminShell';
import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import ReleaseActions from '@/components/admin/ReleaseActions';

export default async function Page({ searchParams }: { searchParams: { product?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const products = await prisma.product.findMany({ 
    select: { slug: true, name: true },
    orderBy: { name: 'asc' }
  });
  const releases = await prisma.release.findMany({ 
    include: {
      product: {
        select: { name: true, slug: true }
      }
    },
    orderBy: { uploadedAt: 'desc' }, 
    take: 20 
  });

  const preselectedProduct = searchParams.product;

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">发布管理</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          为产品上传新版本，支持多平台和架构
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-medium">上传新版本</h2>
        <div className="max-w-2xl">
          {products.length === 0 ? (
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
              还没有任何产品，请先创建产品再上传版本
            </div>
          ) : (
            <ReleaseUploadForm products={products} preselectedSlug={preselectedProduct} />
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-medium">最近发布</h2>
        {releases.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">还没有任何发布版本</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">产品</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">版本</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">上传时间</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-slate-800">
                {releases.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {r.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      v{r.version}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        r.status === 'ready' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(r.uploadedAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-3">
                        {r.url ? (
                          <a 
                            href={r.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="下载文件"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">无文件</span>
                        )}
                        <ReleaseActions 
                          releaseId={r.id} 
                          version={r.version}
                          productName={r.product.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
