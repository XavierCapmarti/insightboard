/**
 * Metrics API
 * ===========
 * Computes metrics from stored data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMetricsEngine, createPeriod, getPreviousPeriod } from '@/engine';
import { MetricDefinition, PeriodType, DataRecord } from '@/types/core';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodType = (searchParams.get('period') || 'month') as PeriodType;
    const metricIds = searchParams.get('metrics')?.split(',');

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

    return NextResponse.json({
      period: {
        current: currentPeriod,
        previous: previousPeriod,
      },
      metrics: results,
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compute metrics' },
      { status: 500 }
    );
  }
}

