/**
 * Metrics API
 * ===========
 * Computes metrics from stored data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMetricsEngine, createPeriod, getPreviousPeriod } from '@/engine';
import { MetricDefinition, PeriodType, DataRecord } from '@/types/core';

// Generate demo data relative to current date so the API always returns results
function generateMockRecords(): DataRecord[] {
  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };

  return [
    {
      id: '1',
      ownerId: 'sarah.m',
      value: 12500,
      status: 'won',
      metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
      createdAt: daysAgo(45),
      updatedAt: daysAgo(30),
      closedAt: daysAgo(30),
    },
    {
      id: '2',
      ownerId: 'john.d',
      value: 8200,
      status: 'in_progress',
      metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
      createdAt: daysAgo(40),
      updatedAt: daysAgo(25),
    },
    {
      id: '3',
      ownerId: 'sarah.m',
      value: 45000,
      status: 'proposal',
      metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
      createdAt: daysAgo(20),
      updatedAt: daysAgo(10),
    },
    {
      id: '4',
      ownerId: 'john.d',
      value: 22000,
      status: 'won',
      metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
      createdAt: daysAgo(15),
      updatedAt: daysAgo(5),
      closedAt: daysAgo(5),
    },
    {
      id: '5',
      ownerId: 'emily.z',
      value: 18500,
      status: 'negotiation',
      metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
      createdAt: daysAgo(10),
      updatedAt: daysAgo(2),
    },
  ];
}

const mockRecords: DataRecord[] = generateMockRecords();

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

