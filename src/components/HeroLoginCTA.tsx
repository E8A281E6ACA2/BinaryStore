"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HeroLoginCTA({ initialShow = true }: { initialShow?: boolean }) {
  const [show, setShow] = useState<boolean>(initialShow);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch('/api/admin/auth/me', { credentials: 'include' });
        if (!mounted) return;
        if (res.ok) {
          // user exists -> hide login
          setShow(false);
        } else {
          setShow(true);
        }
      } catch (e) {
        // network error, keep showing login
        if (mounted) setShow(true);
      }
    }
    // Only check if we initially would show the button
    if (initialShow) check();
    return () => {
      mounted = false;
    };
  }, [initialShow]);

  if (!show) return null;

  return (
    <Link
      href="/admin"
      className="rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white/10"
    >
      登录
    </Link>
  );
}
