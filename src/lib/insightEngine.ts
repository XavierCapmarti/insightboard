/**
 * Insight Engine
 * ==============
 * Analyzes metrics and generates actionable insights
 *
 * Insight Types:
 * - Drop-off: Identifies conversion bottlenecks
 * - Trend: Detects positive/negative trends over time
 * - Anomaly: Highlights unusual patterns
 * - Opportunity: Suggests areas for improvement
 */

export interface Insight {
  id: string;
  type: 'drop-off' | 'trend' | 'anomaly' | 'opportunity' | 'performance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  value: string;
  recommendation?: string;
  impact?: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-100
}

interface MetricsData {
  funnel_stages?: Array<{
    stage: string;
    count: number;
    conversionRate: number | null;
    dropOff: number | null;
  }>;
  overall_conversion?: { value: number };
  total_pipeline?: { value: number };
  avg_cycle_time?: { value: number };
  median_cycle_time?: { value: number };
  [key: string]: any;
}

/**
 * Generate insights from metrics data
 */
export function generateInsights(metrics: MetricsData): Insight[] {
  const insights: Insight[] = [];

  // 1. Analyze funnel drop-offs
  if (metrics.funnel_stages && metrics.funnel_stages.length > 1) {
    const dropoffInsights = analyzeFunnelDropoffs(metrics.funnel_stages);
    insights.push(...dropoffInsights);
  }

  // 2. Analyze conversion rate
  if (metrics.overall_conversion) {
    const conversionInsights = analyzeConversionRate(metrics.overall_conversion.value);
    insights.push(...conversionInsights);
  }

  // 3. Analyze cycle time
  if (metrics.avg_cycle_time && metrics.median_cycle_time) {
    const cycleInsights = analyzeCycleTime(
      metrics.avg_cycle_time.value,
      metrics.median_cycle_time.value
    );
    insights.push(...cycleInsights);
  }

  // 4. Analyze pipeline health
  if (metrics.total_pipeline && metrics.funnel_stages) {
    const pipelineInsights = analyzePipelineHealth(
      metrics.total_pipeline.value,
      metrics.funnel_stages
    );
    insights.push(...pipelineInsights);
  }

  // Sort by priority and confidence
  return insights.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });
}

/**
 * Analyze funnel drop-offs
 */
function analyzeFunnelDropoffs(stages: MetricsData['funnel_stages']): Insight[] {
  if (!stages) return [];

  const insights: Insight[] = [];
  let maxDropoff = 0;
  let maxDropoffStage = '';
  let nextStage = '';

  // Find biggest drop-off
  for (let i = 0; i < stages.length - 1; i++) {
    const dropoff = stages[i].dropOff;
    if (dropoff !== null && dropoff > maxDropoff) {
      maxDropoff = dropoff;
      maxDropoffStage = stages[i].stage;
      nextStage = stages[i + 1]?.stage || 'next stage';
    }
  }

  if (maxDropoff > 0) {
    // Critical if drop-off > 50%
    const priority = maxDropoff > 50 ? 'critical' : maxDropoff > 30 ? 'high' : 'medium';

    insights.push({
      id: 'funnel-dropoff-1',
      type: 'drop-off',
      priority,
      title: 'Significant Drop-off Detected',
      description: `${maxDropoff.toFixed(1)}% of opportunities are lost between ${maxDropoffStage} and ${nextStage}`,
      value: `${maxDropoff.toFixed(1)}%`,
      recommendation: `Focus on improving the transition from ${maxDropoffStage} to ${nextStage}. Consider: (1) Streamlining the process, (2) Providing better resources, (3) Training team members on this stage.`,
      impact: 'negative',
      confidence: 90,
    });
  }

  // Identify multiple drop-off points
  const significantDropoffs = stages
    .map((stage, i) => ({
      stage: stage.stage,
      dropOff: stage.dropOff || 0,
      nextStage: stages[i + 1]?.stage || 'next',
    }))
    .filter((s) => s.dropOff > 25 && s.dropOff < maxDropoff)
    .slice(0, 2);

  significantDropoffs.forEach((dropoff, index) => {
    insights.push({
      id: `funnel-dropoff-${index + 2}`,
      type: 'drop-off',
      priority: 'medium',
      title: 'Secondary Bottleneck',
      description: `${dropoff.dropOff.toFixed(1)}% drop-off at ${dropoff.stage} → ${dropoff.nextStage}`,
      value: `${dropoff.dropOff.toFixed(1)}%`,
      recommendation: `Address this bottleneck after resolving the primary drop-off`,
      impact: 'negative',
      confidence: 75,
    });
  });

  return insights;
}

/**
 * Analyze conversion rate
 */
