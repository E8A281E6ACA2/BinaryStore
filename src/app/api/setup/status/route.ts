import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const initialized = adminCount > 0;

    return NextResponse.json(
      { initialized },
      { headers: { 'Cache-Control': 's-maxage=5, stale-while-revalidate=60' } }
    );
  } catch (error) {
    console.error('Failed to check setup status', error);
    return NextResponse.json(
      { initialized: false, error: 'STATUS_CHECK_FAILED' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
