import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SetupWizard from '@/components/setup/SetupWizard';

export default async function SetupPage() {
  // 检查系统是否已初始化
  const isInitialized = await checkSystemInitialized();
  
  if (isInitialized) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <SetupWizard />
    </div>
  );
}

async function checkSystemInitialized() {
  try {
    // 检查是否有管理员用户
    const userCount = await prisma.user.count();
    if (userCount === 0) return false;

    // 检查是否有 R2 配置
    const r2Config = await prisma.systemConfig.findFirst({
      where: {
        key: {
          in: ['r2_bucket', 'r2_endpoint', 'r2_access_key_id']
        }
      }
    });
    
    // 如果有用户但没有 R2 配置，也视为未初始化
    return r2Config !== null;
  } catch (error) {
    // 数据库连接失败，可能还未初始化
    return false;
  }
}
