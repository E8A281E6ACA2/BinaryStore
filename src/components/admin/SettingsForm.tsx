"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ConfigItem = {
  key: string;
  value: string;
};

type FieldConfig = {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  description?: string;
  section: string;
};

// Define ALL_FIELDS - this should be imported or defined properly
const ALL_FIELDS: FieldConfig[] = [
  // R2 存储配置
  {
    key: 'r2_account_id',
    label: 'R2 Account ID',
    type: 'text',
    placeholder: '如：c1234567890abcdef',
    description: 'Cloudflare R2 账户 ID',
    section: 'R2 存储配置',
  },
  {
    key: 'r2_access_key_id',
    label: 'R2 Access Key ID',
    type: 'text',
    placeholder: '如：AKIAIOSFODNN7EXAMPLE',
    description: 'R2 访问密钥 ID（将被加密存储）',
    section: 'R2 存储配置',
  },
  {
    key: 'r2_secret_access_key',
    label: 'R2 Secret Access Key',
    type: 'password',
    placeholder: '留空表示不修改',
    description: 'R2 秘密访问密钥（将被加密存储）',
    section: 'R2 存储配置',
  },
  {
    key: 'r2_bucket',
    label: 'R2 Bucket Name',
    type: 'text',
    placeholder: '如：my-app-storage',
    description: 'R2 存储桶名称',
    section: 'R2 存储配置',
  },
  {
    key: 'r2_public_url',
    label: 'R2 Public URL',
    type: 'text',
    placeholder: '如：https://pub-1234567890abcdef.r2.dev',
    description: 'R2 公共访问 URL（可选，用于直接访问存储的文件）',
    section: 'R2 存储配置',
  },
  {
    key: 'r2_region',
    label: 'R2 Region',
    type: 'text',
    placeholder: '如：auto',
    description: 'R2 区域（通常为 auto）',
    section: 'R2 存储配置',
  },

  // S3 存储配置（备用）
  {
    key: 's3_access_key_id',
    label: 'S3 Access Key ID',
    type: 'text',
    placeholder: '如：AKIAIOSFODNN7EXAMPLE',
    description: 'S3 兼容存储的访问密钥 ID（将被加密存储）',
    section: 'S3 存储配置（备用）',
  },
  {
    key: 's3_secret_access_key',
    label: 'S3 Secret Access Key',
    type: 'password',
    placeholder: '留空表示不修改',
    description: 'S3 兼容存储的秘密访问密钥（将被加密存储）',
    section: 'S3 存储配置（备用）',
  },
  {
    key: 's3_bucket',
    label: 'S3 Bucket Name',
    type: 'text',
    placeholder: '如：my-app-storage',
    description: 'S3 存储桶名称',
    section: 'S3 存储配置（备用）',
  },
  {
    key: 's3_region',
    label: 'S3 Region',
    type: 'text',
    placeholder: '如：us-east-1',
    description: 'S3 区域',
    section: 'S3 存储配置（备用）',
  },
  {
    key: 's3_endpoint',
    label: 'S3 Endpoint URL',
    type: 'text',
    placeholder: '如：https://s3.amazonaws.com',
    description: 'S3 兼容存储的端点 URL（可选）',
    section: 'S3 存储配置（备用）',
  },

  // SMTP 邮件配置
  {
    key: 'smtp_host',
    label: 'SMTP Host',
    type: 'text',
    placeholder: '如：smtp.gmail.com',
    description: 'SMTP 服务器地址',
    section: 'SMTP 邮件配置',
  },
  {
    key: 'smtp_port',
    label: 'SMTP Port',
    type: 'text',
    placeholder: '如：587',
    description: 'SMTP 服务器端口',
    section: 'SMTP 邮件配置',
  },
  {
    key: 'smtp_username',
    label: 'SMTP Username',
    type: 'text',
    placeholder: '如：your-email@example.com',
    description: 'SMTP 用户名',
    section: 'SMTP 邮件配置',
  },
  {
    key: 'smtp_password',
    label: 'SMTP Password',
    type: 'password',
    placeholder: '留空表示不修改',
    description: 'SMTP 密码（将被加密存储）',
    section: 'SMTP 邮件配置',
  },
  {
    key: 'smtp_from',
    label: 'SMTP From Address',
    type: 'text',
    placeholder: '如：noreply@example.com',
    description: '发件人邮箱地址',
    section: 'SMTP 邮件配置',
  },
  {
    key: 'smtp_secure',
    label: 'SMTP Secure',
    type: 'text',
    placeholder: '如：true 或 false',
    description: '是否使用 SSL/TLS',
    section: 'SMTP 邮件配置',
  },

  // 系统配置
  {
    key: 'system_name',
    label: '系统名称',
    type: 'text',
    placeholder: '如：BinaryStore',
    description: '系统显示名称',
    section: '系统配置',
  },
  {
    key: 'system_url',
    label: '系统 URL',
    type: 'text',
    placeholder: '如：https://example.com',
    description: '系统完整 URL（用于生成链接）',
    section: '系统配置',
  },
  {
    key: 'max_upload_size',
    label: '最大上传大小',
    type: 'text',
    placeholder: '如：500',
    description: '最大上传文件大小（MB）',
    section: '系统配置',
  },
  {
    key: 'allowed_file_types',
    label: '允许的文件类型',
    type: 'text',
    placeholder: '如：zip,tar.gz,exe,dmg',
    description: '逗号分隔的文件扩展名列表',
    section: '系统配置',
  },

  // Redis 配置
  {
    key: 'redis_url',
    label: 'Redis URL',
    type: 'text',
    placeholder: '如：redis://localhost:6379',
    description: 'Redis 连接 URL',
    section: 'Redis 配置',
  },
  {
    key: 'redis_password',
    label: 'Redis Password',
    type: 'password',
    placeholder: '留空表示不修改',
    description: 'Redis 密码（将被加密存储）',
    section: 'Redis 配置',
  },
  {
    key: 'redis_db',
    label: 'Redis Database',
    type: 'text',
    placeholder: '如：0',
    description: 'Redis 数据库编号',
    section: 'Redis 配置',
  },
];

