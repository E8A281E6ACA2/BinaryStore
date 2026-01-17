import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth || !auth.user) return NextResponse.json({ ok: false }, { status: 401 });

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const email = url.searchParams.get('email');
    const revoked = url.searchParams.get('revoked');

    const where: any = {};
    if (revoked !== null && revoked !== 'all') {
      where.revoked = revoked === 'true';
    }
    if (email) {
      where.user = { email: { contains: email, mode: 'insensitive' } };
    }

    const exportParam = url.searchParams.get('export');
    const exportAll = url.searchParams.get('exportAll') === 'true';

    let total = 0;
    let sessions: any[] = [];
    if (exportParam === 'csv' && exportAll) {
      // Export all matching results (ignore pagination)
      sessions = await prisma.session.findMany({ where, include: { user: true }, orderBy: { createdAt: 'desc' } });
      total = sessions.length;
    } else {
      total = await prisma.session.count({ where });
      sessions = await prisma.session.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    }

    // Serialize dates to ISO for safe transport
    const data = sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userEmail: s.user?.email ?? null,
      createdAt: s.createdAt.toISOString(),
      lastAccessAt: s.lastAccessAt ? s.lastAccessAt.toISOString() : null,
      expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
      userAgent: s.userAgent ?? null,
      ip: s.ip ?? null,
      revoked: s.revoked,
      meta: s.meta ?? null,
    }));

    // If client requested CSV export, return CSV file
    if (url.searchParams.get('export') === 'csv') {
      // If exportAll was requested, stream all matching rows in batches to avoid high memory usage
      if (url.searchParams.get('exportAll') === 'true') {
        const batchSize = 1000; // fetch 1000 rows per DB query
        const maxExport = parseInt(url.searchParams.get('exportLimit') || '0', 10) || 0; // optional cap, 0 means no cap

        const filename = `sessions-${new Date().toISOString().slice(0,10)}.csv`;
        const headers = new Headers({
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        });

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            try {
              // write header row
              controller.enqueue(encoder.encode('id,userId,userEmail,createdAt,lastAccessAt,expiresAt,ip,userAgent,revoked\n'));

              let lastId: string | null = null;
              let exported = 0;
              while (true) {
                const q: any = { where, include: { user: true }, orderBy: { createdAt: 'desc' }, take: batchSize };
                if (lastId) {
                  q.cursor = { id: lastId };
                  q.skip = 1;
                }
                const rows = await prisma.session.findMany(q);
                if (!rows || rows.length === 0) break;

                for (const s of rows) {
                  // apply export limit if set
                  if (maxExport > 0 && exported >= maxExport) break;
                  const cols = [
                    s.id,
                    s.userId,
                    s.user?.email ?? '',
                    s.createdAt ? s.createdAt.toISOString() : '',
                    s.lastAccessAt ? s.lastAccessAt.toISOString() : '',
                    s.expiresAt ? s.expiresAt.toISOString() : '',
                    s.ip ?? '',
                    (s.userAgent || '').replace(/\r?\n/g, ' '),
                    String(s.revoked),
                  ];
                  const line = cols.map((c: any) => {
                    if (c == null) return '';
                    const str = String(c);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) return '"' + str.replace(/"/g, '""') + '"';
                    return str;
                  }).join(',') + '\n';
                  controller.enqueue(encoder.encode(line));
                  exported += 1;
                }

                if (maxExport > 0 && exported >= maxExport) break;

                // prepare next batch using last row's id as cursor
                const last = rows[rows.length - 1];
                if (!last) break;
                lastId = last.id;

                // if fewer than batchSize returned, we're done
                if (rows.length < batchSize) break;
              }

              // Optionally append a footer indicating truncation
              if (maxExport > 0) {
                controller.enqueue(encoder.encode(`# Export limit: ${maxExport} rows\n`));
              }
            } catch (err) {
              // stream error
              controller.error(err as any);
              return;
            }
            controller.close();
          }
        });

        return new Response(stream, { status: 200, headers });
      }

      // Fallback: export current page (non-streaming small result)
      const rows = [
        ['id', 'userId', 'userEmail', 'createdAt', 'lastAccessAt', 'expiresAt', 'ip', 'userAgent', 'revoked'],
      ];
      for (const r of data) {
        rows.push([
          r.id,
          r.userId,
          r.userEmail ?? '',
          r.createdAt ?? '',
          r.lastAccessAt ?? '',
          r.expiresAt ?? '',
          r.ip ?? '',
          (r.userAgent || '').replace(/\r?\n/g, ' '),
          String(r.revoked),
        ]);
      }
      // simple CSV serialization with basic quoting
      const csv = rows
        .map((cols) => cols.map((c) => {
          if (c == null) return '';
          const s = String(c);
          if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return '"' + s.replace(/"/g, '""') + '"';
          }
          return s;
        }).join(','))
        .join('\n');

      const filename = `sessions-${new Date().toISOString().slice(0,10)}.csv`;
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ ok: true, sessions: data, total, page, pageSize });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('GET /api/admin/sessions error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Revoke a session (admin only)
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth || !auth.user) return NextResponse.json({ ok: false }, { status: 401 });
    const body = await req.json();
    const { action } = body || {};
    if (action === 'revoke') {
      const { sessionId } = body || {};
      if (!sessionId || typeof sessionId !== 'string') return NextResponse.json({ ok: false, message: 'Missing sessionId' }, { status: 400 });
      await prisma.session.updateMany({ where: { id: sessionId }, data: { revoked: true } });
      try {
        await prisma.adminLog.create({ data: { userId: auth.user.id, action: 'revoke_session', resourceType: 'session', resourceId: sessionId, details: { by: auth.user.id } } });
      } catch (e) {
        console.warn('Failed to write admin log for revoke', e);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'revokeAllForUser') {
      const { userId } = body || {};
      if (!userId || typeof userId !== 'string') return NextResponse.json({ ok: false, message: 'Missing userId' }, { status: 400 });
      await prisma.session.updateMany({ where: { userId }, data: { revoked: true } });
      try {
        await prisma.adminLog.create({ data: { userId: auth.user.id, action: 'revoke_all_sessions', resourceType: 'user', resourceId: userId, details: { by: auth.user.id } } });
      } catch (e) {
        console.warn('Failed to write admin log for revokeAll', e);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, message: 'Unknown action' }, { status: 400 });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('POST /api/admin/sessions error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

