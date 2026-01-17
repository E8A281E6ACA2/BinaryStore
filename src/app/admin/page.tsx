import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import AdminShell from '@/components/admin/AdminShell';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  // server-side stats for dashboard cards
  const totalDownloads = await prisma.download.count();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const todayDownloads = await prisma.download.count({ where: { downloadedAt: { gte: startOfDay } } });
  const now = new Date();
  const activeSessions = await (prisma as any).session.count({ where: { revoked: false, expiresAt: { gt: now } } });

  return (
    <AdminShell>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">后台 / 仪表盘</div>
        {/* breadcrumb placeholder on left, actions are in shell */}
      </div>
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm text-gray-500">总下载数</div>
          <div className="mt-2 text-2xl font-bold">{totalDownloads}</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm text-gray-500">今日下载</div>
          <div className="mt-2 text-2xl font-bold">{todayDownloads}</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm text-gray-500">活跃会话</div>
          <div className="mt-2 text-2xl font-bold">{activeSessions}</div>
        </div>
      </section>

    </AdminShell>
  );
}
