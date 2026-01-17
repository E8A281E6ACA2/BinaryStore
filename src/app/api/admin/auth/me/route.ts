import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: Request) {
  try {
    // Dev-only: log incoming cookie header and parsed session id to help debug 401 cases
    if (process.env.NODE_ENV !== 'production') {
      try {
        const cookieHeader = req.headers.get('cookie');
        // eslint-disable-next-line no-console
        console.debug('[debug] /api/admin/auth/me - cookie header:', cookieHeader);
        // attempt to parse sb_session cookie value
        const match = cookieHeader ? cookieHeader.match(/sb_session=([^;\s]+)/) : null;
        // eslint-disable-next-line no-console
        console.debug('[debug] /api/admin/auth/me - parsed sb_session:', match ? match[1] : null);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[debug] failed to log cookie header', e);
      }
    }
    const session = await getSessionFromRequest(req as Request);
    if (!session || !session.user) return NextResponse.json({ ok: false }, { status: 401 });
    const user = session.user;
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
