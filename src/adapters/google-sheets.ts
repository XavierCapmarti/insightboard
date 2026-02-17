/**
 * Google Sheets Adapter
 * =====================
 * Handles ingestion from Google Sheets
 */

import { BaseAdapter } from './base';
import {
  IngestResult,
  GoogleSheetsConfig,
  DetectedField,
} from '@/types/adapters';
import { DataSourceConfig } from '@/types/core';

// =============================================================================
// TYPES
// =============================================================================

interface SheetsRawData {
  spreadsheetId: string;
  sheetName: string;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  lastModified?: Date;
}

// =============================================================================
// ADAPTER
// =============================================================================

export class GoogleSheetsAdapter extends BaseAdapter<SheetsRawData> {
  readonly type = 'google_sheets';
  readonly name = 'Google Sheets';
  readonly supportedFormats = ['spreadsheet'];

  /**
   * Ingest data from Google Sheets
   * Note: Requires OAuth setup in production
   */
  async ingest(config: DataSourceConfig): Promise<IngestResult<SheetsRawData>> {
    const start = Date.now();
    const warnings: string[] = [];

    try {
      const sheetsConfig = config.settings as unknown as GoogleSheetsConfig;

      if (!sheetsConfig.spreadsheetId) {
        return {
          success: false,
          data: null,
          rowCount: 0,
          error: 'Spreadsheet ID is required',
          warnings: [],
          metadata: {
            source: config.id,
            ingestedAt: new Date(),
            durationMs: Date.now() - start,
          },
        };
      }

      // In production, this would use Google Sheets API
      // For scaffolding, we simulate with placeholder data
      const data = await this.fetchSheetData(sheetsConfig);

      if (data.rows.length === 0) {
        warnings.push('Sheet appears to be empty');
      }

      return {
        success: true,
        data,
        rowCount: data.rowCount,
        warnings,
        metadata: {
          source: config.id,
          ingestedAt: new Date(),
          durationMs: Date.now() - start,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        rowCount: 0,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch Google Sheet',
        warnings,
        metadata: {
          source: config.id,
          ingestedAt: new Date(),
          durationMs: Date.now() - start,
        },
      };
    }
  }

  // =============================================================================
  // PROTECTED METHODS
  // =============================================================================

  protected getRows(rawData: SheetsRawData): Record<string, string>[] {
    return rawData.rows;
  }

  protected getFieldNames(rawData: SheetsRawData): string[] {
    return rawData.headers;
  }

  protected detectFields(rawData: SheetsRawData): DetectedField[] {
    const fields: DetectedField[] = [];

    for (const header of rawData.headers) {
      const values: unknown[] = [];
      let nullable = false;

      for (const row of rawData.rows.slice(0, 100)) {
        const value = row[header];
        if (value === null || value === undefined || value === '') {
          nullable = true;
        } else {
          values.push(value);
        }
      }

      fields.push({
        name: header,
        type: this.inferType(values),
        nullable,
        sampleValues: values.slice(0, 5),
      });
    }

    return fields;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Fetch sheet data using Google Sheets API
   * Supports both OAuth (preferred) and service account (fallback)
   */
  private async fetchSheetData(
    config: GoogleSheetsConfig
  ): Promise<SheetsRawData> {
    if (!config.spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }

    const range = config.range || config.sheetName || 'Sheet1';
    const fullRange = range.includes('!') ? range : `${range}!A:Z`;

    let values: (string | number | boolean)[][] | null = null;

    // Try OAuth first if tokens are provided
    if (config.oauthTokens) {
      try {
        const { sheetsOAuthClient } = await import('@/lib/sheetsOAuth');
        values = await sheetsOAuthClient.readRange(
          config.spreadsheetId,
          fullRange,
          config.oauthTokens
        );
      } catch (error) {
        console.warn('OAuth fetch failed, trying service account:', error);
        // Fall through to service account
      }
    }

    // Fallback to service account if OAuth failed or not provided
    if (!values) {
      const { sheetsClient } = await import('@/lib/sheets');
      values = await sheetsClient.readRange(config.spreadsheetId, fullRange);
    }
    
    if (!values || values.length === 0) {
      return {
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName || 'Sheet1',
        headers: [],
        rows: [],
        rowCount: 0,
      };
    }

    // Convert to our format
    const { sheetsOAuthClient } = await import('@/lib/sheetsOAuth');
    const { headers, rows } = sheetsOAuthClient.convertToCSVFormat(values);
    
    return {
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName || 'Sheet1',
      headers,
      rows,
      rowCount: rows.length,
    };
  }

  /**
   * Validate Google Sheets connection
   */
  async testConnection(config: GoogleSheetsConfig): Promise<boolean> {
    try {
      if (!config.spreadsheetId) {
        return false;
      }

      // Try OAuth first if tokens are provided
      if (config.oauthTokens) {
        try {
          const { sheetsOAuthClient } = await import('@/lib/sheetsOAuth');
          await sheetsOAuthClient.getSheetMetadata(config.spreadsheetId, config.oauthTokens);
          return true;
        } catch {
          return false;
        }
      }

      // Fallback to service account
      const { sheetsClient } = await import('@/lib/sheets');
      await sheetsClient.getSheetMetadata(config.spreadsheetId);
      return true;
    } catch {
      return false;
    }
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createGoogleSheetsAdapter(): GoogleSheetsAdapter {
  return new GoogleSheetsAdapter();
}

