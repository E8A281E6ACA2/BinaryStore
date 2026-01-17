export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductData(params.slug);

  if (!product) {
    notFound();
  }

  const downloadCount = product._count.downloads;
  const latestRelease = product.releases[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-20 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-col items-center text-center md:flex-row md:text-left">
            {/* Icon */}
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm shadow-2xl md:mb-0 md:mr-8">
              {product.icon ? (
                <img src={product.icon} alt={product.name} className="h-20 w-20 object-contain" />
              ) : (
                <span className="text-6xl">📦</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="mb-4 text-5xl font-bold md:text-6xl">{product.name}</h1>
              <p className="mb-6 text-xl text-white/90">{product.tagline || '暂无描述'}</p>
              <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
                {latestRelease && (
                  <span className="rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                    版本 {latestRelease.version}
                  </span>
                )}
                <span className="rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                  {downloadCount.toLocaleString()} 次下载
                </span>
                {product.repository && (
                  <a
                    href={product.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm transition hover:bg-white/30"
                  >
                    GitHub →
                  </a>
                )}
                {product.website && (
                  <a
                    href={product.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm transition hover:bg-white/30"
                  >
                    官网 →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      {latestRelease ? (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
              下载 {product.name}
            </h2>
            <div className="mx-auto max-w-2xl">
              <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-900">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      版本 {latestRelease.version}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      发布于 {new Date(latestRelease.uploadedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  {latestRelease.size && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {(latestRelease.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </div>
                <a
                  href={`/api/download/${product.slug}/${latestRelease.version}`}
                  className="block w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-center text-lg font-semibold text-white shadow-lg transition hover:shadow-xl"
                >
                  立即下载
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 dark:border-gray-700 dark:bg-slate-800/50">
                <div className="mb-4 text-6xl">📦</div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  暂无可用版本
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  该软件还没有发布任何版本，请稍后再来查看
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {product.features && product.features.length > 0 && (
        <section className="bg-gray-50 py-16 dark:bg-slate-800/50">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">主要特性</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {product.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900"
                >
                  <svg
                    className="mt-1 h-6 w-6 flex-shrink-0 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      {product.description && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="prose prose-lg mx-auto dark:prose-invert">
              <div className="whitespace-pre-wrap">{product.description}</div>
            </div>
          </div>
        </section>
      )}

      {/* Version History */}
      {product.releases.length > 0 && (
        <section className="bg-gray-50 py-16 dark:bg-slate-800/50">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">版本历史</h2>
            <div className="space-y-6">
              {product.releases.map((release) => (
                <div
                  key={release.id}
                  className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      版本 {release.version}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(release.uploadedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  {release.releaseNotes && (
                    <div className="prose dark:prose-invert">
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {release.releaseNotes}
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <a
                      href={release.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      下载此版本
                      <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

async function getProductData(slug: string) {
  return await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      icon: true,
      banner: true,
      features: true,
      website: true,
      repository: true,
      createdAt: true,
      updatedAt: true,
      releases: {
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          version: true,
          releaseNotes: true,
          uploadedAt: true,
          url: true,
          size: true,
        },
      },
      _count: {
        select: { downloads: true },
      },
    },
  });
}

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

