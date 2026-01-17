import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromCookies } from '@/lib/auth-api';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const form = await req.formData();
    const productSlug = String(form.get('productSlug') || '');
    const version = String(form.get('version') || '');
    const file = form.get('file') as unknown as File | null;

    if (!productSlug || !version || !file) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Ensure product exists
    let product = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) {
      product = await prisma.product.create({ data: { slug: productSlug, name: productSlug } });
    }

    const filename = (file as any).name || `upload-${Date.now()}`;
    const r2Key = `${productSlug}/${version}/${filename}`;

    // create DB release record (pending)
    const release = await prisma.release.create({
      data: {
        productId: product.id,
        version,
        r2Key,
        url: '',
        uploadedBy: user.id,
        status: 'pending',
      },
    });

    // Save file to local uploads directory (.uploads)
    const uploadsRoot = path.join(process.cwd(), '.uploads');
    const fullPath = path.join(uploadsRoot, ...r2Key.split('/'));
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    const arrayBuffer = await (file as any).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(fullPath, buffer);

    // Compute metadata
    const size = buffer.length;
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Update release
    const publicUrl = `/api/uploads/${encodeURIComponent(r2Key)}`;
    const updated = await prisma.release.update({
      where: { id: release.id },
      data: { size, checksum, url: publicUrl, status: 'ready' },
    });

    // audit
    try {
      await prisma.adminLog.create({ data: { userId: user.id, action: 'local_upload', resourceType: 'release', resourceId: release.id, details: { path: fullPath, size, checksum }, ip: undefined } });
    } catch (e) {
      console.warn('Failed to write admin log', e);
    }

    return NextResponse.json({ success: true, release: updated });
  } catch (err) {
    console.error('Upload error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
