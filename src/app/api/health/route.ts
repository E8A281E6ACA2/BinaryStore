import { NextResponse } from 'next/server';
import { checkHealth, getStatusSummary } from '@/lib/health';

/**
 * 健康状态检查端点
 * GET /api/health
 * 
 * 响应格式：
 * {
 *   "status": "healthy" | "unhealthy",
 *   "timestamp": "2024-01-01T00:00:00Z",
 *   "checks": {
 *     "database": { "ok": true, "message": "数据库连接正常", "details": {...} },
 *     "storage": { "ok": true, "message": "存储服务连接正常", "details": {...} },
 *     "redis": { "ok": true, "message": "Redis连接正常", "details": {...} },
 *     "environment": { "ok": true, "message": "环境变量配置正常", "details": {...} }
 *   },
 *   "details": {
 *     "uptime": 1234.56,
 *     "memoryUsage": {...}
 *   }
 * }
 */
export async function GET() {
  try {
    const health = await checkHealth();
    
    // 根据健康状态返回不同的HTTP状态码
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('健康检查端点错误:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: '健康检查失败',
      error: error instanceof Error ? error.message : '未知错误',
    }, {
      status: 500,
    });
  }
}

/**
 * 状态摘要端点
 * GET /api/health/summary
 * 
 * 响应格式：
 * {
 *   "status": "healthy" | "unhealthy",
 *   "timestamp": "2024-01-01T00:00:00Z",
 *   "checks": {
 *     "database": { "status": "ok", "message": "数据库连接正常" },
 *     "storage": { "status": "ok", "message": "存储服务连接正常" },
 *     "redis": { "status": "ok", "message": "Redis连接正常" },
 *     "environment": { "status": "ok", "message": "环境变量配置正常" }
 *   }
 * }
 */
export async function GET_SUMMARY() {
  try {
    const summary = await getStatusSummary();
    return NextResponse.json(summary, {
      status: 200,
      headers: {
        'Cache-Control': 'max-age=30',
      },
    });
  } catch (error) {
    console.error('状态摘要端点错误:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: '获取状态摘要失败',
    }, {
      status: 500,
    });
  }
}
