/**
 * Base Adapter Implementation
 * ===========================
 * Common utilities and base class for data adapters
 */

import { v4 as uuid } from 'uuid';
import {
  DataAdapter,
  IngestResult,
  NormaliseResult,
  ValidationResult,
  PreviewResult,
  DetectedSchema,
  DetectedField,
  SuggestedMapping,
  ValidationIssue,
  TransformError,
} from '@/types/adapters';
import {
  Record,
  StageEvent,
  Actor,
  DataSourceConfig,
  FieldMapping,
  FieldTransform,
} from '@/types/core';

// =============================================================================
// BASE ADAPTER
// =============================================================================

export abstract class BaseAdapter<TRawData = unknown>
  implements DataAdapter<TRawData>
{
  abstract readonly type: string;
  abstract readonly name: string;
  abstract readonly supportedFormats: string[];

  abstract ingest(config: DataSourceConfig): Promise<IngestResult<TRawData>>;

  /**
   * Default normalisation implementation
   * Override in subclasses for source-specific logic
   */
  async normalise(
    rawData: TRawData,
    mappings: FieldMapping[]
  ): Promise<NormaliseResult> {
    const records: Record[] = [];
    const stageEvents: StageEvent[] = [];
    const actors: Actor[] = [];
    const unmappedFields: string[] = [];
    const transformErrors: TransformError[] = [];

    // Get rows from raw data (subclasses should implement getRows)
    const rows = this.getRows(rawData);

    // Track unique actors
    const actorMap = new Map<string, Actor>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const record = this.rowToRecord(row, mappings, i, transformErrors);
        if (record) {
          records.push(record);

          // Extract actor if owner is mapped
          if (record.ownerId && !actorMap.has(record.ownerId)) {
            actorMap.set(record.ownerId, {
              id: record.ownerId,
              name: record.ownerId, // Will be enriched later
              metadata: {},
              createdAt: new Date(),
            });
          }
        }
      } catch (error) {
        transformErrors.push({
          row: i,
          field: 'unknown',
          sourceValue: row,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    actors.push(...actorMap.values());

    // Find unmapped source fields
    const mappedSourceFields = new Set(mappings.map((m) => m.sourceField));
    const allSourceFields = this.getFieldNames(rawData);
    for (const field of allSourceFields) {
      if (!mappedSourceFields.has(field)) {
        unmappedFields.push(field);
      }
    }

    return {
      records,
      stageEvents,
      actors,
      unmappedFields,
      transformErrors,
    };
  }

  /**
   * Default validation implementation
   */
  async validate(data: NormaliseResult): Promise<ValidationResult> {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    let validRecords = 0;
    let invalidRecords = 0;
    let missingRequiredFields = 0;

    for (const record of data.records) {
      const recordErrors: ValidationIssue[] = [];

      // Required fields
      if (!record.id) {
        recordErrors.push({
          type: 'error',
          code: 'MISSING_ID',
          message: 'Record is missing an ID',
        });
        missingRequiredFields++;
      }

      if (!record.ownerId) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_OWNER',
          message: `Record ${record.id} has no owner assigned`,
        });
      }

      if (!record.status) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_STATUS',
          message: `Record ${record.id} has no status`,
        });
      }

      if (recordErrors.length > 0) {
        errors.push(...recordErrors);
        invalidRecords++;
      } else {
        validRecords++;
      }
    }

    // Check transform errors
    for (const error of data.transformErrors) {
      errors.push({
        type: 'error',
        code: 'TRANSFORM_ERROR',
        message: error.error,
        field: error.field,
        row: error.row,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalRecords: data.records.length,
        validRecords,
        invalidRecords,
        missingRequiredFields,
      },
    };
  }

  /**
   * Preview a sample of normalised data
   */
  async preview(
    rawData: TRawData,
    mappings: FieldMapping[],
    limit = 10
  ): Promise<PreviewResult> {
    const rows = this.getRows(rawData);
    const sampleRows = rows.slice(0, limit);
    const transformErrors: TransformError[] = [];

    const records: Record[] = [];
    for (let i = 0; i < sampleRows.length; i++) {
      const record = this.rowToRecord(
        sampleRows[i],
        mappings,
        i,
        transformErrors
      );
      if (record) {
        records.push(record);
      }
    }

    // Calculate field stats
    const fieldStats = this.calculateFieldStats(rawData);

    return {
      records,
      sampleSize: sampleRows.length,
      totalEstimated: rows.length,
      fieldStats,
    };
  }

  /**
   * Detect schema from raw data
   */
  async detectSchema(rawData: TRawData): Promise<DetectedSchema> {
    const fields = this.detectFields(rawData);
    const suggestedMappings = this.suggestMappings(fields);

    return {
      fields,
      suggestedMappings,
      confidence: this.calculateConfidence(suggestedMappings),
    };
  }

  // =============================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // =============================================================================

  /**
   * Extract rows from raw data structure
   */
  protected abstract getRows(rawData: TRawData): unknown[];

  /**
   * Get all field names from raw data
   */
  protected abstract getFieldNames(rawData: TRawData): string[];

  /**
   * Detect field types from raw data
   */
  protected abstract detectFields(rawData: TRawData): DetectedField[];

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Convert a raw row to a Record using field mappings
   */
  protected rowToRecord(
    row: unknown,
    mappings: FieldMapping[],
    rowIndex: number,
    errors: TransformError[]
  ): Record | null {
    const record: Partial<Record> = {
      id: uuid(),
      metadata: {
        source: this.type,
        sourceType: this.type as any,
        customFields: {},
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    for (const mapping of mappings) {
      try {
        const sourceValue = this.getFieldValue(row, mapping.sourceField);
        const transformedValue = this.transformValue(
          sourceValue,
          mapping.transform
        );

        // Map to core fields or custom fields
        switch (mapping.targetField) {
          case 'id':
            record.id = String(transformedValue);
            record.externalId = String(transformedValue);
            break;
          case 'ownerId':
            record.ownerId = String(transformedValue);
            break;
          case 'value':
            record.value = Number(transformedValue) || 0;
            break;
          case 'status':
            record.status = String(transformedValue);
            break;
          case 'createdAt':
            record.createdAt =
              transformedValue instanceof Date
                ? transformedValue
                : new Date(String(transformedValue));
            break;
          case 'updatedAt':
            record.updatedAt =
              transformedValue instanceof Date
                ? transformedValue
                : new Date(String(transformedValue));
            break;
          case 'closedAt':
            if (transformedValue) {
              record.closedAt =
                transformedValue instanceof Date
                  ? transformedValue
                  : new Date(String(transformedValue));
            }
            break;
          default:
            // Custom field
            if (record.metadata) {
              record.metadata.customFields[mapping.targetField] =
                transformedValue;
            }
        }
      } catch (error) {
        errors.push({
          row: rowIndex,
          field: mapping.sourceField,
          sourceValue: this.getFieldValue(row, mapping.sourceField),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Ensure required fields have defaults
    if (!record.ownerId) record.ownerId = 'unassigned';
    if (!record.status) record.status = 'unknown';

    return record as Record;
  }

  /**
   * Get a field value from a row (handles nested paths)
   */
  protected getFieldValue(row: unknown, fieldPath: string): unknown {
    if (row === null || row === undefined) return undefined;

    const parts = fieldPath.split('.');
    let value: unknown = row;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      if (typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Apply a transform to a value
   */
  protected transformValue(
    value: unknown,
    transform?: FieldTransform
  ): unknown {
    if (!transform || transform.type === 'direct') {
      return value;
    }

    switch (transform.type) {
      case 'date':
        return this.parseDate(value, transform.format);
      case 'number':
        return this.parseNumber(value, transform.decimals);
      case 'lookup':
        return transform.mapping[String(value)] ?? value;
      case 'formula':
        // Formula evaluation would go here
        return value;
      default:
        return value;
    }
  }

  /**
   * Parse a date value
   */
  protected parseDate(value: unknown, format?: string): Date | null {
    if (value instanceof Date) return value;
    if (!value) return null;

    const str = String(value).trim();
    if (!str) return null;

    // Try ISO format first
    const isoDate = new Date(str);
    if (!isNaN(isoDate.getTime())) return isoDate;

    // Try timestamp
    const timestamp = Number(str);
    if (!isNaN(timestamp)) {
      // Assume milliseconds if > 1e12, otherwise seconds
      return new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
    }

    return null;
  }

  /**
   * Parse a number value
   */
  protected parseNumber(value: unknown, decimals?: number): number {
    if (typeof value === 'number') {
      return decimals !== undefined
        ? Number(value.toFixed(decimals))
        : value;
    }

    const str = String(value).replace(/[^0-9.-]/g, '');
    const num = parseFloat(str);
    if (isNaN(num)) return 0;

    return decimals !== undefined ? Number(num.toFixed(decimals)) : num;
  }

  /**
   * Calculate field statistics
   */
  protected calculateFieldStats(rawData: TRawData): PreviewResult['fieldStats'] {
    const rows = this.getRows(rawData);
    const fieldNames = this.getFieldNames(rawData);
    const stats: PreviewResult['fieldStats'] = [];

    for (const field of fieldNames) {
      const values: unknown[] = [];
      const uniqueValues = new Set<string>();
      let nonNullCount = 0;

      for (const row of rows.slice(0, 100)) {
        // Sample first 100
        const value = this.getFieldValue(row, field);
        if (value !== null && value !== undefined && value !== '') {
          nonNullCount++;
          uniqueValues.add(String(value));
          if (values.length < 5) {
            values.push(value);
          }
        }
      }

      stats.push({
        field,
        type: this.inferType(values),
        nonNullCount,
        uniqueCount: uniqueValues.size,
        sampleValues: values,
      });
    }

    return stats;
  }

  /**
   * Infer the type of a field from sample values
   */
  protected inferType(
    values: unknown[]
  ): 'string' | 'number' | 'date' | 'boolean' | 'mixed' {
    if (values.length === 0) return 'string';

    const types = new Set<string>();

    for (const value of values) {
      if (typeof value === 'number') {
        types.add('number');
      } else if (typeof value === 'boolean') {
        types.add('boolean');
      } else if (value instanceof Date) {
        types.add('date');
      } else if (typeof value === 'string') {
        // Check if it looks like a date
        if (this.parseDate(value)) {
          types.add('date');
        }
        // Check if it looks like a number
        else if (!isNaN(Number(value)) && value.trim() !== '') {
          types.add('number');
        } else {
          types.add('string');
        }
      }
    }

    if (types.size === 1) {
      return types.values().next().value as any;
    }

    return 'mixed';
  }

  /**
   * Suggest field mappings based on detected fields
   */
  protected suggestMappings(fields: DetectedField[]): SuggestedMapping[] {
    const suggestions: SuggestedMapping[] = [];

    // Common field name patterns
    const patterns: { regex: RegExp; target: string; reason: string }[] = [
      { regex: /^(id|_id|key|uuid)$/i, target: 'id', reason: 'Looks like an identifier' },
      { regex: /(owner|assigned|rep|user|employee)/i, target: 'ownerId', reason: 'Looks like an owner field' },
      { regex: /(amount|value|price|revenue|total)/i, target: 'value', reason: 'Looks like a value field' },
      { regex: /(status|stage|state|phase)/i, target: 'status', reason: 'Looks like a status field' },
      { regex: /(created|date_added|opened)/i, target: 'createdAt', reason: 'Looks like a creation date' },
      { regex: /(updated|modified|changed)/i, target: 'updatedAt', reason: 'Looks like an update date' },
      { regex: /(closed|completed|finished|ended)/i, target: 'closedAt', reason: 'Looks like a close date' },
    ];

    for (const field of fields) {
      for (const pattern of patterns) {
        if (pattern.regex.test(field.name)) {
          suggestions.push({
            sourceField: field.name,
            targetField: pattern.target,
            confidence: 0.8,
            reason: pattern.reason,
          });
          break;
        }
      }
    }

    return suggestions;
  }

  /**
   * Calculate overall confidence score
   */
  protected calculateConfidence(mappings: SuggestedMapping[]): number {
    if (mappings.length === 0) return 0;
    const requiredFields = ['id', 'status'];
    const mappedRequired = requiredFields.filter((f) =>
      mappings.some((m) => m.targetField === f)
    );
    return mappedRequired.length / requiredFields.length;
  }
}

