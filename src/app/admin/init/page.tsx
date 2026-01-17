"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const response = await fetch('/api/admin/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // 显示成功消息，然后跳转到登录页面
        setTimeout(() => {
          router.push('/admin/login');
        }, 1500);
      } else {
        setError(data.error || '创建管理员账户失败');
      }
    } catch (err) {
      console.error('初始化失败:', err);
      setError('创建管理员账户失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-900">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4 dark:bg-blue-900/30">
            <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">系统初始化</h2>
          <p className="text-gray-500 dark:text-gray-400">创建您的管理员账户以开始使用 BinaryStore</p>
        </div>

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                管理员账户创建成功！正在跳转到登录页面...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              管理员姓名
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              placeholder="请输入管理员姓名"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              邮箱地址
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              placeholder="请输入邮箱地址"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              placeholder="请输入密码（至少8位）"
              disabled={loading || success}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : success ? '创建成功' : '创建管理员账户'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}