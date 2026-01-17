import { NextResponse } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

export function safeErrorResponse(message: string, status = 500, error?: unknown) {
  const payload: Record<string, unknown> = { error: message };

  if (!isProd && error) {
    payload.details = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(payload, { status });
}
