import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: ws: wss:",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

function withSecurityHeaders(response: NextResponse) {
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 避免内部健康检查请求触发递归
  if (request.headers.get('x-internal-check') === 'setup-status') {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith('/api');
  const isPublicAsset =
    pathname.startsWith('/_next') || pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/);

  if (isPublicAsset) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (isApiRoute) {
    return withSecurityHeaders(NextResponse.next());
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
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  if (initialized && pathname.startsWith('/setup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
