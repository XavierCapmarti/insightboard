/**
 * Google OAuth Callback Endpoint
 * ===============================
 * Handles OAuth callback and stores tokens securely in encrypted cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/googleOAuth';
import { setSessionTokens } from '@/lib/session';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `/onboarding?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        '/onboarding?error=missing_authorization_code'
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    // Parse state to get return URL
    let returnUrl = '/onboarding';
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        returnUrl = stateData.returnUrl || '/onboarding';
      } catch {
        // Invalid state, use default
      }
    }

    // Store tokens securely in encrypted httpOnly cookie
    await setSessionTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });
    
    // Redirect without tokens in URL (secure!)
    return NextResponse.redirect(
      `${returnUrl}?googleAuth=success`
    );
  } catch (error) {
    logger.error('OAuth callback failed', error);
    return NextResponse.redirect(
      `/onboarding?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'oauth_failed'
      )}`
    );
  }
}
