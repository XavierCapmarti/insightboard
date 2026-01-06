/**
 * Metrics Engine
 * ==============
 * Computes metrics from normalised data
 */

import {
  DataRecord,
  StageEvent,
  MetricDefinition,
  MetricValue,
  MetricBreakdown,
  Period,
  PeriodType,
  AggregationType,
  MetricFilter,
} from '@/types/core';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  differenceInMilliseconds,
  format,
} from 'date-fns';

// =============================================================================
// METRICS ENGINE
// =============================================================================

export class MetricsEngine {
  private records: DataRecord[];
  private stageEvents: StageEvent[];

  constructor(records: DataRecord[], stageEvents: StageEvent[] = []) {
    this.records = records;
    this.stageEvents = stageEvents;
  }

  /**
   * Compute a single metric
   */
  compute(
    definition: MetricDefinition,
    period: Period,
    previousPeriod?: Period
  ): MetricValue {
    // Filter records by period
    const periodRecords = this.filterByPeriod(this.records, period);

    // Apply additional filters
    const filteredRecords = this.applyFilters(
      periodRecords,
      definition.filters || []
    );

    // Calculate the main value
    const value = this.aggregate(
      filteredRecords,
      definition.aggregation,
      definition.formula
    );

    // Calculate comparison if configured
    let comparison: MetricValue['comparison'] | undefined;
    if (definition.comparison && previousPeriod) {
      const prevRecords = this.filterByPeriod(this.records, previousPeriod);
      const prevFiltered = this.applyFilters(
        prevRecords,
        definition.filters || []
      );
      const previousValue = this.aggregate(
        prevFiltered,
        definition.aggregation,
        definition.formula
      );

      comparison = this.calculateComparison(value, previousValue);
    }

    // Calculate breakdown if groupBy is specified
    let breakdown: MetricBreakdown[] | undefined;
    if (definition.groupBy && definition.groupBy.length > 0) {
      breakdown = this.calculateBreakdown(
        filteredRecords,
        definition.groupBy[0],
        definition.aggregation,
        definition.formula,
        definition.format
      );
    }

    return {
      metricId: definition.id,
      value,
      formattedValue: this.formatValue(value, definition.format),
      period,
      comparison,
      breakdown,
    };
  }

  /**
   * Compute multiple metrics at once
   */
  computeMany(
    definitions: MetricDefinition[],
    period: Period,
    previousPeriod?: Period
  ): MetricValue[] {
    return definitions.map((def) => this.compute(def, period, previousPeriod));
  }

  // =============================================================================
  // AGGREGATION METHODS
  // =============================================================================

  private aggregate(
    records: DataRecord[],
    aggregation: AggregationType,
    formula: MetricDefinition['formula']
  ): number | null {
    if (records.length === 0) {
      return aggregation === 'count' ? 0 : null;
    }

    switch (aggregation) {
      case 'count':
        return records.length;

      case 'sum':
        return this.sum(records, formula);

      case 'average':
        const sum = this.sum(records, formula);
        return sum !== null ? sum / records.length : null;

      case 'min':
        return this.extremum(records, formula, 'min');

      case 'max':
        return this.extremum(records, formula, 'max');

      case 'median':
        return this.median(records, formula);

      case 'conversion_rate':
        return this.conversionRate(records, formula);

      case 'cycle_time':
        return this.cycleTime(records, formula);

      default:
        return null;
    }
  }

  private sum(records: DataRecord[], formula: MetricDefinition['formula']): number {
    let total = 0;

    for (const record of records) {
      const value = this.getFieldValue(record, formula);
      if (typeof value === 'number' && !isNaN(value)) {
        total += value;
      }
    }

    return total;
  }

