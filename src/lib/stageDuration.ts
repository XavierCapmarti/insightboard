/**
 * Stage Duration Calculations
 * ===========================
 * Functions to compute average time spent in each stage
 */

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

export interface StageDuration {
  stage: string;
  avgDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  sampleSize: number;
  prediction?: string;
}

/**
 * Compute average duration in each stage
 * Note: This assumes deals progress sequentially through stages
 */
export function computeStageDurations(
  csvData: CSVRow[],
  mappings: FieldMapping[]
): StageDuration[] {
  const createdAtField = mappings.find(m => m.targetField === 'createdAt');
  const updatedAtField = mappings.find(m => m.targetField === 'updatedAt');
  const statusField = mappings.find(m => m.targetField === 'status');
  
  if (!createdAtField || !updatedAtField || !statusField) {
    return [];
  }

  // Group deals by stage and calculate time in stage
  const stageMap = new Map<string, number[]>();
  
  csvData.forEach(row => {
    const createdStr = row[createdAtField.sourceField];
    const updatedStr = row[updatedAtField.sourceField];
    const stage = row[statusField.sourceField];
    
    if (!createdStr || !updatedStr || !stage) return;
    
    const created = parseDate(createdStr);
    const updated = parseDate(updatedStr);
    
    if (!created || !updated) return;
    
    // Calculate days from creation to last update (time in pipeline)
    const daysInPipeline = Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysInPipeline > 0) {
      if (!stageMap.has(stage)) {
        stageMap.set(stage, []);
      }
      stageMap.get(stage)!.push(daysInPipeline);
    }
  });

  // Calculate statistics for each stage
  const durations: StageDuration[] = [];
  
  stageMap.forEach((daysArray, stage) => {
    const sorted = [...daysArray].sort((a, b) => a - b);
    const count = sorted.length;
    
    if (count === 0) return;

    const avgDays = Math.round(daysArray.reduce((a, b) => a + b, 0) / count);
    const medianDays = getMedian(sorted);
    const minDays = sorted[0];
    const maxDays = sorted[count - 1];

    // Generate prediction
    let prediction: string | undefined;
    if (avgDays < 7) {
      prediction = `Deals typically move through ${stage} quickly (${avgDays} days avg)`;
    } else if (avgDays < 30) {
      prediction = `Deals spend about ${avgDays} days in ${stage} on average`;
    } else {
      prediction = `Deals tend to stay in ${stage} for ${avgDays} days - consider reviewing`;
    }

    durations.push({
      stage,
      avgDays,
      medianDays,
      minDays,
      maxDays,
      sampleSize: count,
      prediction,
    });
  });

  // Sort by stage order (if we can determine it)
  return durations.sort((a, b) => {
    // Try to sort by typical pipeline order
    const stageOrder: Record<string, number> = {
      'prospecting': 1,
      'qualification': 2,
      'proposal': 3,
      'negotiation': 4,
      'closed_won': 5,
      'closed won': 5,
    };
    
    const aOrder = stageOrder[a.stage.toLowerCase()] || 99;
    const bOrder = stageOrder[b.stage.toLowerCase()] || 99;
    
    return aOrder - bOrder;
  });
}

/**
 * Compute time-to-close for closed deals
 */
export function computeTimeToClose(
  csvData: CSVRow[],
  mappings: FieldMapping[]
): {
  avgDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  sampleSize: number;
} | null {
  const createdAtField = mappings.find(m => m.targetField === 'createdAt');
  const closedAtField = mappings.find(m => m.targetField === 'closedAt');
  const statusField = mappings.find(m => m.targetField === 'status');
  
  if (!createdAtField || !closedAtField || !statusField) {
    return null;
  }

  // Find closed deals
  const closedDeals = csvData.filter(row => {
    const stage = row[statusField.sourceField] || '';
    return stage.toLowerCase().includes('closed') && stage.toLowerCase().includes('won');
  });

  if (closedDeals.length === 0) return null;

  const cycleTimes: number[] = [];
  
  closedDeals.forEach(row => {
    const createdStr = row[createdAtField.sourceField];
    const closedStr = row[closedAtField.sourceField];
    
    if (!createdStr || !closedStr) return;
    
    const created = parseDate(createdStr);
    const closed = parseDate(closedStr);
    
    if (!created || !closed) return;
    
    const days = Math.round((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 0) {
      cycleTimes.push(days);
    }
  });

  if (cycleTimes.length === 0) return null;

  const sorted = [...cycleTimes].sort((a, b) => a - b);
  const avgDays = Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length);
  const medianDays = getMedian(sorted);

  return {
    avgDays,
    medianDays,
    minDays: sorted[0],
    maxDays: sorted[sorted.length - 1],
    sampleSize: cycleTimes.length,
  };
}

/**
 * Helper: Get median value
 */
function getMedian(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

/**
 * Helper: Parse date string
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  return null;
}

