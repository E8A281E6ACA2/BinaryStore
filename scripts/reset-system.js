#!/usr/bin/env node

/**
 * 重置系统 - 清空所有用户和配置数据
 * 用于测试初始化向导
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  try {
    console.log('🔄 开始重置系统...');

    // 清空系统配置
    const configCount = await prisma.systemConfig.deleteMany({});
    console.log(`✅ 已删除 ${configCount.count} 条系统配置`);

    // 清空所有用户（会级联删除相关数据）
    const userCount = await prisma.user.deleteMany({});
    console.log(`✅ 已删除 ${userCount.count} 个用户`);

    console.log('✨ 系统重置完成！');
    console.log('👉 现在可以访问 /admin/init 进行初始化');
  } catch (error) {
    console.error('❌ 重置失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
