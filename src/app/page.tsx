'use client';

import Link from 'next/link';
import { 
  ArrowRight, 
  BarChart3, 
  FileSpreadsheet, 
  Zap, 
  Layers,
  Users,
  TrendingUp,
  Clock,
  Check
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileSpreadsheet,
    title: 'Connect Any Data Source',
    description: 'Google Sheets, CSV uploads, CRM exports — we handle it all.',
  },
  {
    icon: Zap,
    title: 'Instant Insights',
    description: 'No setup required. See your metrics in minutes, not weeks.',
  },
  {
    icon: Layers,
    title: 'Pre-built Templates',
    description: 'Revenue, funnels, performance — start with proven dashboards.',
  },
  {
    icon: BarChart3,
    title: 'Fully Configurable',
    description: 'Customize everything. Your data, your way.',
  },
];

const TEMPLATES = [
  {
    id: 'revenue-overview',
    name: 'Revenue Overview',
    description: 'Track revenue, growth trends, and performance',
    icon: TrendingUp,
    color: 'bg-emerald-500',
  },
  {
    id: 'funnel-analysis',
    name: 'Funnel Analysis',
    description: 'Visualize conversion rates and bottlenecks',
    icon: Layers,
    color: 'bg-blue-500',
  },
  {
    id: 'performance-by-owner',
    name: 'Team Performance',
    description: 'Compare individual and team metrics',
    icon: Users,
    color: 'bg-violet-500',
  },
  {
    id: 'time-to-close',
    name: 'Cycle Time',
    description: 'Analyze timing and velocity trends',
    icon: Clock,
    color: 'bg-amber-500',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">InsightBoard</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#templates" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Templates
            </a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 text-sm font-medium rounded-full mb-6">
            <Zap className="w-4 h-4" />
            No code. No consultants. Just insights.
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Analytics that{' '}
            <span className="gradient-text">just work</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Connect your data in minutes. Get beautiful dashboards instantly. 
            No setup fees, no engineering required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
            >
              View Demo
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-slate-500">
            Free 14-day trial • No credit card required
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built for busy teams who want results, not complexity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {FEATURES.map((feature) => (
              <div 
                key={feature.title}
                className="p-6 bg-white rounded-2xl border border-slate-100 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Start with a template
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Pre-built dashboards for common use cases. Customize as needed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 stagger-children">
            {TEMPLATES.map((template) => (
              <Link
                key={template.id}
                href={`/onboarding?template=${template.id}`}
                className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 card-hover group"
              >
                <div className={`w-12 h-12 rounded-xl ${template.color} flex items-center justify-center flex-shrink-0`}>
                  <template.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {template.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to see your data clearly?
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Join thousands of teams making better decisions with InsightBoard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-slate-600">InsightBoard</span>
          </div>
          
          <p className="text-sm text-slate-500">
            © 2025 InsightBoard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

