'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import { RepLeaderboard } from '@/components/charts/RepLeaderboard';
import { DealQualityChart } from '@/components/charts/DealQualityChart';
import { StageDurationChart } from '@/components/charts/StageDurationChart';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { FilterState, applyFilters } from '@/lib/filters';

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

export default function DashboardPage() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [period, setPeriod] = useState<'30' | '90'>('90');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({});
  
  // Apply filters to data
  const filteredData = applyFilters(csvData, mappings, filters);

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('clarLensCSVData');
    const storedMappings = sessionStorage.getItem('clarLensMappings');
    
    if (storedData && storedMappings) {
      setCsvData(JSON.parse(storedData));
      setMappings(JSON.parse(storedMappings));
    }
    setIsLoading(false);
  }, []);

  const getFieldValue = (row: CSVRow, targetField: string): string => {
    const mapping = mappings.find(m => m.targetField === targetField);
    return mapping ? row[mapping.sourceField] || '' : '';
  };

  const computeFunnel = (data: CSVRow[] = filteredData): FunnelStage[] => {
    const statusField = mappings.find(m => m.targetField === 'status');
    if (!statusField) return [];

    const stageCounts: Record<string, number> = {};
    data.forEach(row => {
      const stage = row[statusField.sourceField];
      if (stage) {
        // Normalize stage names (handle variations like closed_won vs closed won)
        const normalizedStage = stage.toLowerCase().trim().replace(/\s+/g, '_');
        stageCounts[normalizedStage] = (stageCounts[normalizedStage] || 0) + 1;
      }
    });

    // Define stage order (common pipeline stages)
    const stageOrder = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'];
    const orderedStages = stageOrder.filter(s => stageCounts[s] > 0);
    
    // Calculate total deals (all stages combined)
    const totalDeals = data.length;
    if (totalDeals === 0) return [];
    
    const funnel: FunnelStage[] = [];
    orderedStages.forEach((stage, index) => {
      const count = stageCounts[stage];
      
      // For snapshot data: calculate cumulative conversion
      // Assume all deals started at first stage and progressed sequentially
      // Conversion rate: % of total deals that reached this stage or later
      const reachedThisStageOrLater = orderedStages.slice(index).reduce((sum, s) => sum + stageCounts[s], 0);
      const conversionRate = totalDeals > 0 ? (reachedThisStageOrLater / totalDeals) * 100 : 0;
      
      // Drop-off rate: % of deals that reached previous stage but didn't reach this stage
      if (index === 0) {
        // First stage: all deals start here
        funnel.push({
          stage: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count,
          conversionRate: 100, // All deals start here
          dropoffRate: 0,
        });
      } else {
        // Calculate how many deals reached the previous stage
        const prevStageReached = orderedStages.slice(index - 1).reduce((sum, s) => sum + stageCounts[s], 0);
        // Drop-off = deals that reached previous stage but didn't reach this stage
        const dropoffRate = prevStageReached > 0 
          ? ((prevStageReached - reachedThisStageOrLater) / prevStageReached) * 100 
          : 0;
        
        funnel.push({
          stage: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count,
          conversionRate,
          dropoffRate,
        });
      }
    });

    return funnel;
  };

  const computeTotalValue = (data: CSVRow[] = filteredData): number => {
    const valueField = mappings.find(m => m.targetField === 'value');
    if (!valueField) return 0;
    
    return data.reduce((sum, row) => {
      const val = parseFloat(row[valueField.sourceField] || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const computeAvgCycleTime = (data: CSVRow[] = filteredData): number | null => {
    const createdAtField = mappings.find(m => m.targetField === 'createdAt');
    const closedAtField = mappings.find(m => m.targetField === 'closedAt');
    
    if (!createdAtField || !closedAtField) return null;
    
    const closedRecords = data.filter(row => {
      const closed = row[closedAtField.sourceField];
      return closed && closed.trim() !== '';
    });
    
    if (closedRecords.length === 0) return null;
    
    const totalDays = closedRecords.reduce((sum, row) => {
      const created = new Date(row[createdAtField.sourceField]);
      const closed = new Date(row[closedAtField.sourceField]);
      if (!isNaN(created.getTime()) && !isNaN(closed.getTime())) {
        const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }
      return sum;
    }, 0);
    
    return Math.round(totalDays / closedRecords.length);
  };

  const getMagicInsight = (): string => {
    const funnel = computeFunnel();
    if (funnel.length < 2) return '';

    // Find biggest drop-off
    let maxDropoff = 0;
    let maxDropoffStage = '';
    for (let i = 1; i < funnel.length; i++) {
      if (funnel[i].dropoffRate > maxDropoff) {
        maxDropoff = funnel[i].dropoffRate;
        maxDropoffStage = `${funnel[i - 1].stage} → ${funnel[i].stage}`;
      }
    }

    if (maxDropoff > 0) {
      return `Biggest drop-off is ${Math.round(maxDropoff)}% between ${maxDropoffStage}`;
    }

    return '';
  };

  const funnel = computeFunnel();
  const totalValue = computeTotalValue();
  const avgCycleTime = computeAvgCycleTime();
  const totalRecords = filteredData.length;
  // Overall conversion rate: % of deals that reached the final stage (closed_won)
  const closedWonStage = funnel.find(s => s.stage.toLowerCase().includes('closed won') || s.stage.toLowerCase().includes('closed_won'));
  const conversionRate = closedWonStage 
    ? ((closedWonStage.count / totalRecords) * 100).toFixed(1)
    : funnel.length > 0 
      ? ((funnel[funnel.length - 1].count / totalRecords) * 100).toFixed(1)
      : '0';
  const magicInsight = getMagicInsight();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-brand-950 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (csvData.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center max-w-md">
          <BarChart3 className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">No data loaded</h2>
          <p className="text-text-secondary mb-6">
            Upload a CSV file to generate insights.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-colors"
          >
            Upload CSV
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-surface-tertiary bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-950 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-surface" />
            </div>
            <span className="font-semibold text-lg text-text-primary">ClarLens</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-tertiary rounded-lg border border-surface-tertiary">
              <Calendar className="w-4 h-4 text-text-tertiary" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as '30' | '90')}
                className="bg-transparent text-text-primary text-sm border-none outline-none cursor-pointer"
              >
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            <Link
              href="/onboarding"
              className="px-4 py-2 bg-surface-tertiary text-text-primary text-sm font-medium rounded-lg hover:bg-surface-secondary transition-colors border border-surface-tertiary"
            >
              Upload New CSV
            </Link>
          </div>
        </div>
      </header>

      {/* Magic Insight */}
      {magicInsight && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-surface-secondary border border-brand-600/30 rounded-lg p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-950 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">{magicInsight}</p>
              <p className="text-sm text-text-tertiary mt-1">
                Based on analysis of {totalRecords} records
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <DashboardFilters
          csvData={csvData}
          mappings={mappings}
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-brand-950" />
            </div>
            <p className="text-sm text-text-tertiary mb-1">Total Records</p>
            <p className="text-2xl font-bold text-text-primary">{totalRecords.toLocaleString()}</p>
          </div>
          
          <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-brand-950" />
            </div>
            <p className="text-sm text-text-tertiary mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold text-text-primary">{conversionRate}%</p>
          </div>
          
          {totalValue > 0 && (
            <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-brand-950" />
              </div>
              <p className="text-sm text-text-tertiary mb-1">Total Value</p>
              <p className="text-2xl font-bold text-text-primary">
                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
          
          {avgCycleTime !== null && (
            <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-brand-950" />
              </div>
              <p className="text-sm text-text-tertiary mb-1">Avg Cycle Time</p>
              <p className="text-2xl font-bold text-text-primary">{avgCycleTime} days</p>
            </div>
          )}
        </div>

        {/* Funnel Chart */}
        <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6 mb-8">
          <h3 className="font-semibold text-text-primary mb-6">Pipeline Funnel</h3>
          <div className="space-y-3">
            {funnel.map((stage, index) => {
              // For funnel visualization, show cumulative count (deals that reached this stage or later)
              const cumulativeCount = funnel.slice(index).reduce((sum, s) => sum + s.count, 0);
              const width = (cumulativeCount / totalRecords) * 100;
              const isLast = index === funnel.length - 1;
              // Gradient colors from dark to light as deals progress
              const colors = ['#4a4a4a', '#5a5a5a', '#6a6a6a', '#7a7a7a', '#8a8a8a'];
              
              return (
                <div key={stage.stage} className="flex items-center gap-4">
                  <div className="w-36 text-sm text-text-secondary font-medium">{stage.stage}</div>
                  <div className="flex-1 relative">
                    <div className="h-12 bg-surface-tertiary rounded-lg overflow-hidden relative">
                      <div 
                        className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ 
                          width: `${width}%`,
                          backgroundColor: isLast ? '#10b981' : colors[Math.min(index, colors.length - 1)],
                        }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {cumulativeCount}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-sm font-semibold text-text-primary">
                      {stage.count}
                    </div>
                    {index > 0 && (
                      <div className="text-xs text-text-tertiary">
                        {stage.conversionRate.toFixed(1)}% conversion
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Series Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TimeSeriesChart 
            csvData={filteredData} 
            mappings={mappings} 
            type="velocity" 
          />
          <TimeSeriesChart 
            csvData={filteredData} 
            mappings={mappings} 
            type="winRate" 
          />
        </div>
        <div className="mb-8">
          <TimeSeriesChart 
            csvData={filteredData} 
            mappings={mappings} 
            type="distribution" 
          />
        </div>

        {/* Stage Duration Predictions */}
        <div className="mb-8">
          <StageDurationChart 
            csvData={filteredData} 
            mappings={mappings} 
          />
        </div>

        {/* Stage Details Table */}
        <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
          <h3 className="font-semibold text-text-primary mb-4">Stage Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-tertiary border-b border-surface-tertiary">
                  <th className="pb-2 pr-4">Stage</th>
                  <th className="pb-2 pr-4 text-right">Count</th>
                  <th className="pb-2 pr-4 text-right">Conversion Rate</th>
                  <th className="pb-2 pr-4 text-right">Drop-off Rate</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {funnel.map((stage, index) => (
                  <tr key={stage.stage} className="border-b border-surface-tertiary">
                    <td className="py-3 pr-4 font-medium text-text-primary">{stage.stage}</td>
                    <td className="py-3 pr-4 text-right">{stage.count}</td>
                    <td className="py-3 pr-4 text-right">
                      {index > 0 ? `${stage.conversionRate.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {index > 0 ? `${stage.dropoffRate.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rep Performance */}
        {filteredData.length > 0 && mappings.some(m => m.targetField === 'ownerId') && (
          <div className="mb-8">
            <RepLeaderboard 
              csvData={filteredData} 
              mappings={mappings} 
              sortBy="closedWon"
              limit={10}
            />
          </div>
        )}

        {/* Deal Quality Metrics */}
        {filteredData.length > 0 && mappings.some(m => m.targetField === 'value') && (
          <div className="mb-8">
            <DealQualityChart 
              csvData={filteredData} 
              mappings={mappings} 
            />
          </div>
        )}
      </main>
    </div>
  );
}
