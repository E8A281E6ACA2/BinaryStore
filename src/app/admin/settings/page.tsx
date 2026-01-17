import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  return (
    <AdminShell>
      <div className="mb-4">
        <nav className="text-sm text-gray-600 dark:text-gray-400">
          后台 / 系统设置
        </nav>
      </div>

      <h1 className="text-2xl font-semibold mb-6">系统设置</h1>

      <div className="prose dark:prose-invert max-w-none mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          在此配置 R2/S3 存储、SMTP 邮件服务等系统级参数。敏感字段将被加密存储。
        </p>
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
          提示：如果配置项为空，系统将尝试从环境变量读取（fallback）。
        </p>
      </div>

      <SettingsForm />
    </AdminShell>
  );
}
