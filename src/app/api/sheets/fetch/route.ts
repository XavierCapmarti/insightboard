/**
 * Google Sheets Fetch API
 * =======================
 * Fetches data from a Google Sheet
 * Requires subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { sheetsClient } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const spreadsheetId = searchParams.get('spreadsheetId');
    const range = searchParams.get('range') || 'Sheet1!A:Z';
    const sheetName = searchParams.get('sheetName');

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'spreadsheetId is required' },
        { status: 400 }
      );
    }

    // TODO: Check subscription status
    // For now, allow all requests (will add subscription check later)
    // const subscriptionStatus = await checkSubscription(request);
    // if (!subscriptionStatus.isSubscribed) {
    //   return NextResponse.json(
    //     { error: 'Google Sheets integration requires a subscription' },
    //     { status: 403 }
    //   );
    // }

    // Parse range if sheetName is provided
    const fullRange = sheetName ? `${sheetName}!${range.replace(/^.*!/, '')}` : range;

    // Fetch data from sheet
    const values = await sheetsClient.readRange(spreadsheetId, fullRange);
    
    if (!values || values.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          headers: [],
          rows: [],
          rowCount: 0,
        },
      });
    }

    // Convert to CSV-like format
    const { headers, rows } = sheetsClient.convertToCSVFormat(values);

    return NextResponse.json({
      success: true,
      data: {
        headers,
        rows,
        rowCount: rows.length,
        spreadsheetId,
        range: fullRange,
      },
    });
  } catch (error: any) {
    console.error('Sheets fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch sheet data',
      },
      { status: 500 }
    );
  }
}

