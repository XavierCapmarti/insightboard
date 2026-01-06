'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet,
  ArrowRight,
  BarChart3,
  Zap,
  CheckCircle2,
} from 'lucide-react';

const SAMPLE_CSVS = [
  { id: 'default', name: 'Sales Pipeline', file: 'sample-data.csv', description: 'Deal pipeline with stages' },
  { id: 'sales', name: 'Sales Pipeline (Extended)', file: 'sample-sales-pipeline.csv', description: 'Larger sales dataset' },
  { id: 'ecommerce', name: 'E-commerce Orders', file: 'sample-ecommerce-orders.csv', description: 'Order fulfillment pipeline' },
  { id: 'leads', name: 'Lead Generation', file: 'sample-leads.csv', description: 'Lead conversion funnel' },
];

export default function HomePage() {
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const handleTrySample = async (sampleFile: string) => {
    setIsLoadingSample(true);
    setSelectedSample(sampleFile);
    // Load sample CSV and redirect to onboarding
    window.location.href = `/onboarding?sample=${sampleFile}`;
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-surface-tertiary bg-surface-secondary/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-950 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-surface" />
            </div>
            <span className="font-semibold text-lg text-text-primary">ClarLens</span>
          </div>
          
          <Link
            href="/onboarding"
            className="px-4 py-2 bg-brand-950 text-surface text-sm font-medium rounded-lg hover:bg-brand-900 transition-colors"
          >
            Upload CSV
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-tertiary text-text-secondary text-sm font-medium rounded-full mb-6 border border-surface-tertiary">
            <Zap className="w-4 h-4" />
            CSV to insights in 5 minutes
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary leading-tight mb-6">
            See your data{' '}
            <span className="text-brand-950">clearly</span>
          </h1>
          
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Upload your CSV and get instant insights. No setup, no code, no consultants. 
            Just clarity.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-all"
            >
              Upload CSV
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-text-tertiary mb-3">Or try with sample data:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SAMPLE_CSVS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleTrySample(sample.file)}
                  disabled={isLoadingSample && selectedSample === sample.file}
                  className="px-4 py-2 bg-surface-secondary text-text-secondary text-sm font-medium rounded-lg border border-surface-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
                  title={sample.description}
                >
                  {isLoadingSample && selectedSample === sample.file ? 'Loading...' : sample.name}
                </button>
              ))}
            </div>
          </div>
          
          <p className="mt-6 text-sm text-text-tertiary">
            Free • No signup required • Works instantly
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-surface-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            How it works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-surface-tertiary flex items-center justify-center mx-auto mb-4 border border-surface-tertiary">
                <Upload className="w-6 h-6 text-text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">1. Upload CSV</h3>
              <p className="text-sm text-text-secondary">
                Drag & drop or browse. We support any CSV format.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-surface-tertiary flex items-center justify-center mx-auto mb-4 border border-surface-tertiary">
                <FileSpreadsheet className="w-6 h-6 text-text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">2. Map Fields</h3>
              <p className="text-sm text-text-secondary">
                We auto-detect. You confirm. Takes seconds.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-surface-tertiary flex items-center justify-center mx-auto mb-4 border border-surface-tertiary">
                <BarChart3 className="w-6 h-6 text-text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">3. Get Insights</h3>
              <p className="text-sm text-text-secondary">
                Instant dashboard with real metrics from your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            What you get
          </h2>
          
          <div className="space-y-4">
            {[
              'Funnel analysis with conversion rates',
              'Stage-by-stage drop-off detection',
              'Time-to-close metrics',
              'Owner performance breakdown',
              'Date range filtering',
              'Export-ready visualizations',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-text-secondary">
                <CheckCircle2 className="w-5 h-5 text-brand-950 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-surface-secondary border-t border-surface-tertiary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to see your data clearly?
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Upload your CSV and get insights in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-colors"
            >
              Upload CSV
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-text-tertiary mb-3">Or try with sample data:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SAMPLE_CSVS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleTrySample(sample.file)}
                  disabled={isLoadingSample && selectedSample === sample.file}
                  className="px-4 py-2 bg-surface-secondary text-text-secondary text-sm font-medium rounded-lg border border-surface-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
                  title={sample.description}
                >
                  {isLoadingSample && selectedSample === sample.file ? 'Loading...' : sample.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-surface-tertiary">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-950 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-surface" />
            </div>
            <span className="font-medium text-text-secondary">ClarLens</span>
          </div>
          
          <p className="text-sm text-text-tertiary">
            © 2025 ClarLens. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
