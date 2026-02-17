'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DollarSign, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { 
  computeDealSizeDistribution, 
  computeDealSizeByStage, 
  identifyHighValueDeals 
} from '@/lib/dealQuality';

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

interface DealQualityChartProps {
  csvData: CSVRow[];
  mappings: FieldMapping[];
}

export function DealQualityChart({ csvData, mappings }: DealQualityChartProps) {
  const [threshold, setThreshold] = useState<number | undefined>(undefined);

  const distribution = useMemo(() => 
    computeDealSizeDistribution(csvData, mappings),
    [csvData, mappings]
  );

  const stageStats = useMemo(() => 
    computeDealSizeByStage(csvData, mappings),
    [csvData, mappings]
  );

  const highValueDeals = useMemo(() => 
    identifyHighValueDeals(csvData, mappings, threshold),
    [csvData, mappings, threshold]
  );

  const totalHighValue = useMemo(() => 
    highValueDeals.reduce((sum, deal) => sum + deal.value, 0),
    [highValueDeals]
  );

  if (csvData.length === 0) {
    return (
      <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-brand-950" />
          <h3 className="font-semibold text-text-primary">Deal Quality Metrics</h3>
        </div>
        <p className="text-sm text-text-tertiary">No data available.</p>
      </div>
    );
  }

  const hasValueField = mappings.some(m => m.targetField === 'value');
  if (!hasValueField) {
    return (
      <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-brand-950" />
          <h3 className="font-semibold text-text-primary">Deal Quality Metrics</h3>
        </div>
        <p className="text-sm text-text-tertiary">No value field mapped. Map a value field to see deal quality metrics.</p>
      </div>
    );
  }

  // Prepare box plot data (simplified - showing min, q1, median, q3, max)
  const boxPlotData = stageStats.map(stat => ({
    stage: stat.stage,
    min: stat.min,
    q1: stat.q1,
    median: stat.median,
    q3: stat.q3,
    max: stat.max,
    avg: stat.avg,
    count: stat.count,
  }));

  return (
    <div className="space-y-6">
      {/* Deal Size Distribution Histogram */}
      <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-5 h-5 text-brand-950" />
          <h3 className="font-semibold text-text-primary">Deal Size Distribution</h3>
        </div>
        
        {distribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="range" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
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
                formatter={(value: number) => [`${value} deals`, 'Count']}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.percentage > 20 ? '#10b981' : '#6a6a6a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-text-tertiary">No deal value data available.</p>
        )}
      </div>

      {/* Deal Size by Stage */}
      <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-brand-950" />
          <h3 className="font-semibold text-text-primary">Deal Size by Stage</h3>
        </div>
        
        {boxPlotData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={boxPlotData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="stage" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
                label={{ value: 'Deal Value ($)', angle: -90, position: 'insideLeft', fill: '#888' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'avg') return [`$${value.toLocaleString()}`, 'Average'];
                  return [`$${value.toLocaleString()}`, name];
                }}
              />
              <Legend />
              <Bar dataKey="min" fill="#4a4a4a" name="Min" />
              <Bar dataKey="q1" fill="#6a6a6a" name="Q1" />
              <Bar dataKey="median" fill="#10b981" name="Median" />
              <Bar dataKey="q3" fill="#8a8a8a" name="Q3" />
              <Bar dataKey="max" fill="#aaaaaa" name="Max" />
              <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2} name="Average" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-text-tertiary">No stage data available.</p>
        )}
      </div>

      {/* High-Value Deals */}
      <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-brand-950" />
            <h3 className="font-semibold text-text-primary">High-Value Deals</h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-tertiary">Threshold:</label>
            <input
              type="number"
              value={threshold || ''}
              onChange={(e) => setThreshold(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Auto (90th %ile)"
              className="w-32 px-2 py-1 bg-surface-tertiary border border-surface-tertiary rounded text-text-primary text-sm"
            />
          </div>
        </div>

        {highValueDeals.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-surface-tertiary/50 rounded-lg p-4">
                <p className="text-xs text-text-tertiary mb-1">High-Value Deals</p>
                <p className="text-2xl font-bold text-text-primary">{highValueDeals.length}</p>
              </div>
              <div className="bg-surface-tertiary/50 rounded-lg p-4">
                <p className="text-xs text-text-tertiary mb-1">Total Value</p>
                <p className="text-2xl font-bold text-text-primary">
                  ${(totalHighValue / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="bg-surface-tertiary/50 rounded-lg p-4">
                <p className="text-xs text-text-tertiary mb-1">Avg Deal Size</p>
                <p className="text-2xl font-bold text-text-primary">
                  ${(totalHighValue / highValueDeals.length / 1000).toFixed(0)}k
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {highValueDeals.slice(0, 10).map((deal, index) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 bg-surface-tertiary/50 rounded-lg border border-surface-tertiary"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-950/20 flex items-center justify-center text-xs font-bold text-brand-950">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{deal.ownerId}</p>
                      <p className="text-xs text-text-tertiary">{deal.stage}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-text-primary">
                      ${(deal.value / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-text-tertiary">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">No high-value deals found. Try lowering the threshold.</p>
          </div>
        )}
      </div>
    </div>
  );
}


