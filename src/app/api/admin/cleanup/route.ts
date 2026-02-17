/**
 * Dataset Cleanup Admin API
 * ==========================
 * Manually trigger cleanup and view cleanup statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredDatasets, getCleanupStats } from '@/lib/datasetStore';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cleanup
 * Get cleanup statistics
 */
export async function GET() {
  try {
    const stats = getCleanupStats();

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        lastCleanupTime: stats.lastCleanupTime.toISOString(),
        timeSinceLastCleanupMinutes: Math.round(stats.timeSinceLastCleanup / 60000),
        nextCleanupInMinutes: Math.round(stats.nextCleanupIn / 60000),
      },
    });
  } catch (error) {
    logger.error('Failed to get cleanup stats', error);

    return NextResponse.json(
      {
        error: 'Failed to get cleanup statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cleanup
 * Manually trigger dataset cleanup
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('Manual cleanup triggered', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    const result = await cleanupExpiredDatasets();

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${result.deletedCount} dataset(s).`,
      result: {
        deletedDatasets: result.deletedCount,
        freedMemoryBytes: result.freedMemory,
        remainingDatasets: result.remainingCount,
      },
    });
  } catch (error) {
    logger.error('Manual cleanup failed', error);

    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
