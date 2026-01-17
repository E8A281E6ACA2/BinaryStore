import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_INITIAL_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';

  if (!email || !password) {
    console.error('ERROR: ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD must be set');
    process.exit(1);
  }

  const hashed = hashPassword(password);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    console.log(`Updated password for existing user: ${email}`);
  } else {
    await prisma.user.create({ data: { email, password: hashed, name: 'Administrator', isAdmin: true } });
    console.log(`Created admin user: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error('Failed to create admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
