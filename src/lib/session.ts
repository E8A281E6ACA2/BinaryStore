import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const TOKEN_COOKIE_NAME = 'sb_session';

function makeCookieParts(name: string, value: string, maxAgeSec: number) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [`${name}=${value}`, `Path=/`, `Max-Age=${maxAgeSec}`, 'HttpOnly', 'SameSite=Strict'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export async function createSession(userId: string, opts?: { expiresInSec?: number; ip?: string; userAgent?: string; meta?: any }) {
  const expiresInSec = opts?.expiresInSec ?? 60 * 60 * 24 * 7; // 7 days
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);
  const session = await prisma.session.create({ data: { userId, expiresAt, userAgent: opts?.userAgent, ip: opts?.ip, meta: opts?.meta } });
  return session;
}

export function makeSessionCookie(sessionId: string, maxAgeSec = 60 * 60 * 24 * 7) {
  return makeCookieParts(TOKEN_COOKIE_NAME, sessionId, maxAgeSec);
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [`${TOKEN_COOKIE_NAME}=deleted`, 'Path=/', 'Max-Age=0', 'HttpOnly', 'SameSite=Strict', `Expires=Thu, 01 Jan 1970 00:00:00 GMT`];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function getCookieFromRequest(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const parts = cookie.split(';').map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith(`${TOKEN_COOKIE_NAME}=`)) return p.split('=')[1];
  }
  return null;
}

export async function getSessionFromRequest(req: Request) {
  const id = getCookieFromRequest(req);
  if (!id) return null;
  const session = await prisma.session.findUnique({ where: { id }, include: { user: true } });
  if (!session) return null;
  if (session.revoked) return null;
  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) return null;
  // update lastAccessAt
  try {
    // extract possible ip and user-agent from headers
    const ipHeader = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || '')
      .split(',')[0]
      .trim() || null;
    const ua = req.headers.get('user-agent') || null;

    const data: any = { lastAccessAt: new Date() };
    if (ipHeader && ipHeader !== session.ip) data.ip = ipHeader;
    if (ua && ua !== session.userAgent) data.userAgent = ua;

    // only update changed fields to reduce writes
    await prisma.session.update({ where: { id: session.id }, data });
  } catch (e) {
    console.warn('Failed to update lastAccessAt', e);
  }

  // Dev-only: log incoming headers to help debug IP forwarding
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
      console.debug('getSessionFromRequest headers debug:', debugHeaders);
    } catch (ee) {
      // eslint-disable-next-line no-console
      console.warn('Failed to read headers for session debug', ee);
    }
  }
  return session;
}

export async function revokeSession(sessionId: string) {
  await prisma.session.updateMany({ where: { id: sessionId }, data: { revoked: true } });
}
