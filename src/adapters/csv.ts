/**
 * CSV Upload Adapter
 * ==================
 * Handles CSV file ingestion and parsing
 */

import { BaseAdapter } from './base';
import {
  IngestResult,
  CSVUploadConfig,
  DetectedField,
} from '@/types/adapters';
import { DataSourceConfig } from '@/types/core';

// =============================================================================
// TYPES
// =============================================================================

interface CSVRawData {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

// =============================================================================
// ADAPTER
// =============================================================================

export class CSVUploadAdapter extends BaseAdapter<CSVRawData> {
  readonly type = 'csv_upload';
  readonly name = 'CSV Upload';
  readonly supportedFormats = ['.csv', '.tsv', '.txt'];

  /**
   * Ingest CSV data from uploaded file content
   */
  async ingest(config: DataSourceConfig): Promise<IngestResult<CSVRawData>> {
    const start = Date.now();
    const warnings: string[] = [];

    try {
      // In a real implementation, this would read from uploaded file
      // For now, we expect the CSV content in config.settings.content
      const csvConfig = config.settings as CSVUploadConfig & {
        content?: string;
      };
      const content = csvConfig.content || '';

      if (!content) {
        return {
          success: false,
          data: null,
          rowCount: 0,
          error: 'No CSV content provided',
          warnings: [],
          metadata: {
            source: config.id,
            ingestedAt: new Date(),
            durationMs: Date.now() - start,
          },
        };
      }

      const parsed = this.parseCSV(
        content,
        csvConfig.delimiter || ',',
        csvConfig.hasHeaderRow ?? true
      );

      if (parsed.rows.length === 0) {
        warnings.push('CSV appears to be empty or has only headers');
      }

      return {
        success: true,
        data: parsed,
        rowCount: parsed.rowCount,
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
        error: error instanceof Error ? error.message : 'Failed to parse CSV',
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

  protected getRows(rawData: CSVRawData): Record<string, string>[] {
    return rawData.rows;
  }

  protected getFieldNames(rawData: CSVRawData): string[] {
    return rawData.headers;
  }

  protected detectFields(rawData: CSVRawData): DetectedField[] {
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
   * Parse CSV content into structured data
   */
  private parseCSV(
    content: string,
    delimiter: string,
    hasHeaderRow: boolean
  ): CSVRawData {
    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      return { headers: [], rows: [], rowCount: 0 };
    }

    // Parse headers
    const headerLine = hasHeaderRow ? lines[0] : null;
    const dataLines = hasHeaderRow ? lines.slice(1) : lines;

    const headers = headerLine
      ? this.parseLine(headerLine, delimiter).map((h, i) =>
          h.trim() || `column_${i}`
        )
      : dataLines[0]
        ? this.parseLine(dataLines[0], delimiter).map((_, i) => `column_${i}`)
        : [];

    // Parse rows
    const rows: Record<string, string>[] = [];
    for (const line of dataLines) {
      const values = this.parseLine(line, delimiter);
      const row: Record<string, string> = {};

      for (let i = 0; i < headers.length; i++) {
        row[headers[i]] = values[i]?.trim() ?? '';
      }

      rows.push(row);
    }

    return { headers, rows, rowCount: rows.length };
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private parseLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else if (char === '"') {
          // End of quoted section
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          // Start of quoted section
          inQuotes = true;
        } else if (char === delimiter) {
          // Field separator
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }

    // Add final value
    values.push(current);

    return values;
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createCSVAdapter(): CSVUploadAdapter {
  return new CSVUploadAdapter();
}

