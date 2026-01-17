'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductActionsProps {
  productId: string;
  productName: string;
}

export default function ProductActions({ productId, productName }: ProductActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `⚠️ 确定要删除产品"${productName}"吗？\n\n` +
        `此操作将：\n` +
        `• 删除该产品的所有发布版本\n` +
        `• 删除所有下载记录\n` +
        `• 删除 R2 存储中的所有文件\n\n` +
        `⚠️ 此操作无法恢复！`
      )
    ) {
      return;
    }

    // 二次确认
    if (!confirm('⚠️ 请再次确认删除操作\n\n所有数据将被永久删除且无法恢复！')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '删除失败');
      }

      // 显示删除统计
      alert(
        `✅ 产品删除成功！\n\n` +
        `已删除数据：\n` +
        `• 发布版本: ${data.stats?.releases || 0} 个\n` +
        `• 下载记录: ${data.stats?.downloads || 0} 条\n` +
        `• R2 文件: ${data.stats?.files || 0} 个`
      );

      // 刷新页面
      router.refresh();
    } catch (err) {
      alert('❌ ' + (err instanceof Error ? err.message : '删除失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
      title="删除产品"
    >
      {loading ? (
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      )}
    </button>
  );
}
