/**
 * Google Sheets Metadata API
 * ===========================
 * Gets sheet metadata (title, tabs, etc.)
 * Uses OAuth tokens from session if available, falls back to service account
 */

import { NextRequest, NextResponse } from 'next/server';
import { sheetsClient } from '@/lib/sheets';
import { getSessionTokens } from '@/lib/session';
import { refreshAccessToken } from '@/lib/googleOAuth';
import { setSessionTokens } from '@/lib/session';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let spreadsheetId: string | null = null;
  try {
    const searchParams = request.nextUrl.searchParams;
    spreadsheetId = searchParams.get('spreadsheetId');

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'spreadsheetId is required' },
        { status: 400 }
      );
    }

    // NOTE: Subscription check will be implemented when billing is added
    // For MVP, Google Sheets integration is available to all users
    // Future: const subscriptionStatus = await checkSubscription(request);
    // Future: if (!subscriptionStatus.isSubscribed) return 403;

    // Try to get OAuth tokens from session
    let metadata: any = null;
    const sessionTokens = await getSessionTokens();
    
    if (sessionTokens) {
      try {
        // Check if token needs refresh
        const now = Date.now();
        const bufferTime = 5 * 60 * 1000; // 5 minutes
        let accessToken = sessionTokens.access_token;
        let expiryDate = sessionTokens.expiry_date;
        
        if (sessionTokens.expiry_date && sessionTokens.expiry_date <= (now + bufferTime) && sessionTokens.refresh_token) {
          // Refresh token
          const refreshed = await refreshAccessToken(sessionTokens.refresh_token);
          accessToken = refreshed.access_token;
          expiryDate = refreshed.expiry_date || sessionTokens.expiry_date;
          
          // Update session
          await setSessionTokens({
            access_token: accessToken,
            refresh_token: sessionTokens.refresh_token,
            expiry_date: expiryDate,
          });
        }
        
        // Use OAuth client
        const { sheetsOAuthClient } = await import('@/lib/sheetsOAuth');
        metadata = await sheetsOAuthClient.getSheetMetadata(
          spreadsheetId,
          {
            access_token: accessToken,
            refresh_token: sessionTokens.refresh_token,
            expiry_date: expiryDate,
          }
        );
      } catch (error) {
        logger.warn('OAuth metadata fetch failed, falling back to service account', { error, spreadsheetId });
        // Fall through to service account
      }
    }

    // Fallback to service account if OAuth failed or not available
    if (!metadata) {
      metadata = await sheetsClient.getSheetMetadata(spreadsheetId);
    }

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    logger.error('Sheets metadata fetch failed', error, { spreadsheetId: spreadsheetId || 'unknown' });
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get sheet metadata',
        message: error.message || 'Unable to retrieve metadata from Google Sheets. Please check the spreadsheet ID and try again.',
      },
      { status: 500 }
    );
  }
}

