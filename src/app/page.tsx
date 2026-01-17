import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

async function getProductsWithDownloads() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      icon: true,
      releases: {
        select: { version: true },
        orderBy: { uploadedAt: 'desc' },
        take: 1,
      },
      _count: {
        select: { downloads: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map(p => ({
    slug: p.slug,
    name: p.name,
    tagline: p.tagline || '暂无描述',
    icon: p.icon || '',
    downloadCount: p._count.downloads,
    latestVersion: p.releases[0]?.version,
  }));
}

export const revalidate = 3600; // 每小时重新验证

export default async function Home() {
  // 检查是否有管理员账户存在
  const hasAdminUsers = await prisma.user.count({ where: { role: 'ADMIN' } });
  
  // 如果没有管理员账户，跳转到初始化页面
  if (hasAdminUsers === 0) {
    redirect('/admin/init');
  }

  const products = await getProductsWithDownloads();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-20 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="mb-6 text-5xl font-bold md:text-6xl lg:text-7xl animate-fade-in">
            下载您需要的软件
          </h1>
          <p className="mb-8 text-xl text-white/90 md:text-2xl animate-slide-up">
            简单、快速、安全的软件下载体验
          </p>
          <div className="flex justify-center space-x-4 animate-slide-up">
            <a
              href="#products"
              className="rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              浏览软件
            </a>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-4xl font-bold text-gray-900 dark:text-white">
            可用软件
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                downloadCount={product.downloadCount}
                latestVersion={product.latestVersion}
              />
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg">暂无可用软件</p>
              <p className="mt-2 text-sm">
                请在管理后台添加产品
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
