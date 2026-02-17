/**
 * Google Sheets Client
 * ===================
 * Handles reading from Google Sheets using Service Account
 */

import { google, sheets_v4 } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || 
  path.join(process.cwd(), 'sheets-credentials.json');
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || 
  'sheets-bot@sheets-demo-1764926588.iam.gserviceaccount.com';

// Initialize the Sheets API client
function getClient(): sheets_v4.Sheets | null {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error);
    return null;
  }
}

export const sheetsClient = {
  /**
   * Service account email - share your sheet with this email to grant access
   */
  serviceAccountEmail: SERVICE_ACCOUNT_EMAIL,

  /**
   * Read data from a range
   */
  async readRange(
    spreadsheetId: string,
    range: string
  ): Promise<(string | number | boolean)[][] | null> {
    const sheets = getClient();
    if (!sheets) {
      throw new Error('Google Sheets client not initialized. Check credentials.');
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return response.data.values || null;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`Spreadsheet not found. Make sure the sheet is shared with ${SERVICE_ACCOUNT_EMAIL}`);
      }
      if (error.code === 403) {
        throw new Error(`Permission denied. Please share the sheet with ${SERVICE_ACCOUNT_EMAIL} with Viewer access.`);
      }
      throw new Error(`Failed to read sheet: ${error.message}`);
    }
  },

  /**
   * Get sheet metadata (tabs, etc.)
   */
  async getSheetMetadata(spreadsheetId: string): Promise<{
    title: string;
    sheets: Array<{ title: string; sheetId: number }>;
  }> {
    const sheets = getClient();
    if (!sheets) {
      throw new Error('Google Sheets client not initialized. Check credentials.');
    }

    try {
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
        throw new Error(`Spreadsheet not found. Make sure the sheet is shared with ${SERVICE_ACCOUNT_EMAIL}`);
      }
      if (error.code === 403) {
        throw new Error(`Permission denied. Please share the sheet with ${SERVICE_ACCOUNT_EMAIL} with Viewer access.`);
      }
      throw new Error(`Failed to get sheet metadata: ${error.message}`);
    }
  },

  /**
   * Parse spreadsheet URL to get ID
   */
  parseSpreadsheetUrl(url: string): string | null {
    // Handle various URL formats:
    // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
    // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
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


