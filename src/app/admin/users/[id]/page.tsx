import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import UserEditForm from '@/components/admin/UserEditForm';
import { notFound } from 'next/navigation';

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/admin/login');
  if (!currentUser.isAdmin) redirect('/admin');

  // 获取要编辑的用户
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          uploads: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">编辑用户</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          修改用户信息和权限
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 用户信息卡片 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {user.name || '未设置'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            
            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">用户ID</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">{user.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">角色</span>
                {user.isAdmin ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    管理员
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    普通用户
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">上传版本数</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {user._count.uploads}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">注册时间</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 编辑表单 */}
        <div className="lg:col-span-2">
          <UserEditForm user={user} currentUserId={currentUser.id} />
        </div>
      </div>
    </AdminShell>
  );
}
