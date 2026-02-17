/**
 * Metrics API
 * ===========
 * Computes metrics from stored data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMetricsEngine, createPeriod, getPreviousPeriod } from '@/engine';
import { MetricDefinition, PeriodType, DataRecord } from '@/types/core';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Mock data store - in production, this would be a database
const mockRecords: DataRecord[] = [
  {
    id: '1',
    ownerId: 'sarah.m',
    value: 12500,
    status: 'won',
    metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-01'),
    closedAt: new Date('2024-12-01'),
  },
  {
    id: '2',
    ownerId: 'john.d',
    value: 8200,
    status: 'in_progress',
    metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2024-12-05'),
  },
  {
    id: '3',
    ownerId: 'sarah.m',
    value: 45000,
    status: 'proposal',
    metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-10'),
  },
];

// Default metric definitions
const DEFAULT_METRICS: MetricDefinition[] = [
  {
    id: 'total_revenue',
    name: 'Total Revenue',
    aggregation: 'sum',
    formula: { type: 'field', field: 'value' },
    format: { type: 'currency', currency: 'USD' },
  },
  {
    id: 'record_count',
    name: 'Total Records',
    aggregation: 'count',
    formula: { type: 'field' },
    format: { type: 'number' },
  },
  {
    id: 'average_value',
    name: 'Average Value',
    aggregation: 'average',
    formula: { type: 'field', field: 'value' },
    format: { type: 'currency', currency: 'USD' },
  },
  {
    id: 'avg_cycle_time',
    name: 'Avg Cycle Time',
    aggregation: 'cycle_time',
    formula: { type: 'field' },
    format: { type: 'duration' },
  },
];

// Mark as dynamic since we use searchParams
export const dynamic = 'force-dynamic';

// Query parameter validation schema
const metricsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
  metrics: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Rate limiting
  const rateLimitResponse = rateLimiters.metrics(request);
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for metrics API', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return rateLimitResponse;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Validate query parameters
    const queryParams = {
      period: searchParams.get('period') || undefined,
      metrics: searchParams.get('metrics') || undefined,
    };
    
    const validationResult = metricsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      logger.warn('Invalid metrics query parameters', { errors: validationResult.error.errors });
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          message: 'Please check your query parameters and try again.',
          details: errors,
        },
        { status: 400 }
      );
    }
    
    const periodType = (validationResult.data.period || 'month') as PeriodType;
    const metricIds = validationResult.data.metrics?.split(',');

    // Create periods
    const currentPeriod = createPeriod(periodType);
    const previousPeriod = getPreviousPeriod(currentPeriod);

    // Create metrics engine
    const engine = createMetricsEngine(mockRecords, []);

    // Filter metrics if specified
    const metricsToCompute = metricIds
      ? DEFAULT_METRICS.filter((m) => metricIds.includes(m.id))
      : DEFAULT_METRICS;

    // Compute all metrics
    const results = engine.computeMany(
      metricsToCompute,
      currentPeriod,
      previousPeriod
    );

    const duration = Date.now() - startTime;
    logger.apiRequest('GET', '/api/metrics', 200, duration, {
      periodType,
      metricCount: results.length,
    });

    return NextResponse.json({
      period: {
        current: currentPeriod,
        previous: previousPeriod,
      },
      metrics: results,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Metrics computation failed', error, { duration });
    logger.apiRequest('GET', '/api/metrics', 500, duration);
    
    return NextResponse.json(
      { 
        error: 'Failed to compute metrics',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while computing metrics. Please try again or contact support if the problem persists.',
      },
      { status: 500 }
    );
  }
}

