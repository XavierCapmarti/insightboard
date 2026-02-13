'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { computeDealVelocity, computeStageDistribution, computeWinRateTrend } from '@/lib/timeSeries';

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

interface TimeSeriesChartProps {
  csvData: CSVRow[];
  mappings: FieldMapping[];
  type: 'velocity' | 'distribution' | 'winRate';
}

export function TimeSeriesChart({ csvData, mappings, type }: TimeSeriesChartProps) {
  const chartData = useMemo(() => {
    if (csvData.length === 0) return [];

    switch (type) {
      case 'velocity':
        return computeDealVelocity(csvData, mappings);
      case 'distribution':
        return computeStageDistribution(csvData, mappings);
      case 'winRate':
        return computeWinRateTrend(csvData, mappings);
      default:
        return [];
    }
  }, [csvData, mappings, type]);

  // Transform data for Recharts — must be before any early return
  const transformedData = useMemo(() => {
    if (chartData.length === 0) return [];

    if (type === 'winRate') {
      return (chartData as any[]).map(point => ({
        date: point.date,
        'Win Rate %': point.count,
      }));
    }

    const dateMap = new Map<string, Record<string, number>>();

    chartData.forEach((series: any) => {
      series.data.forEach((point: any) => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        dateMap.get(point.date)![series.stage] = point.count;
      });
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      String(a.date || '').localeCompare(String(b.date || ''))
    );
  }, [chartData, type]);

  // Get all unique stages for legend — must be before any early return
  const stages = useMemo(() => {
    if (type === 'winRate' || chartData.length === 0) return [];
    const stageSet = new Set<string>();
    chartData.forEach((series: any) => {
      stageSet.add(series.stage);
    });
    return Array.from(stageSet);
  }, [chartData, type]);

  // Generate colors for stages
  const stageColors: Record<string, string> = {
    'prospecting': '#6a6a6a',
    'qualification': '#7a7a7a',
    'proposal': '#8a8a8a',
    'negotiation': '#9a9a9a',
    'closed_won': '#10b981',
    'closed won': '#10b981',
  };

  const getStageColor = (stage: string): string => {
    return stageColors[stage.toLowerCase()] || '#aaaaaa';
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-950" />
          <h3 className="font-semibold text-text-primary">
            {type === 'velocity' && 'Deal Velocity Over Time'}
            {type === 'distribution' && 'Stage Distribution Over Time'}
            {type === 'winRate' && 'Win Rate Trend'}
          </h3>
        </div>
        <p className="text-sm text-text-tertiary">No time series data available. Make sure your CSV includes date fields.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-brand-950" />
        <h3 className="font-semibold text-text-primary">
          {type === 'velocity' && 'Deal Velocity Over Time'}
          {type === 'distribution' && 'Stage Distribution Over Time'}
          {type === 'winRate' && 'Win Rate Trend'}
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {type === 'distribution' ? (
          <AreaChart data={transformedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#888"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <YAxis 
              stroke="#888"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            {stages.map(stage => (
              <Area
                key={stage}
                type="monotone"
                dataKey={stage}
                stackId="1"
                stroke={getStageColor(stage)}
                fill={getStageColor(stage)}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={transformedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#888"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <YAxis 
              stroke="#888"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            {type === 'winRate' ? (
              <Line
                type="monotone"
                dataKey="Win Rate %"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            ) : (
              stages.map(stage => (
                <Line
                  key={stage}
                  type="monotone"
                  dataKey={stage}
                  stroke={getStageColor(stage)}
                  strokeWidth={2}
                  dot={{ fill: getStageColor(stage), r: 4 }}
                />
              ))
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

