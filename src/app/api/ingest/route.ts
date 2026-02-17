/**
 * Data Ingestion API
 * ==================
 * Handles data uploads and source connections
 * Returns datasetId for subsequent metric queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/adapters';
import { DataSourceConfig } from '@/types/core';
import { storeDataset } from '@/lib/datasetStore';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Request validation schema
const ingestRequestSchema = z.object({
  sourceType: z.string().min(1, 'Source type is required'),
  config: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    settings: z.record(z.unknown()).optional(),
    fieldMappings: z.array(z.any()).optional(),
  }).optional(),
  content: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let body: unknown = null;
  
  // Rate limiting
  const rateLimitResponse = rateLimiters.ingest(request);
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for ingest API', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return rateLimitResponse;
  }

  try {
    body = await request.json();
    
    // Validate request body
    const validationResult = ingestRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      logger.warn('Invalid ingest request', { errors: validationResult.error.errors });
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: errors,
        },
        { status: 400 }
      );
    }
    
    const { sourceType, config = {}, content } = validationResult.data;

    // Get the appropriate adapter
    const adapter = getAdapter(sourceType);
    if (!adapter) {
      logger.warn('Unknown source type requested', { sourceType });
      return NextResponse.json(
        { 
          error: 'Unsupported data source',
          message: `The source type "${sourceType}" is not supported. Please use one of: csv, google-sheets, generic-crm`,
          supportedTypes: ['csv', 'google-sheets', 'generic-crm'],
        },
        { status: 400 }
      );
    }

    // Build full config
    const fullConfig: DataSourceConfig = {
      id: config.id || `source-${Date.now()}`,
      name: config.name || 'Unnamed Source',
      type: sourceType as DataSourceConfig['type'],
      settings: { ...config.settings, content },
      fieldMappings: config.fieldMappings || [],
      syncStatus: 'syncing',
      createdAt: new Date(),
    };

    // Ingest data
    const ingestResult = await adapter.ingest(fullConfig);

    if (!ingestResult.success) {
      return NextResponse.json(
        { error: ingestResult.error, warnings: ingestResult.warnings },
        { status: 400 }
      );
    }

    // Normalize data using adapter
    const normalizeResult = await adapter.normalise(
      ingestResult.data,
      fullConfig.fieldMappings
    );

    // Log normalization results for debugging
    logger.debug('Normalization result', {
      recordsCount: normalizeResult.records.length,
      stageEventsCount: normalizeResult.stageEvents.length,
      actorsCount: normalizeResult.actors.length,
      transformErrors: normalizeResult.transformErrors.length,
      unmappedFields: normalizeResult.unmappedFields.length,
    });

    if (normalizeResult.transformErrors.length > 0) {
      logger.warn('Data transformation errors detected', {
        errorCount: normalizeResult.transformErrors.length,
        sampleErrors: normalizeResult.transformErrors.slice(0, 5),
      });
    }

    if (normalizeResult.records.length === 0) {
      logger.warn('No records normalized after processing', {
        sourceType,
        transformErrors: normalizeResult.transformErrors.length,
        unmappedFields: normalizeResult.unmappedFields.length,
      });
      return NextResponse.json(
        { 
          error: 'No records could be processed',
          message: 'Your data was uploaded but no records could be normalized. Please check your field mappings and ensure your data matches the expected format.',
          details: {
            transformErrors: normalizeResult.transformErrors.length,
            unmappedFields: normalizeResult.unmappedFields,
          },
        },
        { status: 400 }
      );
    }

    // Store normalized dataset
    logger.debug('Storing dataset', {
      records: normalizeResult.records.length,
      stageEvents: normalizeResult.stageEvents.length,
      actors: normalizeResult.actors.length,
    });
    
    const datasetId = await storeDataset(
      normalizeResult.records,
      normalizeResult.stageEvents,
      normalizeResult.actors,
      {
        sourceType,
        rowCount: normalizeResult.records.length,
        fieldMappings: fullConfig.fieldMappings.map(m => ({
          sourceField: m.sourceField,
          targetField: String(m.targetField),
        })),
      }
    );
    
    logger.info('Dataset stored successfully', { datasetId, recordCount: normalizeResult.records.length });

    // Detect schema for auto-mapping suggestions
    const schema = await adapter.detectSchema(ingestResult.data);

    const duration = Date.now() - startTime;
    logger.apiRequest('POST', '/api/ingest', 200, duration, {
      datasetId,
      sourceType,
      recordCount: normalizeResult.records.length,
    });

    return NextResponse.json({
      success: true,
      datasetId,
      rowCount: ingestResult.rowCount,
      schema,
      warnings: ingestResult.warnings,
      metadata: ingestResult.metadata,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const bodyData = body && typeof body === 'object' && 'sourceType' in body 
      ? { sourceType: (body as { sourceType?: string }).sourceType }
      : {};
    logger.error('Data ingestion failed', error, {
      ...bodyData,
      duration,
    });
    logger.apiRequest('POST', '/api/ingest', 500, duration);
    
    return NextResponse.json(
      { 
        error: 'Data ingestion failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while processing your data. Please try again or contact support if the problem persists.',
      },
      { status: 500 }
    );
  }
}

