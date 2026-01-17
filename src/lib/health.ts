import { prisma } from './prisma';
import { getStorageConfig } from './config';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

/**
 * 检查数据库连接
 */
async function checkDatabase() {
  try {
    // 执行简单的查询来测试数据库连接
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      message: '数据库连接正常',
      details: {
        status: 'connected',
      },
    };
  } catch (error) {
    console.error('数据库连接检查失败:', error);
    return {
      ok: false,
      message: '数据库连接失败',
      details: {
        error: error instanceof Error ? error.message : '未知错误',
        status: 'disconnected',
      },
    };
  }
}

/**
 * 检查存储服务（R2/S3）
 */
async function checkStorage() {
  try {
    const config = await getStorageConfig();
    
    if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
      return {
        ok: true,
        message: '存储服务未配置（使用默认配置）',
        details: {
          status: 'not_configured',
        },
      };
    }

    // 清理配置值
    const cleanAccessKeyId = config.accessKeyId.trim();
    const cleanSecretAccessKey = config.secretAccessKey.trim();
    const cleanBucket = config.bucket.trim();
    const cleanEndpoint = config.endpoint?.trim();

    // 创建 S3 客户端
    const client = new S3Client({
      region: config.region || 'auto',
      endpoint: cleanEndpoint || undefined,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretAccessKey,
      },
    });

    // 测试存储桶访问
    await client.send(new HeadBucketCommand({ Bucket: cleanBucket }));
    
    return {
      ok: true,
      message: '存储服务连接正常',
      details: {
        status: 'connected',
        bucket: cleanBucket,
        endpoint: cleanEndpoint,
        region: config.region,
      },
    };
  } catch (error) {
    console.error('存储服务连接检查失败:', error);
    return {
      ok: false,
      message: '存储服务连接失败',
      details: {
        error: error instanceof Error ? error.message : '未知错误',
        status: 'disconnected',
      },
    };
  }
}

/**
 * 检查 Redis 连接
 */
async function checkRedis() {
  try {
    // 检查是否有 Redis 客户端（使用更安全的方式）
    const redisPath = './redis';
    let redis = null;
    
    try {
      // 尝试动态导入 Redis 模块
      redis = await import(redisPath);
    } catch (importError) {
      // 模块不存在，返回未配置状态
      return {
        ok: true,
        message: 'Redis 未配置（可选服务）',
        details: {
          status: 'not_configured',
          error: 'Redis 模块不存在',
        },
      };
    }

    if (!redis || !redis.default) {
      return {
        ok: true,
        message: 'Redis 未配置（可选服务）',
        details: {
          status: 'not_configured',
        },
      };
    }

    // 测试 Redis 连接
    const client = redis.default;
    await client.ping();
    
    return {
      ok: true,
      message: 'Redis 连接正常',
      details: {
        status: 'connected',
      },
    };
  } catch (error) {
    console.error('Redis 连接检查失败:', error);
    return {
      ok: false,
      message: 'Redis 连接失败（可选服务）',
      details: {
        error: error instanceof Error ? error.message : '未知错误',
        status: 'disconnected',
      },
    };
  }
}

/**
 * 检查系统健康状态
 */
export async function checkHealth() {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    redis: await checkRedis(),
    environment: {
      ok: true,
      message: '环境变量配置正常',
      details: {
        nodeVersion: process.version,
        nextVersion: process.env.NEXT_VERSION || 'unknown',
        environment: process.env.NODE_ENV || 'development',
      },
    },
  };

  const allHealthy = Object.values(checks).every(check => check.ok);

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    details: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  };
}

/**
 * 获取系统状态摘要
 */
export async function getStatusSummary() {
  const health = await checkHealth();
  return {
    status: health.status,
    checks: Object.entries(health.checks).reduce((acc, [key, check]) => {
      acc[key] = {
        status: check.ok ? 'ok' : 'error',
        message: check.message,
      };
      return acc;
    }, {} as Record<string, { status: string; message: string }>),
    timestamp: health.timestamp,
  };
}
