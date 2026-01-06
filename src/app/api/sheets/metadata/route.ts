/**
 * Google Sheets Metadata API
 * ===========================
 * Gets sheet metadata (title, tabs, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sheetsClient } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const spreadsheetId = searchParams.get('spreadsheetId');

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'spreadsheetId is required' },
        { status: 400 }
      );
    }

    // TODO: Check subscription status
    // const subscriptionStatus = await checkSubscription(request);
    // if (!subscriptionStatus.isSubscribed) {
    //   return NextResponse.json(
    //     { error: 'Google Sheets integration requires a subscription' },
    //     { status: 403 }
    //   );
    // }

    const metadata = await sheetsClient.getSheetMetadata(spreadsheetId);

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    console.error('Sheets metadata error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to get sheet metadata',
      },
      { status: 500 }
    );
  }
}

