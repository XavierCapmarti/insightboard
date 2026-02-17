/**
 * Deal Quality Metrics Calculations
 * =================================
 * Functions to analyze deal sizes and values
 */

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

export interface DealSizeBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface StageDealSize {
  stage: string;
  min: number;
  max: number;
  median: number;
  avg: number;
  q1: number;
  q3: number;
  count: number;
}

export interface HighValueDeal {
  id: string;
  ownerId: string;
  stage: string;
  value: number;
}

/**
 * Compute deal size distribution buckets for histogram
 */
export function computeDealSizeDistribution(
  csvData: CSVRow[],
  mappings: FieldMapping[]
): DealSizeBucket[] {
  const valueField = mappings.find(m => m.targetField === 'value');
  if (!valueField) return [];

  // Extract all deal values
  const values = csvData
    .map(row => parseFloat(row[valueField.sourceField] || '0'))
    .filter(val => val > 0)
    .sort((a, b) => a - b);

  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Create buckets (10 buckets)
  const bucketCount = 10;
  const bucketSize = (max - min) / bucketCount;
  const buckets: DealSizeBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + (i * bucketSize);
    const bucketMax = i === bucketCount - 1 ? max : min + ((i + 1) * bucketSize);
    
    const count = values.filter(v => {
      if (i === bucketCount - 1) {
        return v >= bucketMin && v <= bucketMax;
      }
      return v >= bucketMin && v < bucketMax;
    }).length;

    buckets.push({
      range: formatRange(bucketMin, bucketMax),
      count,
      percentage: (count / values.length) * 100,
    });
  }

  return buckets;
}

/**
 * Compute deal size statistics by stage (for box plot)
 */
export function computeDealSizeByStage(
  csvData: CSVRow[],
  mappings: FieldMapping[]
): StageDealSize[] {
  const valueField = mappings.find(m => m.targetField === 'value');
  const statusField = mappings.find(m => m.targetField === 'status');
  
  if (!valueField || !statusField) return [];

  // Group deals by stage
  const stageMap = new Map<string, number[]>();
  
  csvData.forEach(row => {
    const value = parseFloat(row[valueField.sourceField] || '0');
    const stage = row[statusField.sourceField];
    
    if (value > 0 && stage) {
      if (!stageMap.has(stage)) {
        stageMap.set(stage, []);
      }
      stageMap.get(stage)!.push(value);
    }
  });

  // Compute statistics for each stage
  const stats: StageDealSize[] = [];
  
  stageMap.forEach((values, stage) => {
    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    
    if (count === 0) return;

    const min = sorted[0];
    const max = sorted[count - 1];
    const median = getMedian(sorted);
    const avg = sorted.reduce((a, b) => a + b, 0) / count;
    const q1 = getPercentile(sorted, 25);
    const q3 = getPercentile(sorted, 75);

    stats.push({
      stage,
      min,
      max,
      median,
      avg,
      q1,
      q3,
      count,
    });
  });

  return stats.sort((a, b) => b.avg - a.avg);
}

/**
 * Identify high-value deals
 */
export function identifyHighValueDeals(
  csvData: CSVRow[],
  mappings: FieldMapping[],
  threshold?: number
): HighValueDeal[] {
  const valueField = mappings.find(m => m.targetField === 'value');
  const statusField = mappings.find(m => m.targetField === 'status');
  const ownerField = mappings.find(m => m.targetField === 'ownerId');
  const idField = mappings.find(m => m.targetField === 'id');
  
  if (!valueField || !statusField) return [];

  // Calculate threshold if not provided (top 10% or $50k+)
  let actualThreshold = threshold;
  if (!actualThreshold) {
    const values = csvData
      .map(row => parseFloat(row[valueField.sourceField] || '0'))
      .filter(v => v > 0)
      .sort((a, b) => b - a);
    
    if (values.length === 0) return [];
    
    // Use 90th percentile or $50k, whichever is higher
    const percentile90 = values[Math.floor(values.length * 0.1)];
    actualThreshold = Math.max(percentile90 || 0, 50000);
  }

  // Find high-value deals
  const highValueDeals: HighValueDeal[] = [];
  
  csvData.forEach((row, index) => {
    const value = parseFloat(row[valueField.sourceField] || '0');
    
    if (value >= actualThreshold!) {
      highValueDeals.push({
        id: idField ? row[idField.sourceField] || `deal-${index}` : `deal-${index}`,
        ownerId: ownerField ? row[ownerField.sourceField] || 'unassigned' : 'unassigned',
        stage: row[statusField.sourceField] || 'unknown',
        value,
      });
    }
  });

  return highValueDeals.sort((a, b) => b.value - a.value);
}

/**
 * Helper: Get median value
 */
function getMedian(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Helper: Get percentile value
 */
function getPercentile(sorted: number[], percentile: number): number {
  const index = Math.floor((sorted.length - 1) * (percentile / 100));
  return sorted[index] || 0;
}

/**
 * Helper: Format value range for display
 */
function formatRange(min: number, max: number): string {
  const formatValue = (val: number): string => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(0)}k`;
    }
    return `$${val.toFixed(0)}`;
  };
  
  return `${formatValue(min)} - ${formatValue(max)}`;
}


