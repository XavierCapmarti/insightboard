'use client';

import { useState, useEffect } from 'react';
import { Filter, X, Calendar, User, Tag, DollarSign } from 'lucide-react';
import { FilterState, getFilterOptions } from '@/lib/filters';

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

interface DashboardFiltersProps {
  csvData: CSVRow[];
  mappings: FieldMapping[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function DashboardFilters({
  csvData,
  mappings,
  filters,
  onFiltersChange,
}: DashboardFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const options = getFilterOptions(csvData, mappings);
  const activeFilterCount = getActiveFilterCount(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    const cleared: FilterState = {};
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setIsOpen(false);
  };

  const hasDateField = mappings.some(m => 
    ['createdAt', 'updatedAt', 'closedAt'].includes(m.targetField)
  );
  const hasOwnerField = mappings.some(m => m.targetField === 'ownerId');
  const hasStageField = mappings.some(m => m.targetField === 'status');
  const hasValueField = mappings.some(m => m.targetField === 'value');

  return (
    <div className="mb-6">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border border-brand-600/20 rounded-lg hover:bg-surface-tertiary transition-colors"
      >
        <Filter className="w-4 h-4 text-text-primary" />
        <span className="text-sm font-medium text-text-primary">Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 bg-brand-950 text-surface text-xs font-bold rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="mt-4 bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-text-primary">Filter Data</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-tertiary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Range Filter */}
            {hasDateField && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </label>
                <div className="space-y-2">
                  <select
                    value={localFilters.dateRange?.field || 'createdAt'}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      dateRange: {
                        ...localFilters.dateRange,
                        field: e.target.value as 'createdAt' | 'updatedAt' | 'closedAt',
                      },
                    })}
                    className="w-full px-3 py-2 bg-surface-tertiary border border-surface-tertiary rounded-lg text-text-primary text-sm"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                    <option value="closedAt">Closed Date</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={localFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        dateRange: {
                          ...localFilters.dateRange,
                          field: localFilters.dateRange?.field || 'createdAt',
                          start: e.target.value ? new Date(e.target.value) : undefined,
                        },
                      })}
                      className="px-3 py-2 bg-surface-tertiary border border-surface-tertiary rounded-lg text-text-primary text-sm"
                      placeholder="Start date"
                    />
                    <input
                      type="date"
                      value={localFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        dateRange: {
                          ...localFilters.dateRange,
                          field: localFilters.dateRange?.field || 'createdAt',
                          end: e.target.value ? new Date(e.target.value) : undefined,
                        },
                      })}
                      className="px-3 py-2 bg-surface-tertiary border border-surface-tertiary rounded-lg text-text-primary text-sm"
                      placeholder="End date"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Owner Filter */}
            {hasOwnerField && options.owners.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                  <User className="w-4 h-4" />
                  Owners ({options.owners.length})
                </label>
                <select
                  multiple
                  value={localFilters.owners || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setLocalFilters({
                      ...localFilters,
                      owners: selected.length > 0 ? selected : undefined,
                    });
                  }}
                  className="w-full px-3 py-2 bg-surface-tertiary border border-surface-tertiary rounded-lg text-text-primary text-sm min-h-[100px]"
                  size={5}
                >
                  {options.owners.map(owner => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-tertiary mt-1">Hold Cmd/Ctrl to select multiple</p>
              </div>
            )}

            {/* Stage Filter */}
            {hasStageField && options.stages.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                  <Tag className="w-4 h-4" />
                  Stages ({options.stages.length})
                </label>
                <select
                  multiple
                  value={localFilters.stages || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setLocalFilters({
                      ...localFilters,
                      stages: selected.length > 0 ? selected : undefined,
                    });
                  }}
                  className="w-full px-3 py-2 bg-surface-tertiary border border-surface-tertiary rounded-lg text-text-primary text-sm min-h-[100px]"
                  size={5}
                >
                  {options.stages.map(stage => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-tertiary mt-1">Hold Cmd/Ctrl to select multiple</p>
              </div>
            )}

            {/* Value Range Filter */}
            {hasValueField && options.valueRange.max > 0 && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                  <DollarSign className="w-4 h-4" />
                  Deal Value Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={localFilters.valueRange?.min || ''}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      valueRange: {
                        ...localFilters.valueRange,
                        min: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })}
                    placeholder={`Min (${formatValue(options.valueRange.min)})`}
                    className="px-3 py-2 bg-surface-tertiary border border-surface-tertiary rounded-lg text-text-primary text-sm"
                  />
                  <input
                    type="number"
                    value={localFilters.valueRange?.max || ''}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      valueRange: {
                        ...localFilters.valueRange,
                        max: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })}
                    placeholder={`Max (${formatValue(options.valueRange.max)})`}
                    className="px-3 py-2 bg-surface-tertiary border border-surface-tertiary rounded-lg text-text-primary text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-surface-tertiary">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getActiveFilterCount(filters: FilterState): number {
  let count = 0;
  if (filters.dateRange?.start || filters.dateRange?.end) count++;
  if (filters.owners && filters.owners.length > 0) count++;
  if (filters.stages && filters.stages.length > 0) count++;
  if (filters.valueRange?.min || filters.valueRange?.max) count++;
  return count;
}

function formatValue(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

