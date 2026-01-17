import { getCurrentUserFromCookies } from '@/lib/auth-api';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

// 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, newPassword } = body;

    // 检查邮箱是否已被其他用户使用
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: params.id,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已被使用' }, { status: 400 });
    }

    // 准备更新数据
    const updateData: any = {
      name: name || null,
      email,
    };

    // 如果提供了新密码，则更新密码
    if (newPassword && newPassword.trim()) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 不能删除自己
  if (user.id === params.id) {
    return NextResponse.json({ error: '不能删除自己的账号' }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
