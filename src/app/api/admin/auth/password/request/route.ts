import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPasswordReset, makeResetToken } from '@/lib/passwordReset';
import { prisma as prismaClient } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body || {};
    if (!email) return NextResponse.json({ ok: false, message: 'Missing email' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: true }); // don't reveal user existence

    const rec = await createPasswordReset(user.id, 60 * 60); // 1 hour

    // In production you would send an email containing reset link with the token.
    // For now, in dev we return the token so it is easy to test.
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:60318'}/admin/password/reset?token=${rec.token}`;

    // Integrate real email sender in production
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('Password reset link (dev):', resetUrl);
      return NextResponse.json({ ok: true, devResetLink: resetUrl });
    }

    try {
      const subject = 'Password reset for your account';
      const html = `<p>Hello ${user.name || user.email},</p>
      <p>We received a request to reset your password. Click the link below to reset it (expires in 1 hour):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, you can ignore this email.</p>`;
      const text = `Reset your password: ${resetUrl}`;
      await sendMail({ to: user.email, subject, html, text });
    } catch (e) {
      // sending failed; still return success to avoid leaking existence
      // eslint-disable-next-line no-console
      console.error('Failed to send password reset email', e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('password request error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
