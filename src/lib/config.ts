import { prisma } from './prisma';
import { decrypt } from './encryption';

/**
 * 读取系统配置值
 * 优先级：数据库 > 环境变量 > 默认值
 * 
 * @param key 配置键名
 * @param fallbackEnv 环境变量名（可选）
 * @param defaultValue 默认值（可选）
 * @returns 配置值或 null
 */
export async function getConfig(
  key: string,
  fallbackEnv?: string,
  defaultValue?: string
): Promise<string | null> {
  try {
    // 1. 尝试从数据库读取
    const config = await prisma.systemConfig.findUnique({ where: { key } });
    
    if (config) {
      // 如果是加密字段，解密后返回
      if (config.encrypted && config.value) {
        try {
          return decrypt(config.value);
        } catch (err) {
          console.error(`Failed to decrypt config "${key}":`, err);
          // 解密失败，继续尝试 fallback
        }
      }
      return config.value;
    }
    
    // 2. 尝试从环境变量读取
    if (fallbackEnv && process.env[fallbackEnv]) {
      return process.env[fallbackEnv]!;
    }
    
    // 3. 返回默认值
    return defaultValue || null;
  } catch (err) {
    console.error(`Error reading config "${key}":`, err);
    // 数据库读取失败，尝试环境变量
    if (fallbackEnv && process.env[fallbackEnv]) {
      return process.env[fallbackEnv]!;
    }
    return defaultValue || null;
  }
}

/**
 * 批量读取配置（用于初始化或批量查询）
 * @param keys 配置键名数组
 * @returns 键值对对象
 */
export async function getConfigs(keys: string[]): Promise<Record<string, string | null>> {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });
    
    const result: Record<string, string | null> = {};
    
    for (const key of keys) {
      const config = configs.find(c => c.key === key);
      if (config) {
        if (config.encrypted && config.value) {
          try {
            result[key] = decrypt(config.value);
          } catch (err) {
            console.error(`Failed to decrypt config "${key}":`, err);
            result[key] = null;
          }
        } else {
          result[key] = config.value;
        }
      } else {
        result[key] = null;
      }
    }
    
    return result;
  } catch (err) {
    console.error('Error reading configs:', err);
    return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
  }
}

/**
 * 读取 R2/S3 配置（便捷方法）
 */
export async function getStorageConfig() {
  const [bucket, endpoint, accessKeyId, secretAccessKey, publicUrl, region] = await Promise.all([
    getConfig('r2_bucket', 'R2_BUCKET'),
    getConfig('r2_endpoint', 'R2_ENDPOINT'),
    getConfig('r2_access_key_id', 'R2_ACCESS_KEY_ID'),
    getConfig('r2_secret_access_key', 'R2_SECRET_ACCESS_KEY'),
    getConfig('r2_public_url', 'R2_PUBLIC_URL'),
    getConfig('r2_region', 'R2_REGION', 'auto'),
  ]);
  
  return {
    bucket,
    endpoint,
    accessKeyId,
    secretAccessKey,
    publicUrl,
    region,
  };
}
