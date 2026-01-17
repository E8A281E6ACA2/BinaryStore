import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-server';
import SessionManager from '@/components/admin/SessionManager';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminSessionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    // redirect to login when not authenticated
    return (
      <div className="container mx-auto p-8">
        <p>请先 <a className="text-blue-600" href="/admin/login">登录</a>。</p>
      </div>
    );
  }

  // Load recent sessions from DB on the server and pass to client component
  const sessions = await prisma.session.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 200 });

  const data = sessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userEmail: s.user?.email ?? null,
    createdAt: s.createdAt.toISOString(),
    lastAccessAt: s.lastAccessAt ? s.lastAccessAt.toISOString() : null,
    expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
    userAgent: s.userAgent ?? null,
    ip: s.ip ?? null,
    revoked: s.revoked,
    meta: s.meta ?? null,
  }));

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">会话管理</h1>
      </div>
      <SessionManager initialSessions={data} />
    </AdminShell>
  );
}
