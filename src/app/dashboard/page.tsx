'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Settings,
  Plus,
  RefreshCw,
  Calendar,
  ChevronDown,
} from 'lucide-react';

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_KPIS = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '$847,230',
    change: 12.5,
    trend: 'up' as const,
    icon: DollarSign,
    color: 'emerald',
  },
  {
    id: 'records',
    label: 'Total Records',
    value: '1,247',
    change: 8.3,
    trend: 'up' as const,
    icon: BarChart3,
    color: 'blue',
  },
  {
    id: 'avg_value',
    label: 'Average Value',
    value: '$679',
    change: -2.1,
    trend: 'down' as const,
    icon: Target,
    color: 'violet',
  },
  {
    id: 'close_rate',
    label: 'Close Rate',
    value: '34.2%',
    change: 5.7,
    trend: 'up' as const,
    icon: TrendingUp,
    color: 'amber',
  },
];

const MOCK_FUNNEL = [
  { stage: 'Lead', count: 450, color: '#3B82F6' },
  { stage: 'Qualified', count: 320, color: '#60A5FA' },
  { stage: 'Proposal', count: 180, color: '#93C5FD' },
  { stage: 'Negotiation', count: 95, color: '#BFDBFE' },
  { stage: 'Won', count: 42, color: '#10B981' },
];

const MOCK_TOP_PERFORMERS = [
  { name: 'Sarah Mitchell', value: '$142,500', deals: 28, avatar: 'SM' },
  { name: 'John Davidson', value: '$128,200', deals: 24, avatar: 'JD' },
  { name: 'Mike Rodriguez', value: '$98,700', deals: 19, avatar: 'MR' },
  { name: 'Emily Chen', value: '$87,400', deals: 17, avatar: 'EC' },
  { name: 'David Kim', value: '$76,300', deals: 15, avatar: 'DK' },
];

// =============================================================================
// COMPONENTS
// =============================================================================

function KPICard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trend === 'up' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function FunnelChart({ data }: { data: typeof MOCK_FUNNEL }) {
  const maxCount = Math.max(...data.map(d => d.count));
  
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-6">Pipeline Funnel</h3>
      <div className="space-y-4">
        {data.map((stage, index) => {
          const width = (stage.count / maxCount) * 100;
          const isLast = index === data.length - 1;
          
          return (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-24 text-sm text-slate-600">{stage.stage}</div>
              <div className="flex-1 relative">
                <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div 
                    className="h-full rounded-lg transition-all duration-500"
                    style={{ 
                      width: `${width}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-right">
                <span className={`text-sm font-medium ${isLast ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {stage.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Leaderboard({ data }: { data: typeof MOCK_TOP_PERFORMERS }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-6">Top Performers</h3>
      <div className="space-y-4">
        {data.map((person, index) => (
          <div key={person.name} className="flex items-center gap-4">
            <div className="w-6 text-center">
              <span className={`text-sm font-bold ${
                index === 0 ? 'text-amber-500' :
                index === 1 ? 'text-slate-400' :
                index === 2 ? 'text-amber-700' :
                'text-slate-300'
              }`}>
                {index + 1}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700">
              {person.avatar}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{person.name}</p>
              <p className="text-xs text-slate-500">{person.deals} deals</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{person.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function DashboardPage() {
  const [period, setPeriod] = useState('This Month');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">InsightBoard</span>
        </div>

        <nav className="space-y-1">
          <Link 
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-50 text-brand-700 font-medium"
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link 
            href="/dashboard/funnel"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            Funnel
          </Link>
          <Link 
            href="/dashboard/team"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Users className="w-5 h-5" />
            Team
          </Link>
          <Link 
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors">
            <Plus className="w-4 h-4" />
            Add Widget
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Overview of your business metrics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 transition-colors">
              <Calendar className="w-4 h-4" />
              {period}
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {MOCK_KPIS.map((kpi) => (
            <KPICard key={kpi.id} {...kpi} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          <FunnelChart data={MOCK_FUNNEL} />
          <Leaderboard data={MOCK_TOP_PERFORMERS} />
        </div>
      </main>
    </div>
  );
}

