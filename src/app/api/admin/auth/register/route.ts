import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createSession, makeSessionCookie } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码必填' }, { status: 400 });
    }
    // 检查是否已存在
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
    }
    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashPassword(password),
        name,
        role: 'USER',
      },
    });
    // 自动登录
    const session = await createSession(user.id, {});
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    res.headers.append('Set-Cookie', makeSessionCookie(session));
    return res;
  } catch (err) {
    console.error('注册失败', err);
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}
