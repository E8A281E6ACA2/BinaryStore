"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import LogoutButton from './admin/LogoutButton';
import UserMenu from './ui/UserMenu';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);
  
  // 不在登录/注册页面显示 Header
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    return null;
  }

  // 在后台管理页面不显示 Header（后台有自己的导航）
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-slate-900/80">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              软件下载中心
            </div>
          </Link>
          <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-slate-900/80">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            软件下载中心
          </div>
        </Link>

        <div className="flex items-center space-x-4">

          {user ? (
            <div className="flex items-center">
              <UserMenu email={user.email} />
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              登录
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
