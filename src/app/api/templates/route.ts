/**
 * Templates API
 * =============
 * Fetch available dashboard templates
 */

import { NextResponse } from 'next/server';
import { getTemplatePresets, getTemplate } from '@/templates';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const presets = getTemplatePresets();

    return NextResponse.json({
      templates: presets.map((preset) => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        requiredMetrics: preset.requiredMetrics,
      })),
    });
  } catch (error) {
    logger.error('Templates error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}


