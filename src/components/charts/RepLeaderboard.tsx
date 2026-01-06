'use client';

import { useMemo } from 'react';
import { Trophy, TrendingUp, DollarSign, Clock, User } from 'lucide-react';
import { computeRepPerformance, RepMetrics } from '@/lib/repPerformance';

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

interface RepLeaderboardProps {
  csvData: CSVRow[];
  mappings: FieldMapping[];
  sortBy?: 'closedWon' | 'conversionRate' | 'totalValue' | 'avgDealSize';
  limit?: number;
}

export function RepLeaderboard({ 
  csvData, 
  mappings, 
  sortBy = 'closedWon',
  limit = 10 
}: RepLeaderboardProps) {
  const metrics = useMemo(() => {
    const allMetrics = computeRepPerformance(csvData, mappings);
    
    // Sort by selected metric
    const sorted = [...allMetrics].sort((a, b) => {
      switch (sortBy) {
        case 'conversionRate':
          return b.conversionRate - a.conversionRate;
        case 'totalValue':
          return b.totalValue - a.totalValue;
        case 'avgDealSize':
          return b.avgDealSize - a.avgDealSize;
        default:
          return b.closedWon - a.closedWon;
      }
    });
    
    return sorted.slice(0, limit);
  }, [csvData, mappings, sortBy, limit]);

  if (metrics.length === 0) {
    return (
      <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-5 h-5 text-brand-950" />
          <h3 className="font-semibold text-text-primary">Rep Performance Leaderboard</h3>
        </div>
        <p className="text-sm text-text-tertiary">No rep data available. Make sure your CSV includes owner/rep fields.</p>
      </div>
    );
  }

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#10b981'; // Gold
    if (rank === 2) return '#8b5cf6'; // Silver
    if (rank === 3) return '#f59e0b'; // Bronze
    return '#6a6a6a';
  };

  return (
    <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-brand-950" />
          <h3 className="font-semibold text-text-primary">Rep Performance Leaderboard</h3>
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map((rep, index) => {
          const rank = index + 1;
          return (
            <div
              key={rep.ownerId}
              className="flex items-center gap-4 p-4 bg-surface-tertiary/50 rounded-lg border border-surface-tertiary hover:bg-surface-tertiary transition-colors"
            >
              {/* Rank */}
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: getRankColor(rank) + '20', color: getRankColor(rank) }}
              >
                {rank}
              </div>

              {/* Rep Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-text-tertiary" />
                  <p className="font-medium text-text-primary truncate">{rep.ownerId}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-tertiary">
                  <span>{rep.totalDeals} deals</span>
                  {rep.avgCycleTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rep.avgCycleTime} days avg
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4 text-right">
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Closed Won</p>
                  <p className="text-lg font-bold text-text-primary">{rep.closedWon}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Conversion</p>
                  <p className="text-lg font-bold text-text-primary">{rep.conversionRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Total Value</p>
                  <p className="text-lg font-bold text-text-primary">
                    ${(rep.totalValue / 1000).toFixed(1)}k
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Avg Deal</p>
                  <p className="text-lg font-bold text-text-primary">
                    ${(rep.avgDealSize / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

