/**
 * Filter Utilities
 * ================
 * Functions to filter CSV data based on various criteria
 */

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

export interface FilterState {
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'closedAt';
    start?: Date;
    end?: Date;
  };
  owners?: string[];
  stages?: string[];
  valueRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Apply filters to CSV data
 */
export function applyFilters(
  csvData: CSVRow[],
  mappings: FieldMapping[],
  filters: FilterState
): CSVRow[] {
  let filtered = [...csvData];

  // Date range filter
  if (filters.dateRange) {
    const dateField = mappings.find(m => m.targetField === filters.dateRange!.field);
    if (dateField) {
      filtered = filtered.filter(row => {
        const dateStr = row[dateField.sourceField];
        if (!dateStr) return false;
        
        const date = parseDate(dateStr);
        if (!date) return false;

        if (filters.dateRange!.start && date < filters.dateRange!.start) return false;
        if (filters.dateRange!.end && date > filters.dateRange!.end) return false;
        
        return true;
      });
    }
  }

  // Owner filter
  if (filters.owners && filters.owners.length > 0) {
    const ownerField = mappings.find(m => m.targetField === 'ownerId');
    if (ownerField) {
      filtered = filtered.filter(row => {
        const owner = row[ownerField.sourceField] || '';
        return filters.owners!.includes(owner);
      });
    }
  }

  // Stage filter
  if (filters.stages && filters.stages.length > 0) {
    const statusField = mappings.find(m => m.targetField === 'status');
    if (statusField) {
      filtered = filtered.filter(row => {
        const stage = row[statusField.sourceField] || '';
        return filters.stages!.includes(stage);
      });
    }
  }

  // Value range filter
  if (filters.valueRange) {
    const valueField = mappings.find(m => m.targetField === 'value');
    if (valueField) {
      filtered = filtered.filter(row => {
        const value = parseFloat(row[valueField.sourceField] || '0');
        
        if (filters.valueRange!.min !== undefined && value < filters.valueRange!.min) {
          return false;
        }
        if (filters.valueRange!.max !== undefined && value > filters.valueRange!.max) {
          return false;
        }
        
        return true;
      });
    }
  }

  return filtered;
}

/**
 * Get available filter options from data
 */
export function getFilterOptions(
  csvData: CSVRow[],
  mappings: FieldMapping[]
): {
  owners: string[];
  stages: string[];
  valueRange: { min: number; max: number };
} {
  const ownerField = mappings.find(m => m.targetField === 'ownerId');
  const statusField = mappings.find(m => m.targetField === 'status');
  const valueField = mappings.find(m => m.targetField === 'value');

  const owners = new Set<string>();
  const stages = new Set<string>();
  const values: number[] = [];

  csvData.forEach(row => {
    if (ownerField) {
      const owner = row[ownerField.sourceField];
      if (owner) owners.add(owner);
    }
    if (statusField) {
      const stage = row[statusField.sourceField];
      if (stage) stages.add(stage);
    }
    if (valueField) {
      const value = parseFloat(row[valueField.sourceField] || '0');
      if (value > 0) values.push(value);
    }
  });

  return {
    owners: Array.from(owners).sort(),
    stages: Array.from(stages).sort(),
    valueRange: {
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
    },
  };
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


