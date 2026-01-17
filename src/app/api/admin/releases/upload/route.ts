import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromCookies } from '@/lib/auth-api';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PRODUCT_SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z_.-]{0,127}$/;
const FILENAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,255}$/;
const ALLOWED_EXTENSIONS = new Set([
  'zip',
  'tar',
  'gz',
  'tgz',
  'bz2',
  'xz',
  '7z',
  'rar',
  'dmg',
  'pkg',
  'exe',
  'msi',
  'deb',
  'rpm',
  'apk',
  'appimage',
  'bin',
  'iso',
]);
const DISALLOWED_MIME_PREFIXES = ['text/', 'application/javascript', 'application/x-javascript'];

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const form = await req.formData();
    const productSlug = String(form.get('productSlug') || '').trim();
    const version = String(form.get('version') || '').trim();
    const file = form.get('file') as unknown as File | null;

    if (!productSlug || !version || !file) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!PRODUCT_SLUG_PATTERN.test(productSlug)) {
      return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 });
    }

    if (!VERSION_PATTERN.test(version)) {
      return NextResponse.json({ error: 'Invalid version format' }, { status: 400 });
    }

    const originalName = path.basename(((file as any).name as string) || '');
    const contentType = typeof (file as any).type === 'string' ? (file as any).type : '';

    if (
      !originalName ||
      !FILENAME_PATTERN.test(originalName) ||
      originalName.includes('..') ||
      originalName.includes('/') ||
      originalName.includes('\\')
    ) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }

    const extension = path.extname(originalName).replace(/^\./, '').toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (contentType && DISALLOWED_MIME_PREFIXES.some((prefix) => contentType.startsWith(prefix))) {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    if (typeof (file as any).arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Invalid file payload' }, { status: 400 });
    }

    // Ensure product exists
    let product = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) {
      product = await prisma.product.create({ data: { slug: productSlug, name: productSlug } });
    }

    const filename = originalName || `upload-${Date.now()}`;
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
    const fullPath = path.resolve(uploadsRoot, r2Key);
    const relative = path.relative(uploadsRoot, fullPath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

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
