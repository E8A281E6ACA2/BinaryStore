import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { exec } from 'child_process';
import { promisify } from 'util';
import { safeErrorResponse } from '@/lib/api-error';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    // 1. 先尝试运行数据库迁移（如果数据库结构不存在）
    try {
      console.log('开始检查数据库结构...');
      
      // 尝试查询 user 表，如果失败说明需要初始化
      try {
        await prisma.user.count();
        console.log('数据库结构已存在');
      } catch (dbError: any) {
        console.log('数据库结构不存在，开始自动迁移...');
        
        // 运行 Prisma migrate deploy（生产环境）
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
        console.log('Migration output:', stdout);
        if (stderr) console.error('Migration stderr:', stderr);
        
        console.log('✅ 数据库迁移完成');
      }
    } catch (migrateError: any) {
      console.error('数据库迁移失败:', migrateError);
      return safeErrorResponse('数据库初始化失败', 500, migrateError);
    }

    // 2. 检查系统是否已初始化
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({ error: '系统已初始化' }, { status: 400 });
    }

    const body = await req.json();
    const {
      adminEmail,
      adminPassword,
      r2Bucket,
      r2Endpoint,
      r2AccessKeyId,
      r2SecretAccessKey,
      r2PublicUrl,
      r2Region,
      r2PathPrefix,
    } = body;

    // 验证必填字段
    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: '管理员邮箱和密码是必填的' }, { status: 400 });
    }

    if (!r2Bucket || !r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
      return NextResponse.json({ error: 'R2 配置不完整' }, { status: 400 });
    }

    // 3. 使用事务创建管理员和配置
    await prisma.$transaction(async (tx) => {
      // 创建管理员用户
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
        },
      });

      // 创建 R2 配置
      const configs = [
        { key: 'r2_bucket', value: r2Bucket, updatedBy: admin.id },
        { key: 'r2_endpoint', value: r2Endpoint, updatedBy: admin.id },
        { key: 'r2_access_key_id', value: r2AccessKeyId, encrypted: true, updatedBy: admin.id },
        { key: 'r2_secret_access_key', value: r2SecretAccessKey, encrypted: true, updatedBy: admin.id },
        { key: 'r2_region', value: r2Region || 'auto', updatedBy: admin.id },
      ];

      // 可选配置
      if (r2PublicUrl) {
        configs.push({ key: 'r2_public_url', value: r2PublicUrl, updatedBy: admin.id, encrypted: false });
      }
      if (r2PathPrefix) {
        configs.push({ key: 'r2_path_prefix', value: r2PathPrefix, updatedBy: admin.id, encrypted: false });
      }

      // 批量创建配置
      await tx.systemConfig.createMany({
        data: configs,
      });

      // 记录初始化日志
      await tx.adminLog.create({
        data: {
          userId: admin.id,
          action: 'system_initialize',
          resourceType: 'system',
          resourceId: 'setup',
          details: { email: adminEmail },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('System initialization failed:', error);
    return safeErrorResponse('初始化失败，请稍后重试', 500, error);
  }
}
