import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { safeErrorResponse } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bucket, endpoint, accessKeyId, secretAccessKey, region } = body;

    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: '缺少必填配置' }, { status: 400 });
    }

    // 创建 S3 客户端并测试连接
    const client = new S3Client({
      region: region || 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // 尝试列出 buckets (测试连接)
    await client.send(new ListBucketsCommand({}));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('R2 connection test failed:', error);
    return safeErrorResponse('连接失败，请检查配置', 500, error);
  }
}
