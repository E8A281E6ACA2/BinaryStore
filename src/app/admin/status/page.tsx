'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';

interface HealthCheckResult {
  status: string;
  timestamp: string;
  checks: {
    database: {
      ok: boolean;
      message: string;
      details: any;
    };
    storage: {
      ok: boolean;
      message: string;
      details: any;
    };
    redis: {
      ok: boolean;
      message: string;
      details: any;
    };
    environment: {
      ok: boolean;
      message: string;
      details: any;
    };
  };
  details: {
    uptime: number;
    memoryUsage: any;
  };
}

export default function StatusPage() {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshHealthStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取系统状态失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHealthStatus();
    // 每30秒自动刷新一次
    const interval = setInterval(refreshHealthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (ok: boolean) => {
    if (ok) {
      return <span className="inline-flex items-center justify-center rounded-full bg-green-100 p-1 text-green-800"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></span>;
    }
    return <span className="inline-flex items-center justify-center rounded-full bg-red-100 p-1 text-red-800"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></span>;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatMemory = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <AdminShell>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">后台 / 系统状态</div>
        <button
          onClick={refreshHealthStatus}
          disabled={loading}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '检查中...' : '刷新状态'}
        </button>
      </div>

      <section className="rounded-lg border bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">系统健康状态</h2>
          {healthStatus && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              healthStatus.status === 'healthy' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {healthStatus.status === 'healthy' ? '正常' : '异常'}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">正在检查系统状态...</span>
          </div>
        ) : healthStatus ? (
          <>
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-medium text-gray-900">服务状态</h3>
              <div className="space-y-4">
                {Object.entries(healthStatus.checks).map(([key, check]) => (
                  <div key={key} className="flex items-start justify-between rounded-md border p-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">{getStatusIcon(check.ok)}</div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {key === 'database' && '数据库'}
                          {key === 'storage' && '存储服务'}
                          {key === 'redis' && 'Redis 缓存'}
                          {key === 'environment' && '环境配置'}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">{check.message}</p>
                        {check.details && Object.entries(check.details).map(([detailKey, detailValue]) => (
                          <p key={detailKey} className="mt-1 text-xs text-gray-400">
                            {detailKey}: {typeof detailValue === 'object' ? JSON.stringify(detailValue) : detailValue}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 text-lg font-medium text-gray-900">系统信息</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-md border p-4">
                  <h4 className="text-sm font-medium text-gray-900">服务器运行时间</h4>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatUptime(healthStatus.details.uptime)}
                  </p>
                </div>
                <div className="rounded-md border p-4">
                  <h4 className="text-sm font-medium text-gray-900">内存使用</h4>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatMemory(healthStatus.details.memoryUsage.rss)}
                  </p>
                </div>
                <div className="rounded-md border p-4">
                  <h4 className="text-sm font-medium text-gray-900">检查时间</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(healthStatus.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="rounded-md border p-4">
                  <h4 className="text-sm font-medium text-gray-900">Node.js 版本</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {healthStatus.checks.environment.details.nodeVersion}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">健康检查说明</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>• 数据库检查：测试与数据库的连接是否正常</p>
                    <p>• 存储服务：检查 R2/S3 存储配置和连接</p>
                    <p>• Redis 缓存：检查 Redis 连接状态（可选）</p>
                    <p>• 环境配置：检查 Node.js 版本和环境变量</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </AdminShell>
  );
}