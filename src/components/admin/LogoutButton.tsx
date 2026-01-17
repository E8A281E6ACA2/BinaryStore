'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/admin/login');
  }

  return (
    <button onClick={logout} className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700">
      登出
    </button>
  );
}
