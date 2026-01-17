import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  try {
    const parts = params.path || [];
    if (!parts.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const r2Key = parts.map((p) => decodeURIComponent(p)).join('/');
    const uploadsRoot = path.join(process.cwd(), '.uploads');
    const fullPath = path.join(uploadsRoot, ...r2Key.split('/'));

    if (!fs.existsSync(fullPath)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stat = await fs.promises.stat(fullPath);
  const buffer = await fs.promises.readFile(fullPath);

  const headers = new Headers();
  headers.set('Content-Length', String(stat.size));
  headers.set('Content-Disposition', `attachment; filename="${path.basename(fullPath)}"`);
  headers.set('Content-Type', 'application/octet-stream');

  return new NextResponse(buffer, { headers });
  } catch (err) {
    console.error('Serve upload error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
