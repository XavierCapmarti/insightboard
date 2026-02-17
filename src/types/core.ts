/**
 * Core Domain Models
 * ==================
 * Generic, industry-agnostic entities for analytics
 */

// =============================================================================
// CORE ENTITIES
// =============================================================================

/**
 * A generic record representing any tracked entity
 * (e.g., deal, order, ticket, project, lead)
 */
export interface DataRecord {
  id: string;
  externalId?: string; // Original ID from source system
  ownerId: string; // Actor who owns/manages this record
  value?: number; // Monetary or point value
  status: string; // Current status/stage
  metadata: RecordMetadata;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface RecordMetadata {
  source: string; // Data source identifier
  sourceType: DataSourceType;
  customFields: Record<string, unknown>;
}

/**
 * A stage transition event for funnel/pipeline tracking
 */
export interface StageEvent {
  id: string;
  recordId: string;
  fromStage: string | null; // null for initial creation
  toStage: string;
  timestamp: Date;
  actorId?: string; // Who triggered the transition
  durationInPreviousStage?: number; // Milliseconds
}

/**
 * An actor (user, team member, owner)
 */
export interface Actor {
  id: string;
  externalId?: string;
  name: string;
  email?: string;
  role?: string;
  team?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * A category/segment for grouping records
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // For hierarchical categories
  metadata: Record<string, unknown>;
}

// =============================================================================
// DATA SOURCE TYPES
// =============================================================================

export type DataSourceType =
  | 'google_sheets'
  | 'csv_upload'
  | 'generic_crm'
  | 'stripe'
  | 'airtable'
  | 'notion'
  | 'api'
  | 'manual';

export interface DataSourceConfig {
  id: string;
  name: string;
  type: DataSourceType;
  credentials?: Record<string, string>; // Encrypted in practice
  settings: Record<string, unknown>;
  fieldMappings: FieldMapping[];
  lastSyncAt?: Date;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  createdAt: Date;
}

export interface FieldMapping {
  sourceField: string;
  targetField: keyof DataRecord | string; // Core field or custom
  transform?: FieldTransform;
}

export type FieldTransform =
  | { type: 'direct' }
  | { type: 'date'; format: string }
  | { type: 'number'; decimals?: number }
  | { type: 'lookup'; mapping: Record<string, string> }
  | { type: 'formula'; expression: string };

// =============================================================================
// METRIC DEFINITIONS
// =============================================================================

export type AggregationType =
  | 'count'
  | 'sum'
  | 'average'
  | 'min'
  | 'max'
  | 'median'
  | 'percentile'
  | 'conversion_rate'
  | 'cycle_time';

export type PeriodType =
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'all'
  | 'custom';

export interface MetricDefinition {
  id: string;
  name: string;
  description?: string;
  formula: MetricFormula;
  aggregation: AggregationType;
  groupBy?: string[]; // Fields to group by
  filters?: MetricFilter[];
  format: MetricFormat;
  comparison?: ComparisonConfig;
}

export interface MetricFormula {
  type: 'field' | 'expression' | 'derived';
  field?: string; // For simple field aggregations
  expression?: string; // For calculated metrics
  numerator?: MetricDefinition; // For ratios
  denominator?: MetricDefinition;
}

export interface MetricFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: unknown;
}

export interface MetricFormat {
  type: 'number' | 'currency' | 'percentage' | 'duration' | 'date';
  decimals?: number;
  currency?: string;
  prefix?: string;
  suffix?: string;
}

export interface ComparisonConfig {
  type: 'previous_period' | 'same_period_last_year' | 'target';
  targetValue?: number;
  showDelta: boolean;
  deltaFormat: 'absolute' | 'percentage';
}

// =============================================================================
// COMPUTED METRIC VALUES
// =============================================================================

export interface MetricValue {
  metricId: string;
  value: number | null;
  formattedValue: string;
  period: Period;
  comparison?: {
    previousValue: number | null;
    delta: number | null;
    deltaPercent: number | null;
    trend: 'up' | 'down' | 'neutral';
  };
  breakdown?: MetricBreakdown[];
}

export interface MetricBreakdown {
  groupKey: string;
  groupLabel: string;
  value: number;
  formattedValue: string;
  percentage?: number;
}

export interface Period {
  type: PeriodType;
  start: Date;
  end: Date;
  label: string;
}

// =============================================================================
// WORKSPACE & TENANT
// =============================================================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  settings: WorkspaceSettings;
  dataSources: DataSourceConfig[];
  createdAt: Date;
}

export interface WorkspaceSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
  fiscalYearStart: number; // Month (1-12)
  defaultPeriod: PeriodType;
}

