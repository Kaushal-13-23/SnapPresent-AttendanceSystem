import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    models_ready: true,
    health_check: true,
    timestamp: Date.now() / 1000,
  });
}
