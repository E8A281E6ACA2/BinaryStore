import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';
import { revokeSession, getCookieFromRequest } from '@/lib/session';

export async function POST(req: Request) {
  try {
    // read cookie and revoke session
    const cookieVal = req.headers.get('cookie') || '';
    const parts = cookieVal.split(';').map((s) => s.trim());
    let sessionId: string | null = null;
    for (const p of parts) {
      if (p.startsWith('sb_session=')) {
        sessionId = p.split('=')[1];
        break;
      }
    }
    if (sessionId) await revokeSession(sessionId);
  } catch (e) {
    console.warn('Logout revoke failed', e);
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', clearSessionCookie());
  return res;
}
