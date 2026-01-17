import crypto from 'crypto';
import { prisma } from './prisma';

const TOKEN_COOKIE_NAME = 'sb_session';
const TOKEN_SECRET = process.env.ADMIN_JWT_SECRET || 'change-me-to-secure-secret';

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(input: string) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  // Pad
  while (input.length % 4) input += '=';
  return Buffer.from(input, 'base64').toString();
}

export function hashPassword(password: string, salt?: string) {
  const _salt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, _salt, 64).toString('hex');
  return `${_salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  try {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(derived, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

export function createToken(payload: Record<string, any>, expiresInSec = 60 * 60 * 24 * 7) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const bodyStr = JSON.stringify(body);
  const bodyB64 = base64url(bodyStr);
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(bodyB64).digest('hex');
  return `${bodyB64}.${sig}`;
}

export function verifyToken(token: string) {
  try {
    const [bodyB64, sig] = token.split('.');
    if (!bodyB64 || !sig) return null;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(bodyB64).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(sig, 'hex');
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
    const bodyStr = base64urlDecode(bodyB64);
    const body = JSON.parse(bodyStr);
    const now = Math.floor(Date.now() / 1000);
    if (body.exp && body.exp < now) return null;
    return body as Record<string, any>;
  } catch (e) {
    return null;
  }
}

export function getTokenFromRequest(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const parts = cookie.split(';').map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith(`${TOKEN_COOKIE_NAME}=`)) {
      return p.split('=')[1];
    }
  }
  return null;
}

export async function getUserFromRequest(req: Request) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  return user;
}

export function makeSessionCookie(token: string, maxAgeSec = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [`${TOKEN_COOKIE_NAME}=${token}`, 'Path=/', `Max-Age=${maxAgeSec}`, 'HttpOnly', 'SameSite=Strict'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [`${TOKEN_COOKIE_NAME}=deleted`, 'Path=/', 'Max-Age=0', 'HttpOnly', 'SameSite=Strict', `Expires=Thu, 01 Jan 1970 00:00:00 GMT`];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}
