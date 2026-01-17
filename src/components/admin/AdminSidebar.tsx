"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" />
        </svg>
      );
    case 'upload':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        </svg>
      );
    case 'products':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
        </svg>
      );
    case 'sessions':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" strokeWidth="1.5" />
        </svg>
      );
    case 'stats':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 17V9m6 8V5" />
        </svg>
      );
    case 'users':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11zM6 11c1.657 0 3-1.567 3-3.5S7.657 4 6 4 3 5.567 3 7.5 4.343 11 6 11z" />
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 21a6 6 0 0 0-6-6H9a6 6 0 0 0-6 6" />
        </svg>
      );
    case 'settings':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminSidebar() {
  const pathname = usePathname() || '';

  const items: { href: string; label: string; icon: string }[] = [
    { href: '/admin', label: '仪表盘', icon: 'dashboard' },
    { href: '/admin/uploads', label: '上传管理', icon: 'upload' },
    { href: '/admin/products', label: '产品', icon: 'products' },
    { href: '/admin/sessions', label: '会话', icon: 'sessions' },
    { href: '/admin/stats', label: '统计', icon: 'stats' },
    { href: '/admin/users', label: '帐号', icon: 'users' },
    { href: '/admin/settings', label: '系统设置', icon: 'settings' },
  ];

  return (
    <div className="rounded bg-white p-2 shadow dark:bg-slate-800">
      <nav className="flex flex-col">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/');
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                'flex items-center gap-3 rounded px-3 py-2 text-sm ' +
                (active
                  ? 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700')
              }
            >
              <Icon name={it.icon} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
