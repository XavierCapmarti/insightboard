/**
 * Google OAuth Authorization Endpoint
 * ===================================
 * Initiates OAuth flow - redirects user to Google
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/googleOAuth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl') || '/onboarding';
    
    // Generate state token to prevent CSRF
    const state = Buffer.from(JSON.stringify({ returnUrl })).toString('base64');
    
    const authUrl = getAuthUrl(state);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    logger.error('OAuth initiation failed', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate OAuth flow',
        message: 'Unable to start Google authentication. Please try again or contact support if the problem persists.',
      },
      { status: 500 }
    );
  }
}
