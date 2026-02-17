/**
 * Session Management API
 * ======================
 * Provides secure access to OAuth tokens stored in session
 * 
 * Endpoints:
 * - GET: Retrieve current session tokens
 * - DELETE: Clear session (logout)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionTokens, clearSession } from '@/lib/session';
import { refreshAccessToken } from '@/lib/googleOAuth';
import { setSessionTokens } from '@/lib/session';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/session
 * Retrieve current session tokens
 * Automatically refreshes access token if expired
 */
export async function GET(request: NextRequest) {
  try {
    const tokens = await getSessionTokens();
    
    if (!tokens) {
      return NextResponse.json(
        { authenticated: false, error: 'No active session' },
        { status: 401 }
      );
    }
    
    // Check if access token needs refresh
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    const needsRefresh = tokens.expiry_date && 
                        tokens.expiry_date <= (now + bufferTime) &&
                        tokens.refresh_token;
    
    if (needsRefresh) {
      try {
        // Refresh the access token
        const refreshed = await refreshAccessToken(tokens.refresh_token!);
        
        // Update session with new access token
        await setSessionTokens({
          access_token: refreshed.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: refreshed.expiry_date || tokens.expiry_date,
        });
        
        return NextResponse.json({
          authenticated: true,
          tokens: {
            access_token: refreshed.access_token,
            expiry_date: refreshed.expiry_date || tokens.expiry_date,
            // Don't return refresh_token to client for security
          },
        });
      } catch (refreshError) {
        // Refresh failed, clear session
        await clearSession();
        return NextResponse.json(
          { authenticated: false, error: 'Token refresh failed' },
          { status: 401 }
        );
      }
    }
    
    // Return tokens (without refresh_token for security)
    return NextResponse.json({
      authenticated: true,
      tokens: {
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date,
      },
    });
  } catch (error) {
    logger.error('Session retrieval failed', error);
    return NextResponse.json(
      { 
        authenticated: false, 
        error: 'Failed to retrieve session',
        message: 'Unable to retrieve your session. Please try logging in again.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clear session (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    await clearSession();
    return NextResponse.json({ success: true, message: 'Session cleared' });
  } catch (error) {
    logger.error('Session clear failed', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear session',
        message: 'Unable to log out. Please try again.',
      },
      { status: 500 }
    );
  }
}
