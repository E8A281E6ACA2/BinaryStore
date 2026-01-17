import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import Link from 'next/link';
import { useState } from 'react';

export default async function AddUserPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">添加用户</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            创建新的系统用户账号
          </p>
        </div>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300"
        >
          返回用户列表
        </Link>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-slate-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">创建新用户</h2>
          
          <form action="/api/admin/auth/register" method="POST" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                邮箱 *
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                placeholder="请输入邮箱地址"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                昵称（可选）
              </label>
              <input
                type="text"
                name="name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                placeholder="请输入用户昵称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                密码 *
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                placeholder="请输入密码（至少6位）"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition"
              >
                创建用户
              </button>
              <Link
                href="/admin/users"
                className="ml-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50 transition dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300"
              >
                取消
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}