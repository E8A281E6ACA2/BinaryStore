import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lightweight protection: ensure sb_session cookie exists for admin pages/APIs.
// Note: this middleware only checks presence of the cookie. API routes and pages
// still perform full session validation with the DB.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes and /api/admin endpoints
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('sb_session')?.value;
  if (!cookie) {
    // For API calls, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ ok: false, message: 'Unauthenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For pages, redirect to login with next param
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('next', req.nextUrl.pathname + (req.nextUrl.search || ''));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
