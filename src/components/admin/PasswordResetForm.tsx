"use client";
import React, { useState } from 'react';

type Props = { token: string };

export default function PasswordResetForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!password) return setMessage('请输入新密码');
    if (password !== confirm) return setMessage('两次密码输入不一致');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMessage(data.message || '重置失败');
      } else {
        setMessage('密码已重置，请登录');
        setPassword('');
        setConfirm('');
        // redirect to login after short delay
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1200);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setMessage('网络错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">重置密码</h2>
      {message && <div className="mb-3 text-sm text-red-600">{message}</div>}
      <div className="mb-3">
        <label className="block text-sm mb-1">新密码</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full border px-3 py-2 rounded" />
      </div>
      <div className="mb-3">
        <label className="block text-sm mb-1">确认新密码</label>
        <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" className="w-full border px-3 py-2 rounded" />
      </div>
      <div>
        <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '处理中...' : '重置密码'}</button>
      </div>
    </form>
  );
}
