import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 排除静态资源和 API 路由
  const isPublicAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/);

  if (isPublicAsset) {
    return NextResponse.next();
  }

  let initialized = false;

  try {
    const statusResponse = await fetch(
      new URL('/api/setup/status', request.nextUrl.origin),
      {
        headers: { 'x-internal-check': 'setup-status' },
        next: { revalidate: 5 },
      }
    );

    if (statusResponse.ok) {
      const data = await statusResponse.json();
      initialized = Boolean(data?.initialized);
    } else {
      console.error('Failed to fetch setup status', statusResponse.status);
    }
  } catch (error) {
    console.error('Setup status fetch error', error);
  }

  if (!initialized && !pathname.startsWith('/setup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/setup';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (initialized && pathname.startsWith('/setup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
