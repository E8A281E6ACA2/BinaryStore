import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

// 从环境变量获取主密钥，如果未设置则使用默认值（生产环境必须设置）
const MASTER_KEY = resolveMasterKey();

function resolveMasterKey() {
  const key = process.env.CONFIG_ENCRYPTION_KEY?.trim();
  if (key && key.length >= 32) return key;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CONFIG_ENCRYPTION_KEY must be set to a strong value (>=32 chars) in production.');
  }
  // 非生产环境生成一次性密钥，避免弱默认值；重启会导致先前加密内容失效
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * 使用 PBKDF2 从主密钥派生加密密钥
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(MASTER_KEY, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * 加密敏感配置值
 * @param plaintext 明文字符串
 * @returns 加密后的字符串（格式：salt:iv:tag:ciphertext，都是 hex 编码）
 */
export function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // 格式：salt:iv:tag:ciphertext
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * 解密敏感配置值
 * @param ciphertext 加密的字符串（格式：salt:iv:tag:ciphertext）
 * @returns 解密后的明文字符串
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted format');
  }
  
  const [saltHex, ivHex, tagHex, encryptedHex] = parts;
  
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  
  const key = deriveKey(salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

/**
 * 检查字符串是否为加密格式
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 4 && parts.every(p => /^[0-9a-f]+$/i.test(p));
}
