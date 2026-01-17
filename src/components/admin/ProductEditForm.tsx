export default function ProductEditForm({ product }: { product: Product }) {
  const router = useRouter();
  const [slug, setSlug] = useState(product.slug);
  const [name, setName] = useState(product.name);
  const [tagline, setTagline] = useState(product.tagline || '');
  const [description, setDescription] = useState(product.description || '');
  const [icon, setIcon] = useState(product.icon || '');
  const [banner, setBanner] = useState(product.banner || '');
  const [website, setWebsite] = useState(product.website || '');
  const [repository, setRepository] = useState(product.repository || '');
  const [featuresText, setFeaturesText] = useState(product.features.join('\n'));
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
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name,
          tagline: tagline || null,
          description: description || null,
          icon: icon || null,
          banner: banner || null,
          website: website || null,
          repository: repository || null,
          features: features.length > 0 ? features : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data?.error || '更新失败');
      else {
        router.push(`/admin/products/${slug}`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('更新时发生错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            产品 Slug <span className="text-red-500">*</span>
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-app"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">一句话介绍</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="简短的产品介绍"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">详细描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="产品的详细介绍..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">图标 URL</label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="https://example.com/icon.png"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          />
          {icon && (
            <div className="mt-2">
              <img src={icon} alt="预览" className="h-16 w-16 rounded-lg border" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Banner URL</label>
          <input
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            placeholder="https://example.com/banner.png"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          />
          {banner && (
            <div className="mt-2">
              <img src={banner} alt="预览" className="h-24 w-full rounded-lg border object-cover" />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">官网地址</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">仓库地址</label>
          <input
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            placeholder="https://github.com/user/repo"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">主要特性</label>
        <textarea
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          rows={6}
          placeholder="每行一个特性..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">每行一个特性，空行会被忽略</p>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              保存中...
            </>
          ) : (
            '保存更改'
          )}
        </button>
      </div>
    </form>
  );
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: Request) {
  // List sessions (admin only)
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth || !auth.user) return NextResponse.json({ ok: false }, { status: 401 });
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20')));
    const email = url.searchParams.get('email') || undefined;
    const revokedParam = url.searchParams.get('revoked');
    const revoked = revokedParam === 'true' ? true : revokedParam === 'false' ? false : undefined;

    const where: any = {};
    if (typeof revoked !== 'undefined') where.revoked = revoked;
