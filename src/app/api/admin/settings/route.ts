import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { requireAdminUser } from '@/lib/auth-api';

// 定义需要加密的配置键
const ENCRYPTED_KEYS = [
  'r2_secret_access_key',
  'r2_access_key_id',
  's3_secret_access_key',
  's3_access_key_id',
  'smtp_password',
  'redis_password',
];

/**
 * GET /api/admin/settings
 * 读取所有系统配置（敏感字段脱敏显示）
 */
export async function GET(req: Request) {
  try {
    const auth = await requireAdminUser();
    if ('response' in auth) return auth.response;
    const { user } = auth;

    const configs = await (prisma as any).systemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    // 脱敏处理：敏感字段只显示是否已设置
    const sanitized = configs.map((c: any) => ({
      key: c.key,
      value: c.encrypted ? (c.value ? '********' : '') : c.value,
      encrypted: c.encrypted,
      updatedAt: c.updatedAt,
      hasValue: !!c.value,
    }));

    return NextResponse.json({ ok: true, configs: sanitized });
  } catch (err) {
    console.error('Get settings error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings
 * 批量更新系统配置
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminUser();
    if ('response' in auth) return auth.response;
    const { user } = auth;

    const body = await req.json();
    const { configs } = body; // configs: Array<{ key: string, value: string }>

    if (!Array.isArray(configs)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const results = [];

    // 保存配置
    for (const { key, value } of configs) {
      if (!key || typeof key !== 'string') continue;

      const shouldEncrypt = ENCRYPTED_KEYS.includes(key);
      
      // 如果 value 为空字符串或特殊占位符（如 "********"），表示不修改
      if (!value || value === '********') {
        continue;
      }

      // 清理输入值：去除前后空格、换行符等
      const cleanValue = value.trim().replace(/[\r\n]/g, '');
      
      const storedValue = shouldEncrypt ? encrypt(cleanValue) : cleanValue;

      const updated = await (prisma as any).systemConfig.upsert({
        where: { key },
        create: {
          key,
          value: storedValue,
          encrypted: shouldEncrypt,
          updatedBy: user.id,
        },
        update: {
          value: storedValue,
          encrypted: shouldEncrypt,
          updatedBy: user.id,
        },
      });

      results.push(updated);
    }

    // 记录审计日志
    try {
      await (prisma as any).adminLog.create({
        data: {
          userId: user.id,
          action: 'update_settings',
          resourceType: 'system_config',
          details: { keys: configs.map((c: any) => c.key) },
        },
      });
    } catch (e) {
      console.warn('Failed to write admin log', e);
    }

    return NextResponse.json({ ok: true, updated: results.length });
  } catch (err) {
    console.error('Update settings error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
