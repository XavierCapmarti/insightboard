/**
 * Debug endpoint to inspect dataset store
 */

import { NextResponse } from 'next/server';
import { listDatasets, getDataset } from '@/lib/datasetStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get('datasetId');
  
  if (datasetId) {
    // Get specific dataset
    const dataset = await getDataset(datasetId);
    return NextResponse.json({
      found: !!dataset,
      dataset: dataset ? {
        id: dataset.id,
        recordCount: dataset.records.length,
        createdAt: dataset.createdAt,
        metadata: dataset.metadata,
      } : null,
    });
  }
  
  // List all datasets
  const datasets = await listDatasets();
  return NextResponse.json({
    total: datasets.length,
    datasets,
    timestamp: new Date().toISOString(),
  });
}