export default function SettingsForm() {
  const router = useRouter();
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [testingR2, setTestingR2] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; details?: any } | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.configs) {
        const configMap: Record<string, string> = {};
        data.configs.forEach((c: ConfigItem) => {
          configMap[c.key] = c.value || '';
        });
        setConfigs(configMap);
      }
    } catch (err) {
      console.error('加载配置失败:', err);
      setError('加载配置失败');
    } finally {
      setLoadingData(false);
    }
  }

  function handleChange(key: string, value: string) {
    setConfigs(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setTestResult(null);
    setLoading(true);

    try {
      // 只提交有值的配置项
      const configsToUpdate = Object.entries(configs)
        .filter(([_, value]) => value && value !== '********')
        .map(([key, value]) => ({ key, value }));

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: configsToUpdate }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`成功更新 ${data.updated || 0} 项配置`);
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setError(data.error || '保存失败');
      }
    } catch (err) {
      console.error('保存配置失败:', err);
      setError('保存配置时发生错误');
    } finally {
      setLoading(false);
    }
  }

  async function handleTestR2() {
    setTestingR2(true);
    setTestResult(null);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings/test-r2', { method: 'POST' });
      const data = await res.json();
      
      setTestResult({
        ok: data.ok,
        message: data.ok ? (data.message || '连接成功') : (data.error || '连接失败'),
        details: data.details,
      });
    } catch (err) {
      console.error('测试 R2 连接失败:', err);
      setTestResult({
        ok: false,
        message: '测试请求失败',
        details: err,
      });
    } finally {
      setTestingR2(false);
    }
  }

  if (loadingData) {
    return <div className="text-sm text-gray-600">加载配置中...</div>;
  }

  // 按 section 分组
  const sections = ALL_FIELDS.reduce((acc, field) => {
    if (!acc[field.section]) acc[field.section] = [];
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, typeof ALL_FIELDS>);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {Object.entries(sections).map(([section, fields]) => (
        <div key={section} className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">{section}</h3>
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={configs[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder || (field.type === 'password' ? '留空表示不修改' : '')}
                  className="mt-1 block w-full max-w-xl rounded border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                />
                {field.description && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {field.description}
                  </p>
                )}
                {field.type === 'password' && configs[field.key] === '********' && (
                  <p className="mt-1 text-xs text-gray-500">已设置（留空或输入新值来更新）</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存配置'}
        </button>
        <button
          type="button"
          onClick={handleTestR2}
          disabled={testingR2 || loading}
          className="rounded border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-slate-700"
        >
          {testingR2 ? '测试中...' : '测试 R2 连接'}
        </button>
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {testResult && (
        <div className={`mt-4 rounded border p-4 ${testResult.ok ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.ok ? (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h4 className={`text-sm font-medium ${testResult.ok ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {testResult.message}
              </h4>
              {testResult.details && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(testResult.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

