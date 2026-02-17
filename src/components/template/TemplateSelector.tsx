'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, TrendingUp, Users, Clock, ChevronDown } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'funnel-analysis',
    name: 'Funnel Analysis',
    description: 'Pipeline stages, conversion rates, and bottlenecks',
    icon: 'funnel',
  },
  {
    id: 'revenue-overview',
    name: 'Revenue Overview',
    description: 'Revenue trends and performance by segment',
    icon: 'trending-up',
  },
  {
    id: 'performance-by-owner',
    name: 'Performance by Owner',
    description: 'Individual and team performance metrics',
    icon: 'users',
  },
  {
    id: 'time-to-close',
    name: 'Time to Close',
    description: 'Cycle times, velocity trends, and bottlenecks',
    icon: 'clock',
  },
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'trending-up':
      return <TrendingUp className="w-5 h-5" />;
    case 'users':
      return <Users className="w-5 h-5" />;
    case 'clock':
      return <Clock className="w-5 h-5" />;
    default:
      return <LayoutGrid className="w-5 h-5" />;
  }
};

export function TemplateSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTemplate = searchParams.get('template') || 'funnel-analysis';
  const datasetId = searchParams.get('datasetId');
  const [isOpen, setIsOpen] = useState(false);

  const activeTemplate = TEMPLATES.find((t) => t.id === currentTemplate) || TEMPLATES[0];

  const handleTemplateChange = (templateId: string) => {
    if (datasetId) {
      router.push(`/dashboard-template?datasetId=${datasetId}&template=${templateId}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Selected Template Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
      >
        <div className="text-blue-400">{getIcon(activeTemplate.icon)}</div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-zinc-100">{activeTemplate.name}</div>
          <div className="text-xs text-zinc-400 hidden sm:block">
            {activeTemplate.description}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateChange(template.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors text-left ${
                  template.id === currentTemplate ? 'bg-zinc-750' : ''
                }`}
              >
                <div
                  className={`${
                    template.id === currentTemplate ? 'text-blue-400' : 'text-zinc-400'
                  }`}
                >
                  {getIcon(template.icon)}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium ${
                      template.id === currentTemplate ? 'text-blue-400' : 'text-zinc-100'
                    }`}
                  >
                    {template.name}
                  </div>
                  <div className="text-xs text-zinc-400">{template.description}</div>
                </div>
                {template.id === currentTemplate && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
