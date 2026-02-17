/**
 * File Validation Utilities
 * ==========================
 * Validates file uploads (size, type, content)
 */

import { NextResponse } from 'next/server';

// File size limits
export const FILE_SIZE_LIMITS = {
  CSV: 50 * 1024 * 1024, // 50 MB for CSV files
  JSON: 10 * 1024 * 1024, // 10 MB for JSON files
  DEFAULT: 25 * 1024 * 1024, // 25 MB default
};

// Maximum number of rows for CSV files
export const MAX_CSV_ROWS = 100000; // 100k rows

/**
 * Validate file size
 * Returns error response if file is too large, null if valid
 */
export function validateFileSize(
  content: string,
  maxSizeBytes: number = FILE_SIZE_LIMITS.CSV
): NextResponse | null {
  // Calculate size in bytes (UTF-8 encoding)
  const sizeBytes = new Blob([content]).size;

  if (sizeBytes > maxSizeBytes) {
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);

    return NextResponse.json(
      {
        error: 'File too large',
        message: `File size (${sizeMB} MB) exceeds maximum allowed size of ${maxSizeMB} MB.`,
        details: {
          fileSizeBytes: sizeBytes,
          maxSizeBytes,
          fileSizeMB: sizeMB,
          maxSizeMB,
        },
      },
      { status: 413 } // 413 Payload Too Large
    );
  }

  return null; // Valid
}

/**
 * Validate CSV row count
 * Returns error response if too many rows, null if valid
 */
export function validateCsvRowCount(csvContent: string): NextResponse | null {
  const lines = csvContent.trim().split('\n');
  const rowCount = lines.length - 1; // Subtract header row

  if (rowCount > MAX_CSV_ROWS) {
    return NextResponse.json(
      {
        error: 'Too many rows',
        message: `CSV contains ${rowCount.toLocaleString()} rows, but maximum allowed is ${MAX_CSV_ROWS.toLocaleString()} rows.`,
        details: {
          rowCount,
          maxRows: MAX_CSV_ROWS,
        },
      },
      { status: 413 }
    );
  }

  return null; // Valid
}

/**
 * Validate file content is not empty
 */
export function validateNotEmpty(content: string): NextResponse | null {
  if (!content || content.trim().length === 0) {
    return NextResponse.json(
      {
        error: 'Empty file',
        message: 'The uploaded file is empty. Please provide a file with data.',
      },
      { status: 400 }
    );
  }

  return null; // Valid
}

/**
 * Combined file validation for CSV uploads
 * Runs all validations and returns first error found
 */
export function validateCsvFile(csvContent: string): NextResponse | null {
  // Check if empty
  const emptyError = validateNotEmpty(csvContent);
  if (emptyError) return emptyError;

  // Check file size
  const sizeError = validateFileSize(csvContent, FILE_SIZE_LIMITS.CSV);
  if (sizeError) return sizeError;

  // Check row count
  const rowCountError = validateCsvRowCount(csvContent);
  if (rowCountError) return rowCountError;

  return null; // All validations passed
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
