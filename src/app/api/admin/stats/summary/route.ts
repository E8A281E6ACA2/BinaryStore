import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // total downloads
    const totalDownloads = await prisma.download.count();

    // today's downloads (UTC)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const todayDownloads = await prisma.download.count({ where: { downloadedAt: { gte: startOfDay } } });

    // active sessions (not revoked and not expired)
    const now = new Date();
  // use any-cast to avoid TypeScript mismatch in environments where Prisma types may not be generated
  const activeSessions = await (prisma as any).session.count({ where: { revoked: false, expiresAt: { gt: now } } });

    return NextResponse.json({ ok: true, totalDownloads, todayDownloads, activeSessions });
  } catch (e) {
    console.error('stats summary error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
