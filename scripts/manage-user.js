#!/usr/bin/env node

/**
 * 用户权限管理脚本
 * 使用方法：
 *   node scripts/manage-user.js list                  # 列出所有用户
 *   node scripts/manage-user.js grant admin@example.com  # 授予管理员权限
 *   node scripts/manage-user.js revoke admin@example.com # 撤销管理员权限
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('\n📋 用户列表:\n');
  console.log('ID\t\t\t\t\t邮箱\t\t\t昵称\t\t管理员\t创建时间');
  console.log('─'.repeat(120));
  
  users.forEach(u => {
    console.log(`${u.id}\t${u.email}\t${u.name || 'N/A'}\t${u.isAdmin ? '✓' : '✗'}\t${u.createdAt.toISOString().slice(0, 10)}`);
  });
  
  console.log('\n');
}

async function grantAdmin(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.error(`❌ 用户 ${email} 不存在`);
    process.exit(1);
  }
  
  if (user.isAdmin) {
    console.log(`ℹ️  用户 ${email} 已经是管理员`);
    process.exit(0);
  }
  
  await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });
  
  console.log(`✅ 已授予 ${email} 管理员权限`);
}

async function revokeAdmin(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.error(`❌ 用户 ${email} 不存在`);
    process.exit(1);
  }
  
  if (!user.isAdmin) {
    console.log(`ℹ️  用户 ${email} 已经不是管理员`);
    process.exit(0);
  }
  
  // 检查是否是唯一的管理员
  const adminCount = await prisma.user.count({ where: { isAdmin: true } });
  if (adminCount === 1) {
    console.error(`❌ 无法撤销 ${email} 的管理员权限：这是系统中唯一的管理员账号`);
    process.exit(1);
  }
  
  await prisma.user.update({
    where: { email },
    data: { isAdmin: false },
  });
  
  console.log(`✅ 已撤销 ${email} 的管理员权限`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const email = args[1];

  try {
    switch (command) {
      case 'list':
        await listUsers();
        break;
      case 'grant':
        if (!email) {
          console.error('❌ 请提供用户邮箱');
          process.exit(1);
        }
        await grantAdmin(email);
        break;
      case 'revoke':
        if (!email) {
          console.error('❌ 请提供用户邮箱');
          process.exit(1);
        }
        await revokeAdmin(email);
        break;
      default:
        console.log('用法:');
        console.log('  node scripts/manage-user.js list');
        console.log('  node scripts/manage-user.js grant <email>');
        console.log('  node scripts/manage-user.js revoke <email>');
        process.exit(1);
    }
  } catch (err) {
    console.error('错误:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
