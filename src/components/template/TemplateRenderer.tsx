'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Layers } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';


interface DashboardTemplate {
  id: string;
  name: string;
  sections: Array<{
    id: string;
    title: string;
    widgets: Array<{
      id: string;
      type: string;
      title: string;
      position: { x: number; y: number; width: number; height: number };
      config: Record<string, unknown>;
    }>;
  }>;
}

interface Metrics {
  total_pipeline: { value: number; formattedValue: string };
  overall_conversion: { value: number; formattedValue: string };
  avg_cycle_time: { value: number | null; formattedValue: string };
  biggest_dropoff: { value: number; formattedValue: string };
  funnel_stages: Array<{
    stage: string;
    count: number;
    percentage: number;
    conversionToNext: number | null;
    dropOff: number | null;
    avgTimeInStage: number | null;
  }>;
  stage_conversions: Array<{
    stage: string;
    conversionRate: number;
  }>;
}

interface TemplateRendererProps {
  template: DashboardTemplate;
  datasetId: string;
}

export function TemplateRenderer({ template, datasetId }: TemplateRendererProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/dataset/${datasetId}/metrics?period=month`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch metrics (${response.status})`);
      }
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load metrics';
      console.error('Metrics fetch error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [datasetId]);
  
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-brand-950 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Error</h2>
          <p className="text-text-secondary">{error || 'Failed to load metrics'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {template.sections.map((section) => (
          <div key={section.id} className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{section.title}</h2>
            
            <div className="grid grid-cols-12 gap-4">
              {section.widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6"
                  style={{
                    gridColumn: `span ${widget.position.width}`,
                  }}
                >
                  <h3 className="font-semibold text-text-primary mb-4">{widget.title}</h3>
                  {renderWidget(widget, metrics)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderWidget(
  widget: {
    id: string;
    type: string;
    title: string;
    position: { x: number; y: number; width: number; height: number };
    config: Record<string, unknown>;
  },
  metrics: Metrics
) {
  const { type, config } = widget;

  switch (type) {
    case 'kpi_card':
      return renderKPICard(config, metrics);
    case 'funnel_chart':
      return renderFunnelChart(config, metrics);
    case 'bar_chart':
      return renderBarChart(config, metrics);
    case 'table':
      return renderTable(config, metrics);
    default:
      return <p className="text-text-tertiary">Widget type &quot;{type}&quot; not implemented</p>;
  }
}

function renderKPICard(config: Record<string, unknown>, metrics: Metrics) {
  const metricId = config.metricId as string;
  const icon = config.icon as string;
  const color = (config.color as string) || '#3B82F6';

  const metric = metrics[metricId as keyof Metrics];
  if (!metric || Array.isArray(metric) || typeof metric !== 'object' || !('formattedValue' in metric)) {
    return <p className="text-text-tertiary">Metric not found: {metricId}</p>;
  }

  const IconComponent = getIcon(icon);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {IconComponent && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <IconComponent className="w-5 h-5" style={{ color }} />
          </div>
        )}
        <div>
          <p className="text-3xl font-bold text-text-primary">{metric.formattedValue}</p>
        </div>
      </div>
    </div>
  );
}

function renderFunnelChart(config: Record<string, unknown>, metrics: Metrics) {
  const stages = metrics.funnel_stages || [];
  
  if (stages.length === 0) {
    return <p className="text-text-tertiary">No funnel data available</p>;
  }

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const width = (stage.count / maxCount) * 100;
        const isLast = index === stages.length - 1;
        
        return (
          <div key={stage.stage} className="flex items-center gap-4">
            <div className="w-32 text-sm text-text-secondary font-medium">{stage.stage}</div>
            <div className="flex-1 relative">
              <div className="h-10 bg-surface-tertiary rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                  style={{
                    width: `${width}%`,
                    backgroundColor: isLast ? '#10b981' : '#6a6a6a',
                  }}
                >
                  <span className="text-xs font-semibold text-white">{stage.count}</span>
                </div>
              </div>
            </div>
            <div className="w-20 text-right">
              <div className="text-sm font-semibold text-text-primary">
                {stage.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderBarChart(config: Record<string, unknown>, metrics: Metrics) {
  const conversions = metrics.stage_conversions || [];
  
  if (conversions.length === 0) {
    return <p className="text-text-tertiary">No conversion data available</p>;
  }

  const chartData = conversions.map(c => ({
    stage: c.stage,
    conversion: c.conversionRate,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
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
          label={{ value: 'Conversion %', angle: -90, position: 'insideLeft', fill: '#888' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a1a', 
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Bar dataKey="conversion" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderTable(config: Record<string, unknown>, metrics: Metrics) {
  const columns = (config.columns as Array<{ field: string; label: string; align?: string; format?: string }>) || [];
  const stages = metrics.funnel_stages || [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-tertiary border-b border-surface-tertiary">
            {columns.map(col => (
              <th key={col.field} className={`pb-2 pr-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-text-secondary">
          {stages.map((stage) => (
            <tr key={stage.stage} className="border-b border-surface-tertiary">
              {columns.map(col => {
                let value: string | number = '';
                
                switch (col.field) {
                  case 'stage':
                    value = stage.stage;
                    break;
                  case 'count':
                    value = stage.count;
                    break;
                  case 'avgTime':
                    value = stage.avgTimeInStage !== null ? `${Math.round(stage.avgTimeInStage)} days` : '—';
                    break;
                  case 'conversionRate':
                    value = stage.conversionToNext !== null ? `${stage.conversionToNext.toFixed(1)}%` : '—';
                    break;
                  case 'dropoffRate':
                    value = stage.dropOff !== null ? `${stage.dropOff.toFixed(1)}%` : '—';
                    break;
                }
                
                return (
                  <td key={col.field} className={`py-3 pr-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getIcon(iconName: string) {
  const icons: Record<string, typeof BarChart3> = {
    'layers': Layers,
    'trending-up': TrendingUp,
    'clock': Clock,
    'alert-triangle': AlertTriangle,
    'bar-chart-3': BarChart3,
  };
  return icons[iconName] || BarChart3;
}

