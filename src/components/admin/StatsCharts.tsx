'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface StatsChartsProps {
  downloadsByDate: Array<{ date: string; count: number }>;
  downloadsByPlatform: Array<{ platform: string; count: number }>;
  downloadsByArch: Array<{ arch: string; count: number }>;
  products: Array<{ name: string; slug: string; _count: { downloads: number } }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StatsCharts({
  downloadsByDate,
  downloadsByPlatform,
  downloadsByArch,
  products,
}: StatsChartsProps) {
  // 准备日期趋势数据（倒序显示）
  const trendData = [...downloadsByDate]
    .reverse()
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      下载量: d.count,
    }));

  // 准备平台数据
  const platformData = downloadsByPlatform.map((p) => ({
    name: p.platform,
    value: p.count,
  }));

  // 准备架构数据
  const archData = downloadsByArch.map((a) => ({
    name: a.arch,
    value: a.count,
  }));

  // 准备产品排行数据
  const productData = products.slice(0, 10).map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    下载量: p._count.downloads,
  }));

  return (
    <div className="space-y-8">
      {/* 下载趋势图 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">下载趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Area
              type="monotone"
              dataKey="下载量"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorDownloads)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 平台和架构分布 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 平台分布饼图 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">平台分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 架构分布饼图 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">架构分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={archData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {archData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 产品排行条形图 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          产品下载排行 Top 10
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={productData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis
              dataKey="name"
              type="category"
              width={150}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar dataKey="下载量" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