  private extremum(
    records: DataRecord[],
    formula: MetricDefinition['formula'],
    type: 'min' | 'max'
  ): number | null {
    const values: number[] = [];

    for (const record of records) {
      const value = this.getFieldValue(record, formula);
      if (typeof value === 'number' && !isNaN(value)) {
        values.push(value);
      }
    }

    if (values.length === 0) return null;

    return type === 'min' ? Math.min(...values) : Math.max(...values);
  }

  private median(
    records: DataRecord[],
    formula: MetricDefinition['formula']
  ): number | null {
    const values: number[] = [];

    for (const record of records) {
      const value = this.getFieldValue(record, formula);
      if (typeof value === 'number' && !isNaN(value)) {
        values.push(value);
      }
    }

    if (values.length === 0) return null;

    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);

    return values.length % 2 !== 0
      ? values[mid]
      : (values[mid - 1] + values[mid]) / 2;
  }

  private conversionRate(
    records: DataRecord[],
    formula: MetricDefinition['formula']
  ): number {
    if (records.length === 0) return 0;

    // For conversion rate, we need numerator and denominator from formula
    if (formula.type !== 'derived' || !formula.numerator || !formula.denominator) {
      // Default: count records with closedAt vs total
      const converted = records.filter((r) => r.closedAt !== undefined).length;
      return (converted / records.length) * 100;
    }

    // Would compute numerator and denominator metrics here
    return 0;
  }

  private cycleTime(
    records: DataRecord[],
    formula: MetricDefinition['formula']
  ): number | null {
    const durations: number[] = [];

    for (const record of records) {
      if (record.createdAt && record.closedAt) {
        const duration = differenceInMilliseconds(
          record.closedAt,
          record.createdAt
        );
        if (duration > 0) {
          durations.push(duration / (1000 * 60 * 60 * 24)); // Convert to days
        }
      }
    }

    if (durations.length === 0) return null;

    // Return average cycle time
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  // =============================================================================
  // FILTERING
  // =============================================================================

  private filterByPeriod(records: DataRecord[], period: Period): DataRecord[] {
    return records.filter((record) => {
      const date = record.createdAt;
      return date >= period.start && date <= period.end;
    });
  }

  private applyFilters(records: DataRecord[], filters: MetricFilter[]): DataRecord[] {
    if (filters.length === 0) return records;

    return records.filter((record) => {
      return filters.every((filter) => {
        const value = this.getNestedValue(record, filter.field);
        return this.matchesFilter(value, filter);
      });
    });
  }

  private matchesFilter(value: unknown, filter: MetricFilter): boolean {
    switch (filter.operator) {
      case 'eq':
        return value === filter.value;
      case 'neq':
        return value !== filter.value;
      case 'gt':
        return typeof value === 'number' && value > (filter.value as number);
      case 'gte':
        return typeof value === 'number' && value >= (filter.value as number);
      case 'lt':
        return typeof value === 'number' && value < (filter.value as number);
      case 'lte':
        return typeof value === 'number' && value <= (filter.value as number);
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      case 'contains':
        return (
          typeof value === 'string' &&
          value.toLowerCase().includes(String(filter.value).toLowerCase())
        );
      default:
        return true;
    }
  }

  // =============================================================================
  // BREAKDOWN & COMPARISON
  // =============================================================================

  private calculateBreakdown(
    records: DataRecord[],
    groupByField: string,
    aggregation: AggregationType,
    formula: MetricDefinition['formula'],
    formatConfig: MetricDefinition['format']
  ): MetricBreakdown[] {
    // Group records by field
    const groups = new Map<string, DataRecord[]>();

    for (const record of records) {
      const groupKey = String(this.getNestedValue(record, groupByField) ?? 'Other');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(record);
    }

    // Calculate totals for percentage
    const total = this.aggregate(records, aggregation, formula) ?? 0;

    // Build breakdown
    const breakdown: MetricBreakdown[] = [];

    for (const [groupKey, groupRecords] of groups) {
      const value = this.aggregate(groupRecords, aggregation, formula) ?? 0;
      breakdown.push({
        groupKey,
        groupLabel: groupKey,
        value,
        formattedValue: this.formatValue(value, formatConfig),
        percentage: total > 0 ? (value / total) * 100 : 0,
      });
    }

    // Sort by value descending
    breakdown.sort((a, b) => b.value - a.value);

    return breakdown;
  }

  private calculateComparison(
    current: number | null,
    previous: number | null
  ): MetricValue['comparison'] {
    if (current === null) {
      return {
        previousValue: previous,
        delta: null,
        deltaPercent: null,
        trend: 'neutral',
      };
    }

    if (previous === null || previous === 0) {
      return {
        previousValue: null,
        delta: null,
        deltaPercent: null,
        trend: current > 0 ? 'up' : 'neutral',
      };
    }

    const delta = current - previous;
    const deltaPercent = (delta / previous) * 100;

    return {
      previousValue: previous,
      delta,
      deltaPercent,
      trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral',
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private getFieldValue(
    record: DataRecord,
    formula: MetricDefinition['formula']
  ): unknown {
    if (formula.type === 'field' && formula.field) {
      return this.getNestedValue(record, formula.field);
    }
    // For expressions, would evaluate here
    return null;
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private formatValue(
    value: number | null,
    format: MetricDefinition['format']
  ): string {
    if (value === null) return '—';

    const { type, decimals = 0, currency = 'USD', prefix = '', suffix = '' } = format;

    let formatted: string;

    switch (type) {
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
        break;

      case 'percentage':
        formatted = `${value.toFixed(decimals)}%`;
        break;

      case 'duration':
        // Format as days/hours
        if (value >= 1) {
          formatted = `${value.toFixed(decimals)} days`;
        } else {
          formatted = `${(value * 24).toFixed(decimals)} hours`;
        }
        break;

      default:
        formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
    }

    return `${prefix}${formatted}${suffix}`;
  }
}

// =============================================================================
// PERIOD UTILITIES
// =============================================================================

export function createPeriod(type: PeriodType, date: Date = new Date()): Period {
  let start: Date;
  let end: Date;
  let label: string;

  switch (type) {
    case 'day':
      start = startOfDay(date);
      end = endOfDay(date);
      label = format(date, 'MMM d, yyyy');
      break;

    case 'week':
      start = startOfWeek(date, { weekStartsOn: 1 });
      end = endOfWeek(date, { weekStartsOn: 1 });
      label = `Week of ${format(start, 'MMM d, yyyy')}`;
      break;

    case 'month':
      start = startOfMonth(date);
      end = endOfMonth(date);
      label = format(date, 'MMMM yyyy');
      break;

    case 'quarter':
      start = startOfQuarter(date);
      end = endOfQuarter(date);
      label = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
      break;

    case 'year':
      start = startOfYear(date);
      end = endOfYear(date);
      label = format(date, 'yyyy');
      break;

    default:
      start = startOfMonth(date);
      end = endOfMonth(date);
      label = format(date, 'MMMM yyyy');
  }

  return { type, start, end, label };
}

export function getPreviousPeriod(period: Period): Period {
  let prevDate: Date;

  switch (period.type) {
    case 'day':
      prevDate = subDays(period.start, 1);
      break;
    case 'week':
      prevDate = subWeeks(period.start, 1);
      break;
    case 'month':
      prevDate = subMonths(period.start, 1);
      break;
    case 'quarter':
      prevDate = subQuarters(period.start, 1);
      break;
    case 'year':
      prevDate = subYears(period.start, 1);
      break;
    default:
      prevDate = subMonths(period.start, 1);
  }

  return createPeriod(period.type, prevDate);
}

// =============================================================================
// FACTORY
// =============================================================================

export function createMetricsEngine(
  records: DataRecord[],
  stageEvents?: StageEvent[]
): MetricsEngine {
  return new MetricsEngine(records, stageEvents);
}

