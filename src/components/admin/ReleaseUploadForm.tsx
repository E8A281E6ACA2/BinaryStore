export default function ReleaseUploadForm({ products, preselectedSlug }: { products: ProductOption[]; preselectedSlug?: string }) {
const searchParams = useSearchParams();
const productFromUrl = preselectedSlug || searchParams.get('product') || '';
const initialProduct = products.find(p => p.slug === productFromUrl)?.slug || products[0]?.slug || '';
const [productSlug, setProductSlug] = useState(initialProduct);
const [version, setVersion] = useState('');
const [file, setFile] = useState<File | null>(null);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState<string | null>(null);
const [progress, setProgress] = useState(0);
const [uploadStatus, setUploadStatus] = useState<string>('');

useEffect(() => {
if (productFromUrl && products.find(p => p.slug === productFromUrl)) {
setProductSlug(productFromUrl);
}
}, [productFromUrl, products]);

async function onSubmit(e: React.FormEvent) {
e.preventDefault();
if (!productSlug || !version || !file) {
setMessage('请选择产品、版本并选择一个文件');
return;
}
setLoading(true);
setMessage(null);
setProgress(0);
setUploadStatus('准备上传...');
try {
// If file is large, use multipart presign flow
const LARGE_THRESHOLD = 100 * 1024 * 1024; // 100MB - 小于此大小使用单次上传
if (file.size > LARGE_THRESHOLD) {
setUploadStatus('初始化分片上传...');
// start multipart
const startRes = await fetch('/api/admin/releases/multipart/start', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ productSlug, version, filename: file.name, contentType: file.type, size: file.size }),
});
const startData = await startRes.json();
if (!startRes.ok) {
setMessage(startData?.error || '无法开始 multipart 上传，回退到单次上传');
} else {
const { parts, uploadId, releaseId, key } = startData;
// upload each part
const partSize = Math.ceil(file.size / parts.length);
const etags: Array<{ ETag: string; PartNumber: number }> = [];
for (let i = 0; i < parts.length; i++) {
const p = parts[i];
const partNumber = p.partNumber as number;
setUploadStatus(`上传分片 ${i + 1}/${parts.length}...`);
const start = (partNumber - 1) * partSize;
const end = Math.min(start + partSize, file.size);
const blob = file.slice(start, end);
const put = await fetch(p.url, { method: 'PUT', body: blob, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
if (!put.ok) {
setMessage('上传分片失败: ' + partNumber);
return;
}
const etag = put.headers.get('ETag') || '';
etags.push({ ETag: etag, PartNumber: partNumber });
setProgress(Math.round(((i + 1) / parts.length) * 90)); // 90% for upload, 10% for completion
}

// complete
setUploadStatus('完成上传，正在处理...');
setProgress(95);
const complete = await fetch('/api/admin/releases/multipart/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ releaseId, key, uploadId, parts: etags }) });
const completeData = await complete.json();
if (!complete.ok) {
setMessage(completeData?.error || 'multipart 完成确认失败');
} else {
setProgress(100);
setUploadStatus('上传完成！');
setMessage('上传成功: ' + (completeData.release?.url || '已完成'));
}
}
} else {
setUploadStatus('上传文件...');
// legacy small-file path: try presign single PUT, fallback to local
const presignRes = await fetch('/api/admin/releases/presign', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ productSlug, version, filename: file.name, contentType: file.type }),
});
const presignData = await presignRes.json();
if (!presignRes.ok) {
// fallback to local upload
setUploadStatus('使用本地上传...');
setProgress(30);
const fd = new FormData();
fd.append('productSlug', productSlug);
fd.append('version', version);
fd.append('file', file);

setProgress(50);
const res = await fetch('/api/admin/releases/upload', { method: 'POST', body: fd });
const data = await res.json();
setProgress(90);
if (!res.ok) {
setMessage(data?.error || '上传失败');
} else {
setProgress(100);
setUploadStatus('上传完成！');
setMessage('上传成功 (本地): ' + (data.release?.url || '已创建'));
}
} else {
// Use presigned URL
const { presignedUrl, releaseId, key } = presignData;
setProgress(20);
// PUT file to presigned URL with XHR for progress tracking
await new Promise<void>((resolve, reject) => {
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
if (e.lengthComputable) {
const percentComplete = Math.round((e.loaded / e.total) * 70) + 20; // 20-90%
setProgress(percentComplete);
setUploadStatus(`上传中... ${percentComplete}%`);
}
});
xhr.addEventListener('load', () => {
if (xhr.status === 200) {
resolve();
} else {
reject(new Error('上传到存储失败'));
}
});
xhr.addEventListener('error', () => reject(new Error('上传失败')));
xhr.open('PUT', presignedUrl);
xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
xhr.send(file);
});

// Notify server to finalize
setProgress(95);
setUploadStatus('完成上传，正在处理...');
const complete = await fetch('/api/admin/releases/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ releaseId, key }) });
const completeData = await complete.json();
if (!complete.ok) {
setMessage(completeData?.error || '上传完成确认失败');
} else {
setProgress(100);
setUploadStatus('上传完成！');
setMessage('上传成功: ' + (completeData.release?.url || '已完成'));
}
}
}
} catch (err) {
console.error(err);
setMessage('上传出错: ' + (err instanceof Error ? err.message : String(err)));
setUploadStatus('上传失败');
} finally {
setLoading(false);
}
}

return (
<form onSubmit={onSubmit} className="space-y-4">
<div>
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">产品</label>
<select 
value={productSlug} 
onChange={(e) => setProductSlug(e.target.value)} 
className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
disabled={loading}
>
{products.map((p) => (
<option key={p.slug} value={p.slug}>
{p.name} ({p.slug})
</option>
))}
</select>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">版本号</label>
<input 
value={version} 
onChange={(e) => setVersion(e.target.value)} 
placeholder="1.0.0"
className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800"
disabled={loading}
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">选择文件</label>
<input 
type="file" 
onChange={(e) => setFile(e.target.files?.[0] || null)} 
className="mt-1 block w-full text-sm"
disabled={loading}
/>
{file && (
<p className="mt-2 text-sm text-gray-500">
文件: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
</p>
)}
</div>

{loading && (
<div className="space-y-2">
<div className="flex items-center justify-between text-sm">
<span className="text-gray-600 dark:text-gray-400">{uploadStatus}</span>
<span className="font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
</div>
<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
<div 
className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
style={{ width: `${progress}%` }}
/>
</div>
</div>
)}

<div>
<button 
disabled={loading} 
className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
>
{loading ? '上传中…' : '上传并创建版本'}
</button>
</div>

{message && (
<div className={`rounded-lg p-3 text-sm ${
message.includes('成功') 
? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
}`}>
{message}
</div>
)}
</form>
);
}

"use client";"use client";



import React, { useState } from 'react';import React, { useState } from 'react';

import { useRouter } from 'next/navigation';import { useRouter } from 'next/navigation';



