import Link from 'next/link';

interface ProductCardProps {
  product: {
    slug: string;
    name: string;
    tagline: string;
    icon: string;
  };
  downloadCount: number;
  latestVersion?: string;
}

export default function ProductCard({ product, downloadCount, latestVersion }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group h-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-xl dark:border-gray-800 dark:bg-slate-900 animate-scale-in">
        {/* Icon */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-3xl text-white shadow-lg transition group-hover:scale-110">
          {product.icon ? (
            <img src={product.icon} alt={product.name} className="h-12 w-12" />
          ) : (
            '📦'
          )}
        </div>

        {/* Content */}
        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          {product.name}
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {product.tagline}
        </p>

        {/* Version & Downloads */}
        <div className="flex items-center justify-between text-sm">
          <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {latestVersion ? `v${latestVersion}` : '暂无版本'}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {downloadCount.toLocaleString()} 次下载
          </span>
        </div>

        {/* Hover indicator */}
        <div className="mt-4 flex items-center text-blue-600 opacity-0 transition group-hover:opacity-100 dark:text-blue-400">
          <span className="text-sm font-medium">查看详情</span>
          <svg
            className="ml-1 h-4 w-4 transition group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
