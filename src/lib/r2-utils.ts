import { prisma } from './prisma';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * 生成 R2 对象存储的完整路径
 * 格式: {prefix}/products/{slug}/{version}/{filename}
 * 如果没有配置前缀，则使用默认格式: products/{slug}/{version}/{filename}
 */
export async function generateR2Key(
  productSlug: string,
  version: string,
  filename: string
): Promise<string> {
  // 读取目录前缀配置
  const config = await prisma.systemConfig.findUnique({
    where: { key: 'r2_path_prefix' }
  });

  const prefix = config?.value?.trim() || '';

  // 构建基础路径
  const basePath = `products/${productSlug}/${version}/${filename}`;

  // 如果有前缀，添加前缀
  if (prefix) {
    // 确保前缀末尾有斜杠
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return `${normalizedPrefix}${basePath}`;
  }

  return basePath;
}

/**
 * 从环境变量或系统配置获取 R2 配置
 */
export async function getR2Config() {
  // 批量查询所有 R2 配置
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: [
          'r2_bucket',
          'r2_endpoint',
          'r2_access_key_id',
          'r2_secret_access_key',
          'r2_public_url',
          'r2_region',
          'r2_path_prefix'
        ]
      }
    }
  });

  // 转换为对象
  const configMap = configs.reduce((acc, config) => {
    acc[config.key] = config.value;
    return acc;
  }, {} as Record<string, string>);

  // 返回配置，优先使用数据库配置，fallback 到环境变量
  return {
    bucket: configMap['r2_bucket'] || process.env.R2_BUCKET || '',
    endpoint: configMap['r2_endpoint'] || process.env.R2_ENDPOINT || '',
    accessKeyId: configMap['r2_access_key_id'] || process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: configMap['r2_secret_access_key'] || process.env.R2_SECRET_ACCESS_KEY || '',
    publicUrl: configMap['r2_public_url'] || process.env.R2_PUBLIC_URL || '',
    region: configMap['r2_region'] || process.env.R2_REGION || 'auto',
    pathPrefix: configMap['r2_path_prefix'] || ''
  };
}

/**
 * 删除产品的旧版本（保留下载统计）
 * 用于实现"同一产品只保留最新版本"的策略
 */
export async function deleteOldReleases(productId: string, keepReleaseIds: string[] = []) {
  // 查询所有旧版本
  const oldReleases = await prisma.release.findMany({
    where: {
      productId,
      id: keepReleaseIds.length > 0 ? { notIn: keepReleaseIds } : undefined,
    },
    select: {
      id: true,
      r2Key: true,
      version: true,
      _count: {
        select: { downloads: true }
      }
    },
  });

  if (oldReleases.length === 0) {
    return { deletedCount: 0, totalDownloads: 0 };
  }

  // 统计总下载量
  const totalDownloads = oldReleases.reduce((sum, r) => sum + r._count.downloads, 0);

  // 获取 R2 配置并删除文件
  try {
    const r2Config = await getR2Config();
    if (r2Config.bucket && r2Config.endpoint && r2Config.accessKeyId) {
      const s3Client = new S3Client({
        region: r2Config.region,
        endpoint: r2Config.endpoint,
        credentials: {
          accessKeyId: r2Config.accessKeyId,
          secretAccessKey: r2Config.secretAccessKey,
        },
      });

      // 并发删除所有 R2 文件
      await Promise.allSettled(
        oldReleases.map((release) =>
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: r2Config.bucket,
              Key: release.r2Key,
            })
          )
        )
      );
    }
  } catch (r2Error) {
    console.error('Failed to delete old R2 files:', r2Error);
    // 继续执行数据库删除
  }

  // 删除旧版本记录（会级联删除 downloads）
  const deleteResult = await prisma.release.deleteMany({
    where: {
      productId,
      id: keepReleaseIds.length > 0 ? { notIn: keepReleaseIds } : undefined,
    },
  });

  return {
    deletedCount: deleteResult.count,
    totalDownloads,
    versions: oldReleases.map(r => r.version),
  };
}
