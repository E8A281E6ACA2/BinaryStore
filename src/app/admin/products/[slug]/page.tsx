export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
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
        include: {
          uploader: {
            select: { email: true, name: true },
          },
          _count: {
            select: { downloads: true },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!product) notFound();

  return (
    <AdminShell>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ← 返回产品列表
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {product.icon && (
              <img src={product.icon} alt="" className="h-16 w-16 rounded-lg" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              {product.tagline && (
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{product.tagline}</p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Slug: {product.slug}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/products/${product.slug}/edit`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
            >
              编辑产品
            </Link>
            <Link
              href={`/admin/releases/new?product=${product.slug}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              上传新版本
            </Link>
          </div>
        </div>

        {/* 产品信息卡片 */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* 基本信息 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold">基本信息</h2>
            <dl className="space-y-3 text-sm">
              {product.website && (
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">官网</dt>
                  <dd>
                    <a
                      href={product.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {product.website}
                    </a>
                  </dd>
                </div>
              )}
              {product.repository && (
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">仓库</dt>
                  <dd>
                    <a
                      href={product.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {product.repository}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">创建时间</dt>
                <dd>{new Date(product.createdAt).toLocaleString('zh-CN')}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">最后更新</dt>
                <dd>{new Date(product.updatedAt).toLocaleString('zh-CN')}</dd>
              </div>
            </dl>
          </div>

          {/* 功能特性 */}
          {product.features && product.features.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-semibold">功能特性</h2>
              <ul className="space-y-2 text-sm">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 text-blue-600 dark:text-blue-400">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 产品描述 */}
        {product.description && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold">产品描述</h2>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{product.description}</pre>
            </div>
          </div>
        )}
      </div>

      {/* 发布版本列表 */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">发布版本</h2>
          <UploadForm productId={product.id} productSlug={product.slug} />
        </div>

      {product.releases.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-slate-800">
          <p className="mb-4 text-gray-500 dark:text-gray-400">该产品还没有发布任何版本</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  版本号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  文件大小
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  下载次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  上传时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  上传者
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {product.releases.map((release) => (
                <tr key={release.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{release.version}</div>
                    {release.releaseNotes && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {release.releaseNotes}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {release.size ? `${(release.size / 1024 / 1024).toFixed(2)} MB` : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {release._count.downloads.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        release.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : release.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {release.status === 'completed' ? '已完成' : release.status === 'pending' ? '待处理' : '失败'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(release.uploadedAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {release.uploader?.name || release.uploader?.email || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <a
                      href={release.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      下载
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </AdminShell>
  );
}
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type ProductOption = { slug: string; name: string };

