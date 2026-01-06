/**
 * Generic CRM Adapter
 * ===================
 * Handles ingestion from REST API-based CRMs
 */

import { BaseAdapter } from './base';
import {
  IngestResult,
  GenericCRMConfig,
  DetectedField,
} from '@/types/adapters';
import { DataSourceConfig } from '@/types/core';

// =============================================================================
// TYPES
// =============================================================================

interface CRMRawData {
  endpoint: string;
  entityType: string;
  records: Record<string, unknown>[];
  rowCount: number;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
}

// =============================================================================
// ADAPTER
// =============================================================================

export class GenericCRMAdapter extends BaseAdapter<CRMRawData> {
  readonly type = 'generic_crm';
  readonly name = 'Generic CRM API';
  readonly supportedFormats = ['rest_api', 'json'];

  /**
   * Ingest data from a CRM API endpoint
   */
  async ingest(config: DataSourceConfig): Promise<IngestResult<CRMRawData>> {
    const start = Date.now();
    const warnings: string[] = [];

    try {
      const crmConfig = config.settings as GenericCRMConfig;

      if (!crmConfig.apiEndpoint) {
        return {
          success: false,
          data: null,
          rowCount: 0,
          error: 'API endpoint is required',
          warnings: [],
          metadata: {
            source: config.id,
            ingestedAt: new Date(),
            durationMs: Date.now() - start,
          },
        };
      }

      const data = await this.fetchAllPages(crmConfig);

      if (data.records.length === 0) {
        warnings.push('No records returned from API');
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
          error instanceof Error ? error.message : 'Failed to fetch from CRM',
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

  protected getRows(rawData: CRMRawData): Record<string, unknown>[] {
    return rawData.records;
  }

  protected getFieldNames(rawData: CRMRawData): string[] {
    if (rawData.records.length === 0) return [];

    // Get all unique keys from all records
    const allKeys = new Set<string>();
    for (const record of rawData.records.slice(0, 100)) {
      for (const key of Object.keys(record)) {
        allKeys.add(key);
      }
    }

    return Array.from(allKeys);
  }

  protected detectFields(rawData: CRMRawData): DetectedField[] {
    const fieldNames = this.getFieldNames(rawData);
    const fields: DetectedField[] = [];

    for (const fieldName of fieldNames) {
      const values: unknown[] = [];
      let nullable = false;

      for (const record of rawData.records.slice(0, 100)) {
        const value = record[fieldName];
        if (value === null || value === undefined) {
          nullable = true;
        } else {
          values.push(value);
        }
      }

      fields.push({
        name: fieldName,
        type: this.inferCRMFieldType(values),
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
   * Fetch all pages from paginated API
   */
  private async fetchAllPages(config: GenericCRMConfig): Promise<CRMRawData> {
    const allRecords: Record<string, unknown>[] = [];
    let page = 1;
    let hasMore = true;
    const pageSize = config.pageSize || 100;

    while (hasMore) {
      const response = await this.fetchPage(config, page, pageSize);
      allRecords.push(...response.records);

      // Check if there are more pages
      if (response.pagination) {
        hasMore = page < response.pagination.totalPages;
      } else {
        // If no pagination info, assume no more pages if we got less than pageSize
        hasMore = response.records.length === pageSize;
      }

      page++;

      // Safety limit
      if (page > 100) {
        break;
      }
    }

    return {
      endpoint: config.apiEndpoint,
      entityType: config.entityType,
      records: allRecords,
      rowCount: allRecords.length,
    };
  }

  /**
   * Fetch a single page of data
   */
  private async fetchPage(
    config: GenericCRMConfig,
    page: number,
    pageSize: number
  ): Promise<CRMRawData> {
    const url = new URL(config.apiEndpoint);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(pageSize));

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    switch (config.authType) {
      case 'api_key':
        if (config.apiKey) {
          headers['Authorization'] = `Bearer ${config.apiKey}`;
        }
        break;
      case 'basic':
        // Would need username/password in config
        break;
      case 'oauth2':
        // Would need OAuth token in config
        break;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different API response formats
    let records: Record<string, unknown>[];
    let pagination;

    if (Array.isArray(data)) {
      records = data;
    } else if (data.data && Array.isArray(data.data)) {
      records = data.data;
      pagination = data.pagination || data.meta;
    } else if (data.records && Array.isArray(data.records)) {
      records = data.records;
      pagination = data.pagination;
    } else if (data.items && Array.isArray(data.items)) {
      records = data.items;
      pagination = { totalRecords: data.total, totalPages: data.pages };
    } else {
      // Assume single object, wrap in array
      records = [data];
    }

    return {
      endpoint: config.apiEndpoint,
      entityType: config.entityType,
      records,
      rowCount: records.length,
      pagination,
    };
  }

  /**
   * Infer field type from CRM data (handles nested objects)
   */
  private inferCRMFieldType(
    values: unknown[]
  ): 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object' {
    if (values.length === 0) return 'string';

    const types = new Set<string>();

    for (const value of values) {
      if (Array.isArray(value)) {
        types.add('array');
      } else if (typeof value === 'object' && value !== null) {
        types.add('object');
      } else if (typeof value === 'number') {
        types.add('number');
      } else if (typeof value === 'boolean') {
        types.add('boolean');
      } else if (typeof value === 'string') {
        if (this.parseDate(value)) {
          types.add('date');
        } else {
          types.add('string');
        }
      }
    }

    if (types.size === 1) {
      return types.values().next().value as any;
    }

    return 'string'; // Default to string for mixed types
  }

  /**
   * Test API connection
   */
  async testConnection(config: GenericCRMConfig): Promise<boolean> {
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'HEAD',
        headers: config.apiKey
          ? { Authorization: `Bearer ${config.apiKey}` }
          : {},
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createGenericCRMAdapter(): GenericCRMAdapter {
  return new GenericCRMAdapter();
}

