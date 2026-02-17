'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { TemplateRenderer } from '@/components/template/TemplateRenderer';
import { AlertTriangle, Sparkles } from 'lucide-react';
import funnelAnalysisTemplate from '@/templates/funnel-analysis.json';

interface DashboardTemplate {
  id: string;
  name: string;
  sections: Array<{
    id: string;
    title: string;
    widgets: Array<unknown>;
  }>;
}

function DashboardTemplateContent() {
  const searchParams = useSearchParams();
  const [datasetId, setDatasetId] = useState<string | null>(searchParams.get('datasetId'));
  const templateId = searchParams.get('template') || 'funnel-analysis';
  const [isReingesting, setIsReingesting] = useState(false);
  
  const reingestDataset = useCallback(async (csvData: string, mappings: Array<{sourceField: string; targetField: string}>) => {
    setIsReingesting(true);
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'csv_upload',
          config: { fieldMappings: mappings },
          content: csvData,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.datasetId) {
          console.log('✓ Re-ingested dataset:', result.datasetId);
          setDatasetId(result.datasetId);
          sessionStorage.setItem('clarLensDatasetId', result.datasetId);
          // Update URL without reload
          window.history.replaceState({}, '', `/dashboard-template?datasetId=${result.datasetId}&template=${templateId}`);
        }
      }
    } catch (err) {
      console.error('Failed to re-ingest:', err);
    } finally {
      setIsReingesting(false);
    }
  }, [templateId]);
  
  useEffect(() => {
    console.log('Dashboard loaded with datasetId:', datasetId);
    if (!datasetId) {
      console.error('No datasetId in URL params');
      // Try to restore from sessionStorage
      const storedId = sessionStorage.getItem('clarLensDatasetId');
      const storedMappings = sessionStorage.getItem('clarLensMappings');
      const storedCSV = sessionStorage.getItem('clarLensCSVData');
      
      if (storedId && storedMappings && storedCSV) {
        console.log('Found stored data, attempting to re-ingest...');
        reingestDataset(storedCSV, JSON.parse(storedMappings));
      }
    }
  }, [datasetId, reingestDataset]);
  
  const [template, setTemplate] = useState<DashboardTemplate | null>(null);
  const [insight, setInsight] = useState<{ text: string; value: string } | null>(null);

  useEffect(() => {
    // Load template
    if (templateId === 'funnel-analysis') {
      setTemplate(funnelAnalysisTemplate as DashboardTemplate);
    }
  }, [templateId]);

  const fetchInsight = useCallback(async () => {
    try {
      const response = await fetch(`/api/dataset/${datasetId}/metrics?period=all`);
      if (response.ok) {
        const data = await response.json();
        const stages = data.metrics.funnel_stages || [];
        
        // Find biggest drop-off
        let maxDropoff = 0;
        let maxDropoffStage = '';
        let nextStage = '';
        
        for (let i = 0; i < stages.length - 1; i++) {
          const dropoff = stages[i].dropOff;
          if (dropoff !== null && dropoff > maxDropoff) {
            maxDropoff = dropoff;
            maxDropoffStage = stages[i].stage;
            nextStage = stages[i + 1]?.stage || 'Next';
          }
        }
        
        if (maxDropoff > 0) {
          setInsight({
            text: `Biggest drop-off is ${maxDropoffStage} → ${nextStage}`,
            value: `${maxDropoff.toFixed(1)}%`,
          });
        } else {
          // Fallback to overall conversion or cycle time
          const conversion = data.metrics.overall_conversion?.value;
          const cycleTime = data.metrics.avg_cycle_time?.value;
          
          if (conversion !== undefined && conversion > 0) {
            setInsight({
              text: 'Overall conversion rate',
              value: `${conversion.toFixed(1)}%`,
            });
          } else if (cycleTime !== null && cycleTime !== undefined) {
            setInsight({
              text: 'Average cycle time',
              value: `${Math.round(cycleTime)} days`,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch insight:', err);
    }
  }, [datasetId]);
  
  useEffect(() => {
    // Fetch insight (biggest drop-off)
    if (datasetId && template) {
      fetchInsight();
    }
  }, [datasetId, template, fetchInsight]);

  if (!datasetId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center max-w-md">
          {isReingesting ? (
            <>
              <div className="w-12 h-12 border-2 border-brand-950 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-text-primary mb-2">Re-loading Data</h2>
              <p className="text-text-secondary">
                Server restarted. Re-ingesting your CSV...
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-text-primary mb-2">No dataset found</h2>
              <p className="text-text-secondary mb-6">
                Upload your CSV file to generate insights and analytics.
              </p>
              <a
                href="/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-colors"
              >
                Upload CSV
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-950 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Magic Insight Callout */}
      {insight && (
        <div className="bg-gradient-to-r from-brand-950/20 to-brand-900/20 border-b border-brand-600/30">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-950/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-950" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-tertiary mb-1">Key Insight</p>
                <p className="text-lg font-semibold text-text-primary">
                  {insight.text}: <span className="text-brand-950">{insight.value}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Renderer */}
      <TemplateRenderer template={template as any} datasetId={datasetId} />
    </div>
  );
}

export default function DashboardTemplatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-950 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <DashboardTemplateContent />
    </Suspense>
  );
}

