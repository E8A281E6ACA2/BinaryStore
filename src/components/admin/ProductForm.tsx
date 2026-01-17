'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductForm() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [banner, setBanner] = useState('');
  const [website, setWebsite] = useState('');
  const [repository, setRepository] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slug || !name) return setError('slug 和 name 必填');
    
    const features = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name,
          tagline: tagline || undefined,
          description: description || undefined,
          icon: icon || undefined,
          banner: banner || undefined,
          website: website || undefined,
          repository: repository || undefined,
          features: features.length > 0 ? features : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data?.error || '创建失败');
      else {
        router.push('/admin/products');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('创建时发生错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            产品 Slug <span className="text-red-500">*</span>
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-app"
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
            required
          />
          <p className="mt-1 text-xs text-gray-500">只能包含小写字母、数字、连字符</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            显示名称 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Application"
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">简短描述 (Tagline)</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="一句话介绍你的应用"
          className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">详细描述 (支持 Markdown)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="# My Application&#10;&#10;这里写详细的产品介绍..."
          rows={8}
          className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-slate-800"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">图标路径</label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="/images/my-app-icon.svg"
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
          />
          <p className="mt-1 text-xs text-gray-500">图标文件放在 public/images/ 目录</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">横幅图片 (可选)</label>
          <input
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            placeholder="/images/my-app-banner.jpg"
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">功能特性 (每行一个)</label>
        <textarea
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          placeholder="跨平台支持&#10;现代化界面&#10;高性能&#10;免费开源"
          rows={4}
          className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">官网地址</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            type="url"
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">GitHub 仓库</label>
          <input
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            placeholder="https://github.com/username/repo"
            type="url"
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '创建中…' : '创建产品'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-800"
        >
          取消
        </button>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
    </form>
  );
}
