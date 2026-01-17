import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 检查是否有用户
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      initialized: userCount > 0 
    });
  } catch (error) {
    console.error('Check initialization failed:', error);
    // 数据库连接失败，视为未初始化
    return NextResponse.json({ initialized: false });
  }
}
