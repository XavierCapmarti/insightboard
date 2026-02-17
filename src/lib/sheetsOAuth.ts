/**
 * Google Sheets Client with OAuth
 * ================================
 * Reads from Google Sheets using OAuth 2.0 tokens
 */

import { getAuthenticatedSheetsClient, refreshAccessToken } from './googleOAuth';
import { sheets_v4 } from 'googleapis';

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export const sheetsOAuthClient = {
  /**
   * Read data from a range using OAuth tokens
   */
  async readRange(
    spreadsheetId: string,
    range: string,
    tokens: OAuthTokens
  ): Promise<(string | number | boolean)[][] | null> {
    try {
      // Check if token needs refresh
      let accessToken = tokens.access_token;
      if (tokens.expiry_date && tokens.expiry_date < Date.now() && tokens.refresh_token) {
        const refreshed = await refreshAccessToken(tokens.refresh_token);
        accessToken = refreshed.access_token;
      }

      const sheets = getAuthenticatedSheetsClient({
        access_token: accessToken,
        refresh_token: tokens.refresh_token,
      });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      
      return response.data.values || null;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error('Spreadsheet not found. Check the spreadsheet ID.');
      }
      if (error.code === 403) {
        throw new Error('Permission denied. Please grant access to Google Sheets.');
      }
      throw new Error(`Failed to read sheet: ${error.message}`);
    }
  },

  /**
   * Get sheet metadata using OAuth tokens
   */
  async getSheetMetadata(
    spreadsheetId: string,
    tokens: OAuthTokens
  ): Promise<{
    title: string;
    sheets: Array<{ title: string; sheetId: number }>;
  }> {
    try {
      // Check if token needs refresh
      let accessToken = tokens.access_token;
      if (tokens.expiry_date && tokens.expiry_date < Date.now() && tokens.refresh_token) {
        const refreshed = await refreshAccessToken(tokens.refresh_token);
        accessToken = refreshed.access_token;
      }

      const sheets = getAuthenticatedSheetsClient({
        access_token: accessToken,
        refresh_token: tokens.refresh_token,
      });

      const response = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      
      return {
        title: response.data.properties?.title || 'Untitled',
        sheets: (response.data.sheets || []).map(sheet => ({
          title: sheet.properties?.title || 'Sheet1',
          sheetId: sheet.properties?.sheetId || 0,
        })),
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error('Spreadsheet not found. Check the spreadsheet ID.');
      }
      if (error.code === 403) {
        throw new Error('Permission denied. Please grant access to Google Sheets.');
      }
      throw new Error(`Failed to get sheet metadata: ${error.message}`);
    }
  },

  /**
   * Parse spreadsheet URL to get ID
   */
  parseSpreadsheetUrl(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  },

  /**
   * Convert sheet data to CSV-like format
   */
  convertToCSVFormat(values: (string | number | boolean)[][]): {
    headers: string[];
    rows: Record<string, string>[];
  } {
    if (!values || values.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = values[0].map(String);
    const rows = values.slice(1).map(row => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = row[index] !== undefined ? String(row[index]) : '';
      });
      return record;
    });

    return { headers, rows };
  },
};
