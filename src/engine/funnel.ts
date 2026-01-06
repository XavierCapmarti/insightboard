/**
 * Funnel Analysis Engine
 * ======================
 * Computes funnel/pipeline progression metrics
 */

import { DataRecord, StageEvent, Period } from '@/types/core';
import { differenceInMilliseconds } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export interface FunnelStage {
  name: string;
  order: number; // Position in funnel
  color?: string;
}

export interface FunnelMetrics {
  stages: FunnelStageMetrics[];
  overallConversion: number; // First to last stage
  totalRecords: number;
  averageCycleTime: number | null; // Days
}

export interface FunnelStageMetrics {
  stage: string;
  order: number;
  count: number;
  percentage: number; // Of total
  conversionToNext: number | null; // Percentage converting to next stage
  dropOff: number | null; // Percentage dropping at this stage
  averageTimeInStage: number | null; // Days
}

export interface StageTransition {
  fromStage: string;
  toStage: string;
  count: number;
  percentage: number;
  averageDuration: number | null; // Days
}

// =============================================================================
// FUNNEL ENGINE
// =============================================================================

export class FunnelEngine {
  private records: DataRecord[];
  private stageEvents: StageEvent[];
  private stages: FunnelStage[];

  constructor(
    records: DataRecord[],
    stageEvents: StageEvent[],
    stages: FunnelStage[]
  ) {
    this.records = records;
    this.stageEvents = stageEvents;
    this.stages = stages.sort((a, b) => a.order - b.order);
  }

  /**
   * Compute funnel metrics for a period
   */
  compute(period?: Period): FunnelMetrics {
    // Filter by period if provided
    const records = period
      ? this.records.filter(
          (r) => r.createdAt >= period.start && r.createdAt <= period.end
        )
      : this.records;

    // Count records by current status
    const stageCounts = new Map<string, number>();
    for (const record of records) {
      const count = stageCounts.get(record.status) || 0;
      stageCounts.set(record.status, count + 1);
    }

    // Build stage metrics
    const stageMetrics: FunnelStageMetrics[] = [];
    let totalRecords = records.length;

    // Calculate cumulative counts (records that passed through each stage)
    const cumulativeCounts = this.calculateCumulativeCounts(records);

    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      const count = cumulativeCounts.get(stage.name) || 0;
      const nextStage = this.stages[i + 1];
      const nextCount = nextStage
        ? cumulativeCounts.get(nextStage.name) || 0
        : 0;

      const conversionToNext =
        count > 0 && nextStage ? (nextCount / count) * 100 : null;

      const dropOff =
        count > 0 && nextStage ? ((count - nextCount) / count) * 100 : null;

      stageMetrics.push({
        stage: stage.name,
        order: stage.order,
        count,
        percentage: totalRecords > 0 ? (count / totalRecords) * 100 : 0,
        conversionToNext,
        dropOff,
        averageTimeInStage: this.calculateAverageTimeInStage(stage.name),
      });
    }

    // Calculate overall conversion
    const firstStageCount = cumulativeCounts.get(this.stages[0]?.name) || 0;
    const lastStageCount =
      cumulativeCounts.get(this.stages[this.stages.length - 1]?.name) || 0;
    const overallConversion =
      firstStageCount > 0 ? (lastStageCount / firstStageCount) * 100 : 0;

