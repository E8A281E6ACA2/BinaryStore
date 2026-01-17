import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import Link from 'next/link';
import ProductActions from '@/components/admin/ProductActions';

export default async function ProductsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      icon: true,
      createdAt: true,
      releases: {
        orderBy: { uploadedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 手动计算统计
  const productsWithStats = await Promise.all(
    products.map(async (product) => {
      const [releaseCount, downloadCount] = await Promise.all([
        prisma.release.count({ where: { productId: product.id } }),
        prisma.download.count({ where: { productId: product.id } }),
      ]);
      return { ...product, releaseCount, downloadCount };
    })
  );

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">产品管理</h1>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-slate-800">
          <p className="mb-4 text-gray-500 dark:text-gray-400">还没有任何产品</p>
          <Link
            href="/admin/products/new"
            className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            创建第一个产品
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  产品名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Slug
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  发布版本
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  总下载量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {productsWithStats.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.icon && (
                        <img src={product.icon} alt="" className="h-8 w-8 rounded" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        {product.tagline && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.tagline}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                    {product.slug}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                    {product.releaseCount}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                    {product.downloadCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(product.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/releases?product=${product.slug}`}
                        className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                        title={product.releaseCount === 0 ? "上传第一个版本" : "上传新版本"}
                      >
                        上传版本
                      </Link>
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                        title="查看前台页面"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                      <ProductActions productId={product.id} productName={product.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
