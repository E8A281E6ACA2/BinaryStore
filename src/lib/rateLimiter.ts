type Entry = { attempts: number; firstAt: number };

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(1000 * 60 * 15), 10); // default 15 minutes
const MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_MAX || '10', 10);

// If REDIS_URL is provided and ioredis is installed, use Redis for rate limiting
let redisClient: any = null;
let useRedis = false;
if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://:password@host:6379/0') {
  try {
    // dynamic require so project doesn't require ioredis in all environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = require('ioredis');
    redisClient = new IORedis(process.env.REDIS_URL, {
      lazyConnect: true,
      retryStrategy: () => null, // 不重试，失败后立即降级
      maxRetriesPerRequest: 1,
    });
    
    // 测试连接
    redisClient.connect().then(() => {
      useRedis = true;
      // eslint-disable-next-line no-console
      console.log('✓ Redis 已连接，使用 Redis 进行速率限制');
    }).catch((err: any) => {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Redis 连接失败，降级到内存速率限制器:', err.message);
      useRedis = false;
      redisClient = null;
    });
    
    // 错误处理，防止未捕获的错误
    redisClient.on('error', (err: any) => {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Redis 错误 (已降级到内存模式):', err.message);
      useRedis = false;
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ ioredis 不可用，使用内存速率限制器');
    useRedis = false;
  }
}

// In-memory fallback (kept on global to survive module reloads in dev)
// @ts-ignore
const store: Map<string, Entry> = (globalThis as any).__simpleRateLimitStore || new Map();
(globalThis as any).__simpleRateLimitStore = store;

// Redis helper keys and behavior:
// - key: `${prefix}:${key}` -> value is attempts count and expiry set to WINDOW_MS
const REDIS_PREFIX = 'rate_limit';

export function isBlocked(key: string) {
  if (useRedis && redisClient) {
    // synchronous wrapper not possible; but callers expect boolean.
    // We provide an async-aware API via exported async functions below when Redis is used.
    throw new Error('isBlocked sync not supported when REDIS_URL is set; use asyncIsBlocked instead');
  }
  const e = store.get(key);
  if (!e) return false;
  if (Date.now() - e.firstAt > WINDOW_MS) {
    store.delete(key);
    return false;
  }
  return e.attempts >= MAX_ATTEMPTS;
}

export function recordFailure(key: string) {
  if (useRedis && redisClient) {
    throw new Error('recordFailure sync not supported when REDIS_URL is set; use asyncRecordFailure instead');
  }
  const now = Date.now();
  const e = store.get(key);
  if (!e) {
    store.set(key, { attempts: 1, firstAt: now });
    return;
  }
  if (now - e.firstAt > WINDOW_MS) {
    store.set(key, { attempts: 1, firstAt: now });
  } else {
    e.attempts += 1;
    store.set(key, e);
  }
}

export function resetKey(key: string) {
  if (useRedis && redisClient) {
    throw new Error('resetKey sync not supported when REDIS_URL is set; use asyncResetKey instead');
  }
  store.delete(key);
}

// Async Redis-backed functions
export async function asyncIsBlocked(key: string) {
  if (!useRedis || !redisClient) return isBlocked(key);
  const rkey = `${REDIS_PREFIX}:${key}`;
  const val = await redisClient.get(rkey);
  const attempts = val ? parseInt(val, 10) : 0;
  return attempts >= MAX_ATTEMPTS;
}

export async function asyncRecordFailure(key: string) {
  if (!useRedis || !redisClient) return recordFailure(key);
  const rkey = `${REDIS_PREFIX}:${key}`;
  // INCR and set expiry
  const attempts = await redisClient.incr(rkey);
  if (attempts === 1) {
    // set expiry
    await redisClient.pexpire(rkey, WINDOW_MS);
  }
  return attempts;
}

export async function asyncResetKey(key: string) {
  if (!useRedis || !redisClient) return resetKey(key);
  const rkey = `${REDIS_PREFIX}:${key}`;
  await redisClient.del(rkey);
}
