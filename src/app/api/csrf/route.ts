/**
 * CSRF Token API
 * ===============
 * Provides CSRF tokens for client-side state-changing requests
 */

import { NextResponse } from 'next/server';
import { getCsrfTokenForClient } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf
 * Returns a CSRF token for the client to use in subsequent requests
 */
export async function GET() {
  try {
    const token = await getCsrfTokenForClient();

    return NextResponse.json({
      token,
      header: 'x-csrf-token',
      message: 'Include this token in the X-CSRF-Token header for POST/PUT/DELETE/PATCH requests',
    });
  } catch (error) {
    logger.error('Failed to generate CSRF token', error);

    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
        message: 'An error occurred while generating the CSRF token. Please try again.',
      },
      { status: 500 }
    );
  }
}
