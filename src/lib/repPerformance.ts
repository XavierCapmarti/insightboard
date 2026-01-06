/**
 * Rep Performance Calculations
 * =============================
 * Functions to compute rep/owner performance metrics
 */

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

export interface RepMetrics {
  ownerId: string;
  totalDeals: number;
  closedWon: number;
  conversionRate: number;
  totalValue: number;
  avgDealSize: number;
  avgCycleTime: number | null;
}

/**
 * Compute rep performance metrics
 */
export function computeRepPerformance(
  csvData: CSVRow[],
  mappings: FieldMapping[]
): RepMetrics[] {
  const ownerField = mappings.find(m => m.targetField === 'ownerId');
  const statusField = mappings.find(m => m.targetField === 'status');
  const valueField = mappings.find(m => m.targetField === 'value');
  const createdAtField = mappings.find(m => m.targetField === 'createdAt');
  const closedAtField = mappings.find(m => m.targetField === 'closedAt');

  if (!ownerField || !statusField) {
    return [];
  }

  // Group by owner
  const repMap = new Map<string, {
    totalDeals: number;
    closedWon: number;
    totalValue: number;
    cycleTimes: number[];
  }>();

  csvData.forEach(row => {
    const owner = row[ownerField.sourceField] || 'unassigned';
    const status = row[statusField.sourceField] || '';
    const value = valueField ? parseFloat(row[valueField.sourceField] || '0') : 0;
    
    if (!repMap.has(owner)) {
      repMap.set(owner, {
        totalDeals: 0,
        closedWon: 0,
        totalValue: 0,
        cycleTimes: [],
      });
    }

    const rep = repMap.get(owner)!;
    rep.totalDeals++;
    rep.totalValue += value;

    // Check if closed won
    if (status.toLowerCase().includes('closed') && status.toLowerCase().includes('won')) {
      rep.closedWon++;
      
      // Calculate cycle time if dates available
      if (createdAtField && closedAtField) {
        const created = parseDate(row[createdAtField.sourceField]);
        const closed = parseDate(row[closedAtField.sourceField]);
        
        if (created && closed) {
          const days = Math.round((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          if (days > 0) {
            rep.cycleTimes.push(days);
          }
        }
      }
    }
  });

  // Convert to metrics array
  const metrics: RepMetrics[] = Array.from(repMap.entries()).map(([ownerId, stats]) => {
    const avgCycleTime = stats.cycleTimes.length > 0
      ? Math.round(stats.cycleTimes.reduce((a, b) => a + b, 0) / stats.cycleTimes.length)
      : null;

    return {
      ownerId,
      totalDeals: stats.totalDeals,
      closedWon: stats.closedWon,
      conversionRate: stats.totalDeals > 0 ? (stats.closedWon / stats.totalDeals) * 100 : 0,
      totalValue: stats.totalValue,
      avgDealSize: stats.totalDeals > 0 ? stats.totalValue / stats.totalDeals : 0,
      avgCycleTime,
    };
  });

  return metrics.sort((a, b) => b.closedWon - a.closedWon);
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

