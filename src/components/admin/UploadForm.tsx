"use client";

import { useState } from 'react';

interface UploadFormProps {
  productId: string;
  productSlug: string;
  onSuccess?: () => void;
}

export default function UploadForm({ productId, productSlug, onSuccess }: UploadFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    version: '',
    releaseNotes: '',
    file: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      setError('请选择文件');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('productId', productId);
      data.append('version', formData.version);
      data.append('releaseNotes', formData.releaseNotes);
      data.append('file', formData.file);

      const res = await fetch('/api/admin/releases', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || '上传失败');
      }

      // 成功
      setFormData({ version: '', releaseNotes: '', file: null });
      setIsOpen(false);
      if (onSuccess) onSuccess();
      window.location.reload(); // 刷新页面显示新版本
    } catch (err: any) {
      setError(err.message || '上传失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
      >
        上传新版本
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                上传新版本
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  版本号 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: 1.0.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  选择文件 *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                />
                {formData.file && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    文件大小: {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  更新说明
                </label>
                <textarea
                  rows={6}
                  placeholder="描述此版本的更新内容..."
                  value={formData.releaseNotes}
                  onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '上传中...' : '确认上传'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
