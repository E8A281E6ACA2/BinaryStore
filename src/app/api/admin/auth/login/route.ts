import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { createSession, makeSessionCookie } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ ok: false, message: 'Missing credentials' }, { status: 400 });
    }

    // In dev, print relevant headers to help debug client IP forwarding
    if (process.env.NODE_ENV !== 'production') {
      try {
        const debugHeaders = {
          'x-forwarded-for': req.headers.get('x-forwarded-for'),
          'x-real-ip': req.headers.get('x-real-ip'),
          'cf-connecting-ip': req.headers.get('cf-connecting-ip'),
          'remote-addr': req.headers.get('remote-addr'),
          'user-agent': req.headers.get('user-agent'),
        };
        // eslint-disable-next-line no-console
        console.debug('admin login headers debug:', debugHeaders);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to read headers for debug', e);
      }
    }

    // extract IP and user-agent from request headers (respect common proxy headers)
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || '')
      .split(',')[0]
      .trim() || null;
    const userAgent = req.headers.get('user-agent') || undefined;

    // determine which header provided the IP (for auditing)
    const headerCandidates = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];
    let forwardedBy: string | null = null;
    for (const h of headerCandidates) {
      const v = req.headers.get(h);
      if (v && v.trim() !== '') {
        forwardedBy = h;
        break;
      }
    }

    // Rate limiting: prefer async Redis-backed APIs when available, fall back to sync in-memory API
    let _recordFailure: any = undefined;
    try {
      const limiter = await import('@/lib/rateLimiter');
      const ipKey = ip || req.headers.get('x-forwarded-for') || 'unknown';
      const key = `${ipKey}:${email}`;

      let blocked = false;
      if (typeof limiter.asyncIsBlocked === 'function') {
        // Redis-backed async check
        blocked = await limiter.asyncIsBlocked(key);
        _recordFailure = limiter.asyncRecordFailure || limiter.recordFailure;
      } else if (typeof limiter.isBlocked === 'function') {
        // in-memory sync check
        blocked = limiter.isBlocked(key);
        _recordFailure = limiter.recordFailure || limiter.asyncRecordFailure;
      }

      if (blocked) {
        return NextResponse.json({ ok: false, message: 'Too many attempts, try later' }, { status: 429 });
      }
    } catch (e) {
      // ignore rate limiter import errors (fallback to no limiter)
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('❌ 用户不存在:', email);
      try { if (typeof _recordFailure === 'function') _recordFailure(`${ip || 'unknown'}:${email}`); } catch (ee) {}
      return NextResponse.json({ ok: false, message: 'Invalid credentials' }, { status: 401 });
    }

    console.log('✓ 找到用户:', email, '密码哈希:', user.password?.substring(0, 20) + '...');
    const valid = verifyPassword(password, user.password);
    console.log('密码验证结果:', valid);
    if (!valid) {
      try { if (typeof _recordFailure === 'function') _recordFailure(`${ip || 'unknown'}:${email}`); } catch (ee) {}
      return NextResponse.json({ ok: false, message: 'Invalid credentials' }, { status: 401 });
    }

  const session = await createSession(user.id, {
    expiresInSec: 60 * 60 * 24 * 7,
    ip: ip ?? undefined,
    userAgent,
    meta: forwardedBy ? { forwardedBy } : undefined,
  });
  const cookie = makeSessionCookie(session.id);

  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  res.headers.set('Set-Cookie', cookie);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}
