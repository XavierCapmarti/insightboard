/**
 * Dashboard Templates
 * ===================
 * Pre-built dashboard configurations
 */

import { DashboardConfig, DashboardTemplatePreset } from '@/types/dashboard';

// Import JSON templates
import revenueOverview from './revenue-overview.json';
import funnelAnalysis from './funnel-analysis.json';
import performanceByOwner from './performance-by-owner.json';
import timeToClose from './time-to-close.json';

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

export const TEMPLATES: Record<string, DashboardConfig> = {
  'revenue-overview': revenueOverview as unknown as DashboardConfig,
  'funnel-analysis': funnelAnalysis as unknown as DashboardConfig,
  'performance-by-owner': performanceByOwner as unknown as DashboardConfig,
  'time-to-close': timeToClose as unknown as DashboardConfig,
};

export const TEMPLATE_PRESETS: DashboardTemplatePreset[] = [
  {
    id: 'revenue_overview',
    name: 'Revenue Overview',
    description: 'Track revenue, growth trends, and performance by segment',
    requiredMetrics: ['total_revenue', 'record_count', 'average_value'],
    defaultConfig: TEMPLATES['revenue-overview'],
  },
  {
    id: 'funnel_analysis',
    name: 'Funnel Analysis',
    description: 'Visualize pipeline stages, conversion rates, and bottlenecks',
    requiredMetrics: ['total_pipeline', 'overall_conversion', 'stage_counts'],
    defaultConfig: TEMPLATES['funnel-analysis'],
  },
  {
    id: 'performance_by_owner',
    name: 'Performance by Owner',
    description: 'Compare individual and team performance metrics',
    requiredMetrics: ['owner_value', 'owner_count', 'close_rate'],
    defaultConfig: TEMPLATES['performance-by-owner'],
  },
  {
    id: 'time_to_close',
    name: 'Time to Close',
    description: 'Analyze cycle times, velocity trends, and bottlenecks',
    requiredMetrics: ['avg_cycle_time', 'median_cycle_time'],
    defaultConfig: TEMPLATES['time-to-close'],
  },
];

// =============================================================================
// EXPORTS
// =============================================================================

export function getTemplate(id: string): DashboardConfig | undefined {
  return TEMPLATES[id];
}

export function getTemplatePresets(): DashboardTemplatePreset[] {
  return TEMPLATE_PRESETS;
}

export function createDashboardFromTemplate(
  templateId: string,
  overrides?: Partial<DashboardConfig>
): DashboardConfig | null {
  const template = TEMPLATES[templateId];
  if (!template) return null;

  return {
    ...template,
    ...overrides,
    id: overrides?.id || `${templateId}-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

