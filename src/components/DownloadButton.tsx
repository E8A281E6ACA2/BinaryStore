'use client';

import { useState, useEffect } from 'react';
import { Product, ProductVersion, ProductDownload, formatFileSize } from '@/config/products';
import { detectPlatform, getPlatformIcon, getPlatformName } from '@/lib/platform-detect';

interface DownloadButtonProps {
  product: Product;
  version: ProductVersion;
}

export default function DownloadButton({ product, version }: DownloadButtonProps) {
  const [selectedDownload, setSelectedDownload] = useState<ProductDownload | null>(null);
  const [showAllDownloads, setShowAllDownloads] = useState(false);

  useEffect(() => {
    // Auto-detect platform
    const detected = detectPlatform(navigator.userAgent);
    const match = version.downloads.find(
      (d) => d.platform === detected.platform && d.arch === detected.arch
    );

    if (match) {
      setSelectedDownload(match);
    } else {
      // Fallback to first available
      setSelectedDownload(version.downloads[0] || null);
    }
  }, [version]);

  const handleDownload = async (download: ProductDownload) => {
    // Track download
    try {
      await fetch('/api/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          version: version.version,
          platform: download.platform,
          arch: download.arch,
        }),
      });
    } catch (error) {
      console.error('Failed to track download:', error);
    }

    // Redirect to download
    window.location.href = download.url;
  };

  if (!selectedDownload) {
    return (
      <div className="text-center text-gray-500">
        暂无可用下载
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Main Download Button */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white shadow-2xl">
        <div className="mb-4 text-center">
          <div className="mb-2 text-6xl">
            {getPlatformIcon(selectedDownload.platform)}
          </div>
          <h3 className="text-2xl font-bold">
            下载适用于 {getPlatformName(selectedDownload.platform)} 的版本
          </h3>
          <p className="mt-2 text-white/80">
            {selectedDownload.arch.toUpperCase()} • {formatFileSize(selectedDownload.size)}
          </p>
        </div>

        <button
          onClick={() => handleDownload(selectedDownload)}
          className="w-full rounded-xl bg-white py-4 text-xl font-bold text-blue-600 shadow-lg transition hover:scale-105 hover:shadow-xl"
        >
          立即下载
        </button>

        <div className="mt-4 text-center text-sm text-white/70">
          SHA-256: <code className="text-xs">{selectedDownload.checksum}</code>
        </div>
      </div>

      {/* Other Downloads */}
      <div className="text-center">
        <button
          onClick={() => setShowAllDownloads(!showAllDownloads)}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showAllDownloads ? '隐藏' : '显示'}其他平台下载 ↓
        </button>
      </div>

      {showAllDownloads && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {version.downloads.map((download, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-3xl">{getPlatformIcon(download.platform)}</div>
                  <h4 className="mt-2 font-bold text-gray-900 dark:text-white">
                    {getPlatformName(download.platform)}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {download.arch.toUpperCase()} • {formatFileSize(download.size)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownload(download)}
                className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                下载
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
