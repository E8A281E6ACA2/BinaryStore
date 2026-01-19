import { NextResponse } from 'next/server';

const isEnabled = process.env.NODE_ENV !== 'production' && process.env.ENABLE_TEST_ENV_ENDPOINT === 'true';

export async function GET() {
  if (!isEnabled) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    r2Configured: Boolean(
      process.env.R2_ENDPOINT &&
        process.env.R2_BUCKET &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY,
    ),
  });
}
