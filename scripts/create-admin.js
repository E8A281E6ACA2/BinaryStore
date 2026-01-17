#!/usr/bin/env node

/**
 * 直接创建管理员账号
 * 使用方法：node scripts/create-admin.js <email> <password> [name]
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password, salt) {
  const _salt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, _salt, 64).toString('hex');
  return `${_salt}:${derived}`;
}

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const name = args[2];

  if (!email || !password) {
    console.error('❌ 使用方法: node scripts/create-admin.js <email> <password> [name]');
    console.error('   示例: node scripts/create-admin.js yh@qs.al mypassword "Yuan Huan"');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ 密码至少需要 6 位');
    process.exit(1);
  }

  try {
    // 检查邮箱是否已存在
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error(`❌ 邮箱 ${email} 已被注册`);
      process.exit(1);
    }

    // 加密密码
    const passwordHash = hashPassword(password);

    // 创建管理员用户
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: name || null,
        isAdmin: true,
      },
    });

    console.log('✅ 管理员账号创建成功！');
    console.log(`   邮箱: ${user.email}`);
    console.log(`   昵称: ${user.name || 'N/A'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   管理员: ${user.isAdmin ? '是' : '否'}`);
    console.log('\n现在可以使用此账号登录后台');

  } catch (err) {
    console.error('❌ 创建失败:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
