import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumePasswordReset } from '@/lib/passwordReset';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = body || {};
    if (!token || !newPassword) return NextResponse.json({ ok: false, message: 'Missing fields' }, { status: 400 });

    const rec = await consumePasswordReset(token);
    if (!rec) return NextResponse.json({ ok: false, message: 'Invalid or expired token' }, { status: 400 });

    // update user password
    await prisma.user.update({ where: { id: rec.userId }, data: { password: hashPassword(newPassword) } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('password reset error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
