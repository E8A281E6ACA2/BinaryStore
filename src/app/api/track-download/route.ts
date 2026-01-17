import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productSlug, version, platform, arch } = body;

    if (!productSlug || !version || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure product exists
    let product = await prisma.product.findUnique({
      where: { slug: productSlug },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          slug: productSlug,
          name: productSlug,
        },
      });
    }

    // Record download
    await prisma.download.create({
      data: {
        productId: product.id,
        version,
        platform,
        arch: arch || 'unknown',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
