/**
 * Dataset Metrics API
 * ===================
 * Computes metrics for a stored dataset
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataset } from '@/lib/datasetStore';
import { createMetricsEngine, createPeriod, getPreviousPeriod } from '@/engine';
import { createFunnelEngine, inferStagesFromRecords } from '@/engine/funnel';
import { PeriodType } from '@/types/core';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  let datasetId: string | undefined;
  try {
    const resolvedParams = await params;
    datasetId = resolvedParams.datasetId;
    const searchParams = request.nextUrl.searchParams;
    const periodType = (searchParams.get('period') || 'all') as PeriodType;

    logger.debug('Dataset metrics request', { datasetId, periodType, url: request.url });

    // Get dataset (now loads from file if not in cache)
    const dataset = await getDataset(datasetId);
    if (!dataset) {
      logger.warn('Dataset not found', { datasetId });
      return NextResponse.json(
        { 
          error: 'Dataset not found',
          message: 'The requested dataset could not be found. Please re-upload your data to create a new dataset.',
        },
        { status: 404 }
      );
    }

    if (dataset.records.length === 0) {
      logger.warn('Dataset has no records', { datasetId });
      return NextResponse.json(
        { 
          error: 'Dataset has no records',
          message: 'The dataset exists but contains no records. Please check your field mappings and ensure your data was processed correctly.',
        },
        { status: 400 }
      );
    }

    // Validate dates
    const invalidDates = dataset.records.filter(r => 
      isNaN(r.createdAt.getTime()) || isNaN(r.updatedAt.getTime())
    );
    if (invalidDates.length > 0) {
      logger.warn('Invalid dates detected in dataset', { datasetId, invalidCount: invalidDates.length });
    }

    // Create periods
    const currentPeriod = createPeriod(periodType);
    const previousPeriod = getPreviousPeriod(currentPeriod);

    // Create metrics engine
    const metricsEngine = createMetricsEngine(dataset.records, dataset.stageEvents);

    // Create funnel engine
    const stages = inferStagesFromRecords(dataset.records);
    if (stages.length === 0) {
      return NextResponse.json(
        { error: 'No stages found in data. Make sure you mapped the Stage/Status field.' },
        { status: 400 }
      );
    }
    
    const funnelEngine = createFunnelEngine(dataset.records, dataset.stageEvents, stages);
    const funnelMetrics = funnelEngine.compute(currentPeriod);

    // Compute metrics needed by funnel-analysis template
    const metrics = {
      // KPI metrics
      total_pipeline: {
        value: dataset.records.length,
        formattedValue: dataset.records.length.toLocaleString(),
      },
      overall_conversion: {
        value: funnelMetrics.overallConversion,
        formattedValue: `${funnelMetrics.overallConversion.toFixed(1)}%`,
      },
      avg_cycle_time: {
        value: funnelMetrics.averageCycleTime,
        formattedValue: funnelMetrics.averageCycleTime 
          ? `${Math.round(funnelMetrics.averageCycleTime)} days`
          : '—',
      },
      biggest_dropoff: {
        value: computeBiggestDropoff(funnelMetrics.stages),
        formattedValue: formatBiggestDropoff(funnelMetrics.stages),
      },
      
      // Funnel data
      funnel_stages: funnelMetrics.stages.map(s => ({
        stage: s.stage,
        count: s.count,
        percentage: s.percentage,
        conversionToNext: s.conversionToNext,
        dropOff: s.dropOff,
        avgTimeInStage: s.averageTimeInStage,
      })),
      
      // Stage conversions for bar chart
      stage_conversions: funnelMetrics.stages
        .filter(s => s.conversionToNext !== null)
        .map(s => ({
          stage: s.stage,
          conversionRate: s.conversionToNext!,
        })),
    };

    return NextResponse.json({
      success: true,
      datasetId,
      period: currentPeriod,
      metrics,
      funnel: funnelMetrics,
    });
  } catch (error) {
    logger.error('Dataset metrics computation failed', error, { datasetId: datasetId || 'unknown' });
    return NextResponse.json(
      { 
        error: 'Failed to compute metrics',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while computing metrics. Please try again or contact support if the problem persists.',
      },
      { status: 500 }
    );
  }
}

/**
 * Compute biggest drop-off percentage
 */
function computeBiggestDropoff(stages: Array<{ dropOff: number | null }>): number {
  const dropoffs = stages
    .map(s => s.dropOff)
    .filter((d): d is number => d !== null);
  
  return dropoffs.length > 0 ? Math.max(...dropoffs) : 0;
}

/**
 * Format biggest drop-off as string
 */
function formatBiggestDropoff(
  stages: Array<{ stage: string; dropOff: number | null }>
): string {
  let maxDropoff = 0;
  let maxStage = '';
  
  for (let i = 0; i < stages.length - 1; i++) {
    const dropoff = stages[i].dropOff;
    if (dropoff !== null && dropoff > maxDropoff) {
      maxDropoff = dropoff;
      maxStage = `${stages[i].stage} → ${stages[i + 1]?.stage || 'Next'}`;
    }
  }
  
  return maxDropoff > 0 
    ? `${maxDropoff.toFixed(1)}% (${maxStage})`
    : 'No drop-off detected';
}

