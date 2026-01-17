'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SetupData {
  // 管理员账号
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  
  // R2 存储配置
  r2Bucket: string;
  r2Endpoint: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2PublicUrl: string;
  r2Region: string;
  r2PathPrefix: string;
}

export default function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  
  const [data, setData] = useState<SetupData>({
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    r2Bucket: '',
    r2Endpoint: '',
    r2AccessKeyId: '',
    r2SecretAccessKey: '',
    r2PublicUrl: '',
    r2Region: 'auto',
    r2PathPrefix: '',
  });

  const updateData = (field: keyof SetupData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!data.adminEmail || !data.adminPassword) {
      setError('请填写邮箱和密码');
      return false;
    }
    if (data.adminPassword.length < 6) {
      setError('密码至少需要 6 个字符');
      return false;
    }
    if (data.adminPassword !== data.adminPasswordConfirm) {
      setError('两次密码输入不一致');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!data.r2Bucket || !data.r2Endpoint || !data.r2AccessKeyId || !data.r2SecretAccessKey) {
      setError('请填写所有必填的 R2 配置项');
      return false;
    }
    return true;
  };

  const testR2Connection = async () => {
    if (!validateStep2()) return;
    
    setTestingConnection(true);
    setError('');
    
    try {
      const response = await fetch('/api/setup/test-r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: data.r2Bucket,
          endpoint: data.r2Endpoint,
          accessKeyId: data.r2AccessKeyId,
          secretAccessKey: data.r2SecretAccessKey,
          region: data.r2Region,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ R2 连接测试成功！');
      } else {
        setError(`连接测试失败: ${result.error}`);
      }
    } catch (err: any) {
      setError(`连接测试失败: ${err.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/setup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        alert('🎉 系统初始化成功！即将跳转到登录页面...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 1000);
      } else {
        setError(result.error || '初始化失败');
      }
    } catch (err: any) {
      setError(`初始化失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          系统初始化向导
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          首次使用需要配置管理员账号和存储设置
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s === step
                  ? 'bg-blue-600 text-white'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-1 ${
                  s < step ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 步骤 1: 管理员账号 */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            步骤 1: 创建管理员账号
          </h2>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-400">
              💡 提交后系统会自动初始化数据库结构，无需手动运行迁移命令
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              邮箱 *
            </label>
            <input
              type="email"
              value={data.adminEmail}
              onChange={(e) => updateData('adminEmail', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              密码 * (至少 6 个字符)
            </label>
            <input
              type="password"
              value={data.adminPassword}
              onChange={(e) => updateData('adminPassword', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="输入密码"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              确认密码 *
            </label>
            <input
              type="password"
              value={data.adminPasswordConfirm}
              onChange={(e) => updateData('adminPasswordConfirm', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="再次输入密码"
            />
          </div>

          <button
            onClick={handleNext}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            下一步
          </button>
        </div>
      )}

      {/* 步骤 2: R2 存储配置 */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            步骤 2: 配置 R2 对象存储
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Bucket 名称 *
              </label>
              <input
                type="text"
                value={data.r2Bucket}
                onChange={(e) => updateData('r2Bucket', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="oss"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Region
              </label>
              <input
                type="text"
                value={data.r2Region}
                onChange={(e) => updateData('r2Region', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="auto"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Endpoint *
            </label>
            <input
              type="text"
              value={data.r2Endpoint}
              onChange={(e) => updateData('r2Endpoint', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://<account-id>.r2.cloudflarestorage.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Access Key ID *
            </label>
            <input
              type="text"
              value={data.r2AccessKeyId}
              onChange={(e) => updateData('r2AccessKeyId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="访问密钥 ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Secret Access Key *
            </label>
            <input
              type="password"
              value={data.r2SecretAccessKey}
              onChange={(e) => updateData('r2SecretAccessKey', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="访问密钥"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              公开 URL (可选)
            </label>
            <input
              type="text"
              value={data.r2PublicUrl}
              onChange={(e) => updateData('r2PublicUrl', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://oss.qs.al"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              如果配置了自定义域名，可以填写。留空则使用临时签名 URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              目录前缀 (可选)
            </label>
            <input
              type="text"
              value={data.r2PathPrefix}
              onChange={(e) => updateData('r2PathPrefix', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="例如: downloads/"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              所有上传文件的路径前缀，留空表示使用根目录
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition"
            >
              上一步
            </button>
            <button
              onClick={testR2Connection}
              disabled={testingConnection}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {testingConnection ? '测试中...' : '测试连接'}
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {/* 步骤 3: 确认 */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            步骤 3: 确认配置
          </h2>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">管理员账号</h3>
              <p className="text-gray-600 dark:text-gray-400">邮箱: {data.adminEmail}</p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">R2 存储配置</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Bucket: {data.r2Bucket}</p>
                <p>Endpoint: {data.r2Endpoint}</p>
                <p>Region: {data.r2Region}</p>
                {data.r2PublicUrl && <p>公开 URL: {data.r2PublicUrl}</p>}
                {data.r2PathPrefix && <p>目录前缀: {data.r2PathPrefix}</p>}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              ⚠️ 请确认配置信息正确。完成后系统将自动初始化数据库并创建管理员账号。
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition"
            >
              上一步
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {loading ? '初始化中...' : '完成初始化'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import Link from 'next/link';
import StatsCharts from '@/components/admin/StatsCharts';
import ExportButtons from '@/components/admin/ExportButtons';

// 获取统计数据
async function getStats(days: number = 30) {
  // 总下载次数
  const totalDownloads = await prisma.download.count();

  // 计算时间范围
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 时间范围内的下载次数
  const periodDownloads = await prisma.download.count({
    where: {
      downloadedAt: {
        gte: startDate,
      },
    },
  });

  // 产品统计
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      _count: {
        select: {
          downloads: true,
          releases: true,
        },
      },
    },
    orderBy: {
      downloads: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  // 版本统计
  const totalReleases = await prisma.release.count();

  // 用户统计
  const totalUsers = await prisma.user.count();

  // 最近下载记录
  const recentDownloads = await prisma.download.findMany({
    take: 20,
    orderBy: { downloadedAt: 'desc' },
    select: {
      id: true,
      platform: true,
      arch: true,
      downloadedAt: true,
      release: {
        select: {
          version: true,
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // 按日期统计下载量
  const downloadsByDate = await prisma.$queryRaw<
    Array<{ date: string; count: bigint }>
  >`
    SELECT 
      DATE("downloadedAt") as date,
      COUNT(*) as count
    FROM downloads
    WHERE "downloadedAt" >= ${startDate}
    GROUP BY DATE("downloadedAt")
    ORDER BY date DESC
  `;

  // 按平台统计
  const downloadsByPlatform = await prisma.download.groupBy({
    by: ['platform'],
    where: {
      downloadedAt: {
        gte: startDate,
      },
    },
    _count: true,
    orderBy: {
      _count: {
        platform: 'desc',
      },
    },
  });

  // 按架构统计
  const downloadsByArch = await prisma.download.groupBy({
    by: ['arch'],
    where: {
      downloadedAt: {
        gte: startDate,
      },
    },
    _count: true,
    orderBy: {
      _count: {
        arch: 'desc',
      },
    },
  });

  // 总存储大小
  const totalStorageResult = await prisma.release.aggregate({
    _sum: {
      size: true,
    },
  });

  const totalStorage = totalStorageResult._sum.size || 0;

  return {
    totalDownloads,
    periodDownloads,
    totalReleases,
    totalUsers,
    totalStorage,
    products,
    recentDownloads,
    downloadsByDate: downloadsByDate.map((d) => ({
      date: d.date,
      count: Number(d.count),
    })),
    downloadsByPlatform: downloadsByPlatform.map((p) => ({
      platform: p.platform,
      count: p._count,
    })),
    downloadsByArch: downloadsByArch.map((a) => ({
      arch: a.arch,
      count: a._count,
    })),
    days,
  };
}

