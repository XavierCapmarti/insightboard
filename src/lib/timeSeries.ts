/**
 * Time Series Data Processing
 * ===========================
 * Functions to compute time series metrics from CSV data
 */

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

interface TimeSeriesPoint {
  date: string;
  count: number;
  value?: number;
}

interface StageTimeSeries {
  stage: string;
  data: TimeSeriesPoint[];
}

/**
 * Group deals by date and stage
 */
export function computeDealVelocity(
  csvData: CSVRow[],
  mappings: FieldMapping[]
): StageTimeSeries[] {
  const createdAtField = mappings.find(m => m.targetField === 'createdAt');
  const statusField = mappings.find(m => m.targetField === 'status');
  
  if (!createdAtField || !statusField) {
    return [];
  }

  // Group by date and stage
  const dateStageMap = new Map<string, Map<string, number>>();
  
  csvData.forEach(row => {
    const dateStr = row[createdAtField.sourceField];
    const stage = row[statusField.sourceField];
    
    if (!dateStr || !stage) return;
    
    // Parse date and normalize to YYYY-MM-DD
    const date = parseDate(dateStr);
    if (!date) return;
    
    const dateKey = formatDateKey(date);
    
    if (!dateStageMap.has(dateKey)) {
      dateStageMap.set(dateKey, new Map());
    }
    
    const stageMap = dateStageMap.get(dateKey)!;
    stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
  });

  // Get all unique stages
  const stages = new Set<string>();
  dateStageMap.forEach(stageMap => {
    stageMap.forEach((_, stage) => stages.add(stage));
  });

  // Convert to time series format
  const timeSeries: StageTimeSeries[] = [];
  const sortedDates = Array.from(dateStageMap.keys()).sort();

  stages.forEach(stage => {
    const data: TimeSeriesPoint[] = sortedDates.map(date => ({
      date,
      count: dateStageMap.get(date)?.get(stage) || 0,
    }));
    
    timeSeries.push({ stage, data });
  });

  return timeSeries;
}

/**
 * Compute stage distribution over time (stacked area chart data)
 */
export function computeStageDistribution(
  csvData: CSVRow[],
  mappings: FieldMapping[],
  groupBy: 'createdAt' | 'updatedAt' = 'createdAt'
): StageTimeSeries[] {
  const dateField = mappings.find(m => m.targetField === groupBy);
  const statusField = mappings.find(m => m.targetField === 'status');
  
  if (!dateField || !statusField) {
    return [];
  }

  // Group by date and stage
  const dateStageMap = new Map<string, Map<string, number>>();
  
  csvData.forEach(row => {
    const dateStr = row[dateField.sourceField];
    const stage = row[statusField.sourceField];
    
    if (!dateStr || !stage) return;
    
    const date = parseDate(dateStr);
    if (!date) return;
    
    const dateKey = formatDateKey(date);
    
    if (!dateStageMap.has(dateKey)) {
      dateStageMap.set(dateKey, new Map());
    }
    
    const stageMap = dateStageMap.get(dateKey)!;
    stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
  });

  // Get all unique stages
  const stages = new Set<string>();
  dateStageMap.forEach(stageMap => {
    stageMap.forEach((_, stage) => stages.add(stage));
  });

  // Convert to time series format
  const timeSeries: StageTimeSeries[] = [];
  const sortedDates = Array.from(dateStageMap.keys()).sort();

  stages.forEach(stage => {
    const data: TimeSeriesPoint[] = sortedDates.map(date => ({
      date,
      count: dateStageMap.get(date)?.get(stage) || 0,
    }));
    
    timeSeries.push({ stage, data });
  });

  return timeSeries;
}

/**
 * Compute win rate trend over time
 */
export function computeWinRateTrend(
  csvData: CSVRow[],
  mappings: FieldMapping[]
): TimeSeriesPoint[] {
  const createdAtField = mappings.find(m => m.targetField === 'createdAt');
  const statusField = mappings.find(m => m.targetField === 'status');
  
  if (!createdAtField || !statusField) {
    return [];
  }

  // Group by month
  const monthMap = new Map<string, { total: number; won: number }>();
  
  csvData.forEach(row => {
    const dateStr = row[createdAtField.sourceField];
    const stage = row[statusField.sourceField];
    
    if (!dateStr) return;
    
    const date = parseDate(dateStr);
    if (!date) return;
    
    const monthKey = formatMonthKey(date);
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { total: 0, won: 0 });
    }
    
    const stats = monthMap.get(monthKey)!;
    stats.total++;
    
    // Check if won (closed_won, closed won, etc.)
    if (stage && stage.toLowerCase().includes('closed') && stage.toLowerCase().includes('won')) {
      stats.won++;
    }
  });

  // Convert to time series
  const sortedMonths = Array.from(monthMap.keys()).sort();
  
  return sortedMonths.map(month => {
    const stats = monthMap.get(month)!;
    return {
      date: month,
      count: stats.total > 0 ? (stats.won / stats.total) * 100 : 0,
    };
  });
}

/**
 * Helper: Parse date string to Date object
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Try ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;
  
  // Try common formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // YYYY-MM-DD
        return new Date(`${match[1]}-${match[2]}-${match[3]}`);
      } else {
        // MM/DD/YYYY or MM-DD-YYYY
        return new Date(`${match[3]}-${match[2]}-${match[1]}`);
      }
    }
  }
  
  return null;
}

/**
 * Helper: Format date as YYYY-MM-DD key
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper: Format date as YYYY-MM (month key)
 */
function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}


