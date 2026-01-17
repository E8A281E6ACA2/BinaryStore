import { cookies } from 'next/headers';
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
