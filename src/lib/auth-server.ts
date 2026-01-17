import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
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
    // Keep the log simple so it appears in server logs during dev
    // and doesn't leak sensitive details.
    // eslint-disable-next-line no-console
    console.error('getCurrentUser error', e);
    return null;
  }
}
