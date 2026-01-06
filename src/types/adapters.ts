/**
 * Data Adapter Interfaces
 * =======================
 * Contracts for ingesting data from various sources
 */

import {
  DataRecord,
  StageEvent,
  Actor,
  DataSourceConfig,
  FieldMapping,
} from './core';

// =============================================================================
// ADAPTER INTERFACE
// =============================================================================

/**
 * Base interface for all data adapters
 */
export interface DataAdapter<TRawData = unknown> {
  /** Unique identifier for this adapter type */
  readonly type: string;

  /** Human-readable name */
  readonly name: string;

  /** Supported file extensions or connection types */
  readonly supportedFormats: string[];

  /**
   * Ingest raw data from the source
   * Returns raw data structure before normalisation
   */
  ingest(config: DataSourceConfig): Promise<IngestResult<TRawData>>;

  /**
   * Normalise raw data into core entities
   * Uses field mappings to transform source fields
   */
  normalise(
    rawData: TRawData,
    mappings: FieldMapping[]
  ): Promise<NormaliseResult>;

  /**
   * Validate data quality and completeness
   * Returns validation errors and warnings
   */
  validate(data: NormaliseResult): Promise<ValidationResult>;

  /**
   * Preview data before full import
   * Returns a sample of normalised records
   */
  preview(
    rawData: TRawData,
    mappings: FieldMapping[],
    limit?: number
  ): Promise<PreviewResult>;

  /**
   * Detect schema from raw data
   * Used for auto-mapping suggestions
   */
  detectSchema(rawData: TRawData): Promise<DetectedSchema>;
}

// =============================================================================
// RESULT TYPES
// =============================================================================

export interface IngestResult<T = unknown> {
  success: boolean;
  data: T | null;
  rowCount: number;
  error?: string;
  warnings: string[];
  metadata: {
    source: string;
    ingestedAt: Date;
    durationMs: number;
  };
}

export interface NormaliseResult {
  records: DataRecord[];
  stageEvents: StageEvent[];
  actors: Actor[];
  unmappedFields: string[];
  transformErrors: TransformError[];
}

export interface TransformError {
  row: number;
  field: string;
  sourceValue: unknown;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    missingRequiredFields: number;
  };
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  field?: string;
  row?: number;
  suggestion?: string;
}

export interface PreviewResult {
  records: DataRecord[];
  sampleSize: number;
  totalEstimated: number;
  fieldStats: FieldStats[];
}

export interface FieldStats {
  field: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'mixed';
  nonNullCount: number;
  uniqueCount: number;
  sampleValues: unknown[];
}

export interface DetectedSchema {
  fields: DetectedField[];
  suggestedMappings: SuggestedMapping[];
  confidence: number; // 0-1
}

export interface DetectedField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object' | 'mixed';
  nullable: boolean;
  sampleValues: unknown[];
}

export interface SuggestedMapping {
  sourceField: string;
  targetField: string;
  confidence: number; // 0-1
  reason: string;
}

// =============================================================================
// ADAPTER REGISTRY
// =============================================================================

export interface AdapterRegistry {
  adapters: Map<string, DataAdapter>;
  register(adapter: DataAdapter): void;
  get(type: string): DataAdapter | undefined;
  list(): DataAdapter[];
}

// =============================================================================
// CONNECTION CONFIG TYPES
// =============================================================================

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName?: string;
  range?: string;
  hasHeaderRow: boolean;
  refreshToken?: string;
}

export interface CSVUploadConfig {
  delimiter: ',' | ';' | '\t' | '|';
  hasHeaderRow: boolean;
  encoding: 'utf-8' | 'latin-1' | 'utf-16';
  dateFormat?: string;
}

export interface GenericCRMConfig {
  apiEndpoint: string;
  apiKey?: string;
  authType: 'api_key' | 'oauth2' | 'basic';
  entityType: string; // e.g., 'deals', 'contacts', 'tickets'
  pageSize?: number;
}

export interface StripeConfig {
  apiKey: string;
  objectTypes: ('charges' | 'subscriptions' | 'customers' | 'invoices')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

