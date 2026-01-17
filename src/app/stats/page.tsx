import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';

export default async function StatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  // 已登录用户可访问现有前端统计页（保持原有功能或进一步扩展）
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">下载统计</h1>
        <p className="text-gray-600">请在后台查看详细统计。</p>
      </div>
    </div>
  );
}
