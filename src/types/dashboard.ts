/**
 * Dashboard Configuration Types
 * =============================
 * JSON-configurable dashboard templates
 */

import { MetricDefinition, PeriodType } from './core';

// =============================================================================
// DASHBOARD STRUCTURE
// =============================================================================

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  template: DashboardTemplate;
  layout: DashboardLayout;
  sections: DashboardSection[];
  filters: GlobalFilter[];
  theme?: DashboardTheme;
  refreshInterval?: number; // Seconds
  createdAt: Date;
  updatedAt: Date;
}

export type DashboardTemplate =
  | 'revenue_overview'
  | 'funnel_analysis'
  | 'performance_by_owner'
  | 'time_to_close'
  | 'custom';

export interface DashboardLayout {
  columns: number; // Grid columns (e.g., 12)
  rowHeight: number; // Pixels
  gap: number; // Gap between widgets
  responsive: ResponsiveBreakpoints;
}

export interface ResponsiveBreakpoints {
  mobile: number; // Max columns on mobile
  tablet: number;
  desktop: number;
}

// =============================================================================
// SECTIONS & WIDGETS
// =============================================================================

export interface DashboardSection {
  id: string;
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  widgets: Widget[];
}

export interface Widget {
  id: string;
  type: WidgetType;
  title?: string;
  position: WidgetPosition;
  config: WidgetConfig;
  refreshInterval?: number; // Override dashboard default
}

export interface WidgetPosition {
  x: number; // Column start (0-indexed)
  y: number; // Row start
  width: number; // Column span
  height: number; // Row span
}

export type WidgetType =
  | 'kpi_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'funnel_chart'
  | 'table'
  | 'leaderboard'
  | 'trend_spark'
  | 'progress_bar'
  | 'heatmap'
  | 'gauge'
  | 'text'
  | 'filter';

export type WidgetConfig =
  | KPICardConfig
  | ChartConfig
  | TableConfig
  | LeaderboardConfig
  | ProgressConfig
  | TextConfig
  | FilterWidgetConfig;

// =============================================================================
// WIDGET CONFIGURATIONS
// =============================================================================

export interface KPICardConfig {
  type: 'kpi_card';
  metricId: string;
  showComparison: boolean;
  comparisonPeriod?: 'previous' | 'year_ago';
  icon?: string;
  color?: string;
  sparkline?: boolean;
}

export interface ChartConfig {
  type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'funnel_chart';
  metrics: ChartMetric[];
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  legend?: LegendConfig;
  stacked?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  colors?: string[];
}

export interface ChartMetric {
  metricId: string;
  label?: string;
  color?: string;
  chartType?: 'line' | 'bar' | 'area'; // For mixed charts
}

export interface AxisConfig {
  field?: string;
  label?: string;
  format?: string;
  min?: number;
  max?: number;
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface TableConfig {
  type: 'table';
  columns: TableColumn[];
  pageSize?: number;
  sortable?: boolean;
  searchable?: boolean;
  exportable?: boolean;
}

export interface TableColumn {
  field: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: string;
  sortable?: boolean;
  hidden?: boolean;
}

export interface LeaderboardConfig {
  type: 'leaderboard';
  metricId: string;
  groupBy: string; // Field to group by (e.g., 'ownerId')
  limit: number;
  showRank: boolean;
  showProgress?: boolean;
  targetValue?: number;
  sortDirection: 'asc' | 'desc';
}

export interface ProgressConfig {
  type: 'progress_bar';
  metricId: string;
  targetValue: number;
  showPercentage: boolean;
  color?: string;
  thresholds?: ProgressThreshold[];
}

export interface ProgressThreshold {
  value: number;
  color: string;
  label?: string;
}

export interface TextConfig {
  type: 'text';
  content: string; // Supports markdown
  alignment?: 'left' | 'center' | 'right';
}

export interface FilterWidgetConfig {
  type: 'filter';
  filters: GlobalFilter[];
  layout: 'horizontal' | 'vertical';
}

// =============================================================================
// FILTERS
// =============================================================================

export interface GlobalFilter {
  id: string;
  field: string;
  label: string;
  type: FilterType;
  defaultValue?: unknown;
  options?: FilterOption[];
  required?: boolean;
}

export type FilterType =
  | 'select'
  | 'multi_select'
  | 'date_range'
  | 'date'
  | 'search'
  | 'number_range';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// =============================================================================
// THEMES
// =============================================================================

export interface DashboardTheme {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  borderColor: string;
  fontFamily?: string;
  borderRadius?: number;
}

// =============================================================================
// TEMPLATE PRESETS
// =============================================================================

export interface DashboardTemplatePreset {
  id: DashboardTemplate;
  name: string;
  description: string;
  thumbnail?: string;
  requiredMetrics: string[];
  defaultConfig: Partial<DashboardConfig>;
}


