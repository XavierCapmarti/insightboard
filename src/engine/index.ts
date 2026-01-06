/**
 * Engine Exports
 * ==============
 * Central export for metrics and funnel engines
 */

export {
  MetricsEngine,
  createMetricsEngine,
  createPeriod,
  getPreviousPeriod,
} from './metrics';

export {
  FunnelEngine,
  createFunnelEngine,
  inferStagesFromRecords,
  type FunnelStage,
  type FunnelMetrics,
  type FunnelStageMetrics,
  type StageTransition,
} from './funnel';

