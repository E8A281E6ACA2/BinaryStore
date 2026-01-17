import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    R2_ENDPOINT: process.env.R2_ENDPOINT || 'not set',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'set (hidden)' : 'not set',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'set (hidden)' : 'not set',
    R2_BUCKET: process.env.R2_BUCKET || 'not set',
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || 'not set',
  });
}
