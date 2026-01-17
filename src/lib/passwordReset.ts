import crypto from 'crypto';
import { prisma } from './prisma';

export function makeResetToken(len = 48) {
  return crypto.randomBytes(len).toString('hex');
}

export async function createPasswordReset(userId: string, expiresInSec = 60 * 60) {
  const token = makeResetToken(32);
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);
  const rec = await prisma.passwordReset.create({ data: { token, userId, expiresAt } });
  return rec;
}

export async function consumePasswordReset(token: string) {
  const rec = await prisma.passwordReset.findUnique({ where: { token } });
  if (!rec) return null;
  if (rec.used) return null;
  if (rec.expiresAt.getTime() < Date.now()) return null;
  // mark used
  await prisma.passwordReset.update({ where: { id: rec.id }, data: { used: true } });
  return rec;
}
