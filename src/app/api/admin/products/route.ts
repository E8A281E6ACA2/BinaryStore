import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromCookies } from '@/lib/auth-api';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { slug, name, tagline, description, icon, banner, website, repository, features } = body;
    if (!slug || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: '产品已存在' }, { status: 409 });

    const created = await prisma.product.create({
      data: {
        slug,
        name,
        tagline: tagline || null,
        description: description || null,
        icon: icon || null,
        banner: banner || null,
        website: website || null,
        repository: repository || null,
        features: features || [],
      },
    });
    return NextResponse.json({ ok: true, product: created });
  } catch (err) {
    console.error('Create product error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
