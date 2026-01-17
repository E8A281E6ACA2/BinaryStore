import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth-api';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseReleaseUploadFormData } from '@/lib/validators';
import { safeErrorResponse } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const auth = await requireAdminUser();
    if ('response' in auth) return auth.response;
    const { user } = auth;

    const form = await req.formData();
    const parsed = parseReleaseUploadFormData(form);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.message }, { status: parsed.status ?? 400 });
    }
    const { productSlug, version, file, filename } = parsed.data;

    // Ensure product exists
    let product = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) {
      product = await prisma.product.create({ data: { slug: productSlug, name: productSlug } });
    }

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

    const uploadsRoot = path.join(process.cwd(), '.uploads');
    const fullPath = path.resolve(uploadsRoot, r2Key);
    const relative = path.relative(uploadsRoot, fullPath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    let fileWritten = false;
    try {
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      const arrayBuffer = await (file as any).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(fullPath, buffer);
      fileWritten = true;

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
      if (fileWritten) {
        await fs.promises.rm(fullPath, { force: true }).catch(() => {});
      }
      await prisma.release.delete({ where: { id: release.id } }).catch(() => {});
      console.error('Upload error', err);
      return safeErrorResponse('上传失败，请稍后重试', 500, err);
    }
  } catch (err) {
    console.error('Upload error', err);
    return safeErrorResponse('上传失败，请稍后重试', 500, err);
  }
}
