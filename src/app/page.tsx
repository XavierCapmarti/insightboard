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
  TrendingUp,
  Users,
  Clock,
  Shield,
  Star,
} from 'lucide-react';

const SAMPLE_CSVS = [
  { id: 'default', name: 'Sales Pipeline', file: 'sample-data.csv', description: 'Deal pipeline with stages' },
  { id: 'sales', name: 'Sales Pipeline (Extended)', file: 'sample-sales-pipeline.csv', description: 'Larger sales dataset' },
  { id: 'ecommerce', name: 'E-commerce Orders', file: 'sample-ecommerce-orders.csv', description: 'Order fulfillment pipeline' },
  { id: 'leads', name: 'Lead Generation', file: 'sample-leads.csv', description: 'Lead conversion funnel' },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Funnel Analysis',
    description: 'See exactly where deals drop off and fix your pipeline leaks.',
  },
  {
    icon: Users,
    title: 'Rep Performance',
    description: 'Leaderboards and per-rep metrics so you know who\'s crushing it.',
  },
  {
    icon: Clock,
    title: 'Cycle Time',
    description: 'Track how long deals sit in each stage. Spot bottlenecks instantly.',
  },
  {
    icon: BarChart3,
    title: 'Time Series',
    description: 'Deal velocity, win rate trends, and stage distribution over time.',
  },
  {
    icon: Zap,
    title: 'Magic Insights',
    description: 'Auto-detected biggest drop-offs and anomalies in your data.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Any CSV Format',
    description: 'Auto-detects fields and maps them. Works with sales, e-commerce, leads.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'We were paying $500/mo for a BI tool nobody used. ClarLens gave us better insights from a CSV in 5 minutes.',
    name: 'Sarah K.',
    role: 'Head of Sales, Series A startup',
  },
  {
    quote: 'I used to spend half my Monday building reports in spreadsheets. Now I just upload and go.',
    name: 'Marcus T.',
    role: 'RevOps Manager',
  },
  {
    quote: 'Finally, a tool that doesn\'t need a data engineer to set up. My team adopted it the same day.',
    name: 'Priya R.',
    role: 'VP Sales, SMB SaaS',
  },
];

export default function HomePage() {
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const handleTrySample = async (sampleFile: string) => {
    setIsLoadingSample(true);
    setSelectedSample(sampleFile);
    window.location.href = `/onboarding?sample=${sampleFile}`;
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-surface-tertiary bg-surface/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-950 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-surface" />
            </div>
            <span className="font-semibold text-lg text-text-primary">ClarLens</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-text-primary transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="px-4 py-2 bg-brand-950 text-surface text-sm font-medium rounded-lg hover:bg-brand-900 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
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
            Stop guessing.{' '}
            <span className="text-brand-950">Start seeing.</span>
          </h1>

          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Upload your sales CSV and instantly see where deals drop off, which reps perform best, and how to close faster. No setup. No code. No consultants.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-8 py-4 bg-brand-950 text-surface font-semibold rounded-lg hover:bg-brand-900 transition-all text-lg"
            >
              Upload CSV — It&apos;s Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="mt-6">
            <p className="text-sm text-text-tertiary mb-3">Or try instantly with sample data:</p>
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
            Free tier available — No credit card required
          </p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="py-8 px-6 border-y border-surface-tertiary bg-surface-secondary">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 text-text-tertiary text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Your data never leaves your browser</span>
          </div>
          <div className="hidden md:block w-1 h-1 rounded-full bg-surface-tertiary" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>5 min from CSV to dashboard</span>
          </div>
          <div className="hidden md:block w-1 h-1 rounded-full bg-surface-tertiary" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>No setup or integrations needed</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-4 text-center">
            How it works
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">
            Three steps. No onboarding call. No implementation timeline.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4 border border-surface-tertiary">
                <Upload className="w-7 h-7 text-text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">1. Upload your CSV</h3>
              <p className="text-sm text-text-secondary">
                Drag & drop any CSV — sales pipeline, orders, leads. We handle any format.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4 border border-surface-tertiary">
                <FileSpreadsheet className="w-7 h-7 text-text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">2. We auto-map fields</h3>
              <p className="text-sm text-text-secondary">
                ClarLens detects stages, dates, values, and owners automatically. Just confirm.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4 border border-surface-tertiary">
                <BarChart3 className="w-7 h-7 text-text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">3. Get your dashboard</h3>
              <p className="text-sm text-text-secondary">
                Instant funnel analysis, rep leaderboards, cycle times, and trend charts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-surface-secondary">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-4 text-center">
            Everything you need to understand your pipeline
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">
            Built for sales teams, ops managers, and founders who need answers — not another BI tool to configure.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-surface border border-surface-tertiary hover:border-brand-400 transition-colors"
              >
                <feature.icon className="w-8 h-8 text-brand-950 mb-4" />
                <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            What people are saying
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-xl bg-surface-secondary border border-surface-tertiary"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-text-secondary text-sm mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-medium text-text-primary text-sm">{t.name}</p>
                  <p className="text-text-tertiary text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-surface-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-4 text-center">
            Simple pricing
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">
            Start free. Upgrade when you need more.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free tier */}
            <div className="p-8 rounded-2xl bg-surface border border-surface-tertiary">
              <h3 className="text-lg font-semibold text-text-primary mb-1">Free</h3>
              <p className="text-text-tertiary text-sm mb-6">Get started, no card required</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-text-primary">$0</span>
                <span className="text-text-tertiary text-sm">/month</span>
              </div>
              <Link
                href="/onboarding"
                className="block w-full text-center px-6 py-3 bg-surface-secondary text-text-primary font-medium rounded-lg border border-surface-tertiary hover:bg-surface-tertiary transition-colors mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-3">
                {[
                  '1 CSV upload at a time',
                  'Funnel analysis',
                  'Basic KPI cards',
                  'Stage metrics table',
                  'Magic insight detection',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro tier */}
            <div className="p-8 rounded-2xl bg-surface border-2 border-brand-950 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-950 text-surface text-xs font-semibold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">Pro</h3>
              <p className="text-text-tertiary text-sm mb-6">For teams serious about pipeline visibility</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-text-primary">$29</span>
                <span className="text-text-tertiary text-sm">/month</span>
              </div>
              <Link
                href="/onboarding"
                className="block w-full text-center px-6 py-3 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-colors mb-8"
              >
                Start 14-Day Free Trial
              </Link>
              <ul className="space-y-3">
                {[
                  'Unlimited CSV uploads',
                  'Google Sheets integration',
                  'Rep performance leaderboards',
                  'Time series & trend charts',
                  'Deal quality analysis',
                  'Cycle time breakdown',
                  'Date range filtering',
                  'CSV export',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-brand-950 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Your data is already telling a story.
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Upload a CSV and read it in 5 minutes. Free, no signup required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-8 py-4 bg-brand-950 text-surface font-semibold rounded-lg hover:bg-brand-900 transition-colors text-lg"
            >
              Try ClarLens Free
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
      <footer className="py-12 px-6 border-t border-surface-tertiary bg-surface-secondary">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-950 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-surface" />
            </div>
            <span className="font-medium text-text-secondary">ClarLens</span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-text-tertiary">
            <a href="#features" className="hover:text-text-secondary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-text-secondary transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-text-secondary transition-colors">Testimonials</a>
          </nav>

          <p className="text-sm text-text-tertiary">
            © 2025 ClarLens. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
