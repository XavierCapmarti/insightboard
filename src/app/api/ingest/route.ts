/**
 * Data Ingestion API
 * ==================
 * Handles data uploads and source connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/adapters';
import { DataSourceConfig } from '@/types/core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceType, config, content } = body as {
      sourceType: string;
      config: Partial<DataSourceConfig>;
      content?: string;
    };

    // Get the appropriate adapter
    const adapter = getAdapter(sourceType);
    if (!adapter) {
      return NextResponse.json(
        { error: `Unknown source type: ${sourceType}` },
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

    // Detect schema for auto-mapping suggestions
    const schema = await adapter.detectSchema(ingestResult.data);

    return NextResponse.json({
      success: true,
      rowCount: ingestResult.rowCount,
      schema,
      warnings: ingestResult.warnings,
      metadata: ingestResult.metadata,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingestion failed' },
      { status: 500 }
    );
  }
}