function analyzeConversionRate(conversionRate: number): Insight[] {
  const insights: Insight[] = [];

  // Benchmark against industry averages (rough estimates)
  const benchmarks = {
    excellent: 20,
    good: 15,
    average: 10,
    poor: 5,
  };

  if (conversionRate >= benchmarks.excellent) {
    insights.push({
      id: 'conversion-excellent',
      type: 'performance',
      priority: 'low',
      title: 'Excellent Conversion Rate',
      description: `Your ${conversionRate.toFixed(1)}% conversion rate is above industry benchmarks`,
      value: `${conversionRate.toFixed(1)}%`,
      recommendation: 'Maintain current practices and document what\'s working well',
      impact: 'positive',
      confidence: 85,
    });
  } else if (conversionRate < benchmarks.poor) {
    insights.push({
      id: 'conversion-critical',
      type: 'opportunity',
      priority: 'critical',
      title: 'Low Conversion Rate',
      description: `${conversionRate.toFixed(1)}% conversion rate indicates significant room for improvement`,
      value: `${conversionRate.toFixed(1)}%`,
      recommendation: 'Review your entire funnel for bottlenecks. Consider: (1) Better lead qualification, (2) Improved follow-up processes, (3) Enhanced value proposition',
      impact: 'negative',
      confidence: 90,
    });
  } else if (conversionRate < benchmarks.average) {
    insights.push({
      id: 'conversion-below-average',
      type: 'opportunity',
      priority: 'high',
      title: 'Below-Average Conversion',
      description: `${conversionRate.toFixed(1)}% conversion rate is below industry average`,
      value: `${conversionRate.toFixed(1)}%`,
      recommendation: 'Focus on the largest drop-off points and improve those stages first',
      impact: 'negative',
      confidence: 80,
    });
  }

  return insights;
}

/**
 * Analyze cycle time
 */
function analyzeCycleTime(avgCycleTime: number, medianCycleTime: number): Insight[] {
  const insights: Insight[] = [];

  // Check for outliers (mean much higher than median)
  const variance = avgCycleTime - medianCycleTime;
  const variancePercent = (variance / medianCycleTime) * 100;

  if (variancePercent > 50) {
    insights.push({
      id: 'cycle-time-outliers',
      type: 'anomaly',
      priority: 'high',
      title: 'Long-Tail Deals Detected',
      description: `Average cycle time (${Math.round(avgCycleTime)} days) is much higher than median (${Math.round(medianCycleTime)} days), indicating some deals take significantly longer`,
      value: `+${variancePercent.toFixed(0)}%`,
      recommendation: 'Investigate deals taking longer than average. Look for: (1) Complex decision-making processes, (2) Multiple stakeholders, (3) Missing information or resources',
      impact: 'negative',
      confidence: 85,
    });
  }

  // Long cycle times
  if (avgCycleTime > 90) {
    insights.push({
      id: 'cycle-time-long',
      type: 'opportunity',
      priority: 'medium',
      title: 'Long Sales Cycle',
      description: `Average cycle time of ${Math.round(avgCycleTime)} days may indicate inefficiencies`,
      value: `${Math.round(avgCycleTime)} days`,
      recommendation: 'Look for ways to accelerate the process: (1) Automate repetitive tasks, (2) Improve response times, (3) Streamline approval processes',
      impact: 'negative',
      confidence: 75,
    });
  } else if (avgCycleTime < 30) {
    insights.push({
      id: 'cycle-time-fast',
      type: 'performance',
      priority: 'low',
      title: 'Fast Sales Cycle',
      description: `Your ${Math.round(avgCycleTime)}-day average cycle time is efficient`,
      value: `${Math.round(avgCycleTime)} days`,
      recommendation: 'Maintain velocity while ensuring quality. Document your process for new team members',
      impact: 'positive',
      confidence: 80,
    });
  }

  return insights;
}

/**
 * Analyze pipeline health
 */
function analyzePipelineHealth(
  totalPipeline: number,
  stages: MetricsData['funnel_stages']
): Insight[] {
  if (!stages) return [];

  const insights: Insight[] = [];

  // Check for stage imbalance
  const stageCounts = stages.map((s) => s.count);
  const firstStageCount = stageCounts[0] || 0;
  const lastStageCount = stageCounts[stageCounts.length - 1] || 0;

  // Too few at top of funnel
  if (firstStageCount < totalPipeline * 0.3) {
    insights.push({
      id: 'pipeline-low-top',
      type: 'opportunity',
      priority: 'high',
      title: 'Insufficient Pipeline',
      description: `Only ${firstStageCount} opportunities in early stages - may need more lead generation`,
      value: `${firstStageCount} leads`,
      recommendation: 'Increase lead generation efforts to fill the top of the funnel',
      impact: 'negative',
      confidence: 75,
    });
  }

  // Healthy pipeline distribution
  const evenDistribution = stageCounts.every(
    (count, i) => i === 0 || count >= stageCounts[i - 1] * 0.4
  );

  if (evenDistribution && totalPipeline > 50) {
    insights.push({
      id: 'pipeline-healthy',
      type: 'performance',
      priority: 'low',
      title: 'Healthy Pipeline',
      description: `Pipeline is well-balanced across stages with ${totalPipeline} total opportunities`,
      value: `${totalPipeline} deals`,
      recommendation: 'Continue current lead generation and nurturing practices',
      impact: 'positive',
      confidence: 80,
    });
  }

  return insights;
}

/**
 * Get top insights (limit to N most important)
 */
export function getTopInsights(insights: Insight[], limit: number = 3): Insight[] {
  return insights.slice(0, limit);
}

/**
 * Format insight for display
 */
export function formatInsightText(insight: Insight): string {
  return `${insight.title}: ${insight.description}`;
}
