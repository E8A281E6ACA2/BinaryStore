"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || '登录失败');
        setLoading(false);
        return;
      }
      // show success message
      setSuccess(true);
      setTimeout(async () => {
        // redirect to admin dashboard and refresh server components so Header updates
        await router.push('/admin');
        try {
          router.refresh();
        } catch (e) {
          // ignore refresh errors in older Next versions
        }
      }, 1000);
    } catch (e) {
      setError('网络错误');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-slate-800">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">管理员登录</h1>
        
        <form onSubmit={submit} className="space-y-4">
          {success && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  登录成功！正在跳转...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">邮箱</label>
            <input 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              disabled={loading || success}
            />
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">密码</label>
            <input 
              type="password" 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          <button 
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
            type="submit" 
            disabled={loading || success}
          >
            {loading ? '登录中…' : success ? '登录成功' : '登录'}
          </button>
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            没有账号？{' '}
            <a href="/admin/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              注册一个
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
