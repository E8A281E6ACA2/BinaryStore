import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import { prisma } from './prisma';

/**
 * 从当前请求中获取登录用户
 * 用于 App Router API routes
 */
export async function getCurrentUserFromCookies() {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('sb_session')?.value;
    if (!sessionId) return null;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    
    if (!session) return null;
    if (session.revoked) return null;
    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) return null;
    
    return session.user;
  } catch (e) {
    console.error('getCurrentUserFromCookies error', e);
    return null;
  }
}

type AuthResult =
  | { user: User }
  | { response: NextResponse };

/**
 * 要求管理员权限，统一返回格式
 */
export async function requireAdminUser(): Promise<AuthResult> {
  const user = await getCurrentUserFromCookies();
  if (!user || user.role !== 'ADMIN') {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user };
}
