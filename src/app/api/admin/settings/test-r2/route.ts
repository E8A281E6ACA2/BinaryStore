import { NextResponse } from 'next/server';
import { S3Client, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getStorageConfig } from '@/lib/config';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const isProd = process.env.NODE_ENV === 'production';

/**
 * 从请求中获取当前用户
 */
async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('sb_session')?.value;
    if (!sessionId) return null;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) return null;
    if (session.revoked) return null;
    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) return null;
    return session.user;
  } catch (e) {
    console.error('getCurrentUser error', e);
    return null;
  }
}

/**
 * POST /api/admin/settings/test-r2
 * 测试 R2/S3 连接配置
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', details: 'Only admins can test R2 connection' }, { status: 401 });
    }

    // 读取 R2 配置
    const config = await getStorageConfig();
    
    if (!config.bucket) {
      return NextResponse.json({ 
        ok: false, 
        error: 'R2 Bucket 未配置',
        details: '请先在系统设置中配置 R2 Bucket 名称'
      }, { status: 400 });
    }

    if (!config.accessKeyId || !config.secretAccessKey) {
      return NextResponse.json({ 
        ok: false, 
        error: 'R2 凭证未配置',
        details: '请先配置 Access Key ID 和 Secret Access Key'
      }, { status: 400 });
    }

    // 清理配置值（去除前后空格、换行符等）
    const cleanAccessKeyId = config.accessKeyId.trim();
    const cleanSecretAccessKey = config.secretAccessKey.trim();
    const cleanBucket = config.bucket.trim();
    const cleanEndpoint = config.endpoint?.trim();
    
    // 开发模式下输出调试信息
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 R2 配置调试:');
      console.log('  Bucket:', cleanBucket);
      console.log('  Endpoint:', cleanEndpoint);
      console.log('  Region:', config.region);
      console.log('  Access Key ID 长度:', cleanAccessKeyId.length);
      console.log('  Secret Key 长度:', cleanSecretAccessKey.length);
      console.log('  Access Key ID 前10位:', cleanAccessKeyId.substring(0, 10) + '...');
    }
    
    // 验证凭证格式
    if (cleanAccessKeyId.includes('\n') || cleanAccessKeyId.includes('\r')) {
      return NextResponse.json({
        ok: false,
        error: '访问密钥格式错误',
        details: 'Access Key ID 不应包含换行符，请检查配置'
      }, { status: 400 });
    }
    
    if (cleanSecretAccessKey.includes('\n') || cleanSecretAccessKey.includes('\r')) {
      return NextResponse.json({
        ok: false,
        error: '密钥格式错误',
        details: 'Secret Access Key 不应包含换行符，请检查配置'
      }, { status: 400 });
    }

    // 创建 S3 客户端
    const client = new S3Client({
      region: config.region || 'auto',
      endpoint: cleanEndpoint || undefined,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretAccessKey,
      },
    });

    // 测试 1: HeadBucket（检查 bucket 是否存在和有权限）
    try {
      await client.send(new HeadBucketCommand({ Bucket: cleanBucket }));
    } catch (err: any) {
      return NextResponse.json({
        ok: false,
        error: 'Bucket 访问失败，请检查配置',
        ...(isProd
          ? {}
          : {
              details: err?.message || '无法访问指定的 Bucket，请检查配置是否正确',
              errorCode: err?.Code || err?.$metadata?.httpStatusCode,
            }),
      }, { status: 400 });
    }

    // 测试 2: ListObjectsV2（检查列表权限，限制返回 1 个对象）
    try {
      const listResult = await client.send(new ListObjectsV2Command({ 
        Bucket: cleanBucket,
        MaxKeys: 1,
      }));
      
      return NextResponse.json({
        ok: true,
        message: 'R2 连接测试成功',
        details: {
          bucket: config.bucket,
          endpoint: config.endpoint,
          region: config.region,
          objectCount: listResult.KeyCount || 0,
          hasContents: (listResult.Contents?.length || 0) > 0,
        },
      });
    } catch (err: any) {
      // 如果 HeadBucket 成功但 List 失败，可能是权限问题
      return NextResponse.json({
        ok: true, // Bucket 本身可访问
        warning: 'Bucket 可访问，但列表权限受限',
        message: 'R2 连接基本正常（建议检查权限配置）',
        ...(isProd
          ? {}
          : {
              details: {
                bucket: config.bucket,
                endpoint: config.endpoint,
                region: config.region,
                listError: err?.message,
              },
            }),
      });
    }
  } catch (err: any) {
    console.error('Test R2 connection error:', err);
    return NextResponse.json({
      ok: false,
      error: '连接测试失败',
      ...(isProd ? {} : { details: err?.message || '未知错误' }),
    }, { status: 500 });
  }
}
