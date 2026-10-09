import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const started = Date.now();
  let dbStatus = 'unknown';

  try {
    // Bounded DB check with 3s timeout
    const dbPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB health query timeout')), 3000)
    );

    await Promise.race([dbPromise, timeoutPromise]);
    dbStatus = 'ok';
  } catch {
    dbStatus = 'unavailable';
  }

  const durationMs = Date.now() - started;
  const isHealthy = dbStatus === 'ok';

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'FixMyCity',
      timestamp: new Date().toISOString(),
      latencyMs: durationMs,
      checks: {
        database: dbStatus,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