    return {
      stages: stageMetrics,
      overallConversion,
      totalRecords,
      averageCycleTime: this.calculateAverageCycleTime(records),
    };
  }

  /**
   * Get all stage transitions
   */
  getTransitions(period?: Period): StageTransition[] {
    // Filter events by period
    const events = period
      ? this.stageEvents.filter(
          (e) => e.timestamp >= period.start && e.timestamp <= period.end
        )
      : this.stageEvents;

    // Group transitions
    const transitionCounts = new Map<string, number>();
    const transitionDurations = new Map<string, number[]>();

    for (const event of events) {
      if (!event.fromStage) continue; // Skip initial creation

      const key = `${event.fromStage}→${event.toStage}`;
      const count = transitionCounts.get(key) || 0;
      transitionCounts.set(key, count + 1);

      if (event.durationInPreviousStage) {
        const durations = transitionDurations.get(key) || [];
        durations.push(event.durationInPreviousStage / (1000 * 60 * 60 * 24));
        transitionDurations.set(key, durations);
      }
    }

    // Build result
    const total = events.filter((e) => e.fromStage).length;
    const transitions: StageTransition[] = [];

    for (const [key, count] of transitionCounts) {
      const [fromStage, toStage] = key.split('→');
      const durations = transitionDurations.get(key) || [];
      const avgDuration =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : null;

      transitions.push({
        fromStage,
        toStage,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        averageDuration: avgDuration,
      });
    }

    // Sort by count
    transitions.sort((a, b) => b.count - a.count);

    return transitions;
  }

  /**
   * Get conversion rate between two specific stages
   */
  getConversionRate(fromStage: string, toStage: string): number {
    const fromCount = this.records.filter((r) =>
      this.hasReachedStage(r, fromStage)
    ).length;
    const toCount = this.records.filter((r) =>
      this.hasReachedStage(r, toStage)
    ).length;

    return fromCount > 0 ? (toCount / fromCount) * 100 : 0;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Calculate how many records reached each stage (cumulative)
   */
  private calculateCumulativeCounts(records: DataRecord[]): Map<string, number> {
    const counts = new Map<string, number>();

    // For each record, mark all stages it has reached
    for (const record of records) {
      const currentStageOrder = this.getStageOrder(record.status);

      for (const stage of this.stages) {
        // Record has reached this stage if its current stage order is >= this stage's order
        if (currentStageOrder >= stage.order) {
          const count = counts.get(stage.name) || 0;
          counts.set(stage.name, count + 1);
        }
      }
    }

    return counts;
  }

  /**
   * Check if a record has reached a specific stage
   */
  private hasReachedStage(record: DataRecord, stageName: string): boolean {
    const targetOrder = this.getStageOrder(stageName);
    const currentOrder = this.getStageOrder(record.status);
    return currentOrder >= targetOrder;
  }

  /**
   * Get the order of a stage
   */
  private getStageOrder(stageName: string): number {
    const stage = this.stages.find((s) => s.name === stageName);
    return stage?.order ?? -1;
  }

  /**
   * Calculate average time spent in a stage
   */
  private calculateAverageTimeInStage(stageName: string): number | null {
    const durations: number[] = [];

    // Find all events that transition FROM this stage
    const exitEvents = this.stageEvents.filter(
      (e) => e.fromStage === stageName && e.durationInPreviousStage
    );

    for (const event of exitEvents) {
      if (event.durationInPreviousStage) {
        durations.push(event.durationInPreviousStage / (1000 * 60 * 60 * 24));
      }
    }

    if (durations.length === 0) return null;

    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  /**
   * Calculate average total cycle time (created to closed)
   */
  private calculateAverageCycleTime(records: DataRecord[]): number | null {
    const cycleTimes: number[] = [];

    for (const record of records) {
      if (record.createdAt && record.closedAt) {
        const ms = differenceInMilliseconds(record.closedAt, record.createdAt);
        if (ms > 0) {
          cycleTimes.push(ms / (1000 * 60 * 60 * 24));
        }
      }
    }

    if (cycleTimes.length === 0) return null;

    return cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length;
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createFunnelEngine(
  records: DataRecord[],
  stageEvents: StageEvent[],
  stages: FunnelStage[]
): FunnelEngine {
  return new FunnelEngine(records, stageEvents, stages);
}

/**
 * Create stages from unique statuses in records
 */
export function inferStagesFromRecords(records: DataRecord[]): FunnelStage[] {
  const uniqueStatuses = new Set<string>();

  for (const record of records) {
    uniqueStatuses.add(record.status);
  }

  return Array.from(uniqueStatuses).map((name, index) => ({
    name,
    order: index,
  }));
}

