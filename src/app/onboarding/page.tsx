'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  Upload,
  Globe,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Step = 'source' | 'connect' | 'map' | 'preview' | 'launch';

interface DataSource {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  available: boolean;
}

// =============================================================================
// DATA
// =============================================================================

const DATA_SOURCES: DataSource[] = [
  {
    id: 'csv',
    name: 'CSV Upload',
    icon: Upload,
    description: 'Upload a CSV or Excel file',
    available: true,
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    icon: FileSpreadsheet,
    description: 'Connect to a Google Spreadsheet',
    available: true,
  },
  {
    id: 'crm',
    name: 'CRM / API',
    icon: Globe,
    description: 'Connect via REST API',
    available: true,
  },
];

const STEPS: { id: Step; label: string }[] = [
  { id: 'source', label: 'Data Source' },
  { id: 'connect', label: 'Connect' },
  { id: 'map', label: 'Map Fields' },
  { id: 'preview', label: 'Preview' },
  { id: 'launch', label: 'Launch' },
];

// =============================================================================
// COMPONENTS
// =============================================================================

function StepIndicator({ 
  steps, 
  currentStep 
}: { 
  steps: typeof STEPS; 
  currentStep: Step;
}) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={step.id} className="flex items-center">
            <div 
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${isComplete ? 'bg-brand-500 text-white' : ''}
                ${isCurrent ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500' : ''}
                ${!isComplete && !isCurrent ? 'bg-slate-100 text-slate-400' : ''}
              `}
            >
              {isComplete ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`w-12 h-0.5 mx-2 ${
                  isComplete ? 'bg-brand-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SourceStep({ 
  onSelect 
}: { 
  onSelect: (sourceId: string) => void;
}) {
  return (
    <div className="animate-in">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Choose your data source
      </h2>
      <p className="text-slate-600 mb-8">
        Select how you'd like to import your data. You can add more sources later.
      </p>
      
      <div className="grid gap-4">
        {DATA_SOURCES.map((source) => (
          <button
            key={source.id}
            onClick={() => source.available && onSelect(source.id)}
            disabled={!source.available}
            className={`
              flex items-center gap-4 p-4 rounded-xl border text-left transition-all
              ${source.available 
                ? 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-md cursor-pointer' 
                : 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-60'}
            `}
          >
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <source.icon className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">
                {source.name}
                {!source.available && (
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Coming soon
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-600">{source.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ConnectStep({ 
  sourceId,
  onNext,
  onBack,
}: { 
  sourceId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    onNext();
  };

  return (
    <div className="animate-in">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Connect your data
      </h2>
      <p className="text-slate-600 mb-8">
        {sourceId === 'csv' && 'Upload your CSV file to get started.'}
        {sourceId === 'google_sheets' && 'Paste your Google Sheets URL.'}
        {sourceId === 'crm' && 'Enter your API endpoint and credentials.'}
      </p>

      {sourceId === 'csv' && (
        <div className="mb-8">
          <div 
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-colors
              ${file ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}
            `}
          >
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className={`w-8 h-8 mx-auto mb-4 ${file ? 'text-brand-500' : 'text-slate-400'}`} />
              {file ? (
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-900">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Supports CSV, TSV, and TXT files
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>
      )}

      {sourceId === 'google_sheets' && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Google Sheets URL
          </label>
          <input
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          <p className="text-sm text-slate-500 mt-2">
            Make sure your sheet is shared with view access.
          </p>
        </div>
      )}

      {sourceId === 'crm' && (
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              API Endpoint
            </label>
            <input
              type="url"
              placeholder="https://api.yourcrm.com/v1/records"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleConnect}
          disabled={isLoading || (sourceId === 'csv' && !file)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Connect
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function MapStep({ 
  onNext,
  onBack,
}: { 
  onNext: () => void;
  onBack: () => void;
}) {
  const sampleFields = [
    { source: 'ID', suggested: 'id', confidence: 95 },
    { source: 'Customer Name', suggested: 'name', confidence: 90 },
    { source: 'Assigned To', suggested: 'ownerId', confidence: 85 },
    { source: 'Amount', suggested: 'value', confidence: 92 },
    { source: 'Status', suggested: 'status', confidence: 88 },
    { source: 'Created Date', suggested: 'createdAt', confidence: 95 },
  ];

  return (
    <div className="animate-in">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Map your fields
      </h2>
      <p className="text-slate-600 mb-8">
        We've auto-detected your fields. Review and adjust the mappings as needed.
      </p>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-emerald-900">Auto-mapping complete</p>
          <p className="text-sm text-emerald-700">
            6 of 6 fields were automatically matched. Review below.
          </p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
          <div>Source Field</div>
          <div>Maps To</div>
          <div>Confidence</div>
        </div>
        {sampleFields.map((field) => (
          <div 
            key={field.source}
            className="grid grid-cols-3 gap-4 p-4 border-b border-slate-100 last:border-b-0"
          >
            <div className="font-medium text-slate-900">{field.source}</div>
            <div>
              <select className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                <option value={field.suggested}>{field.suggested}</option>
                <option value="id">id</option>
                <option value="ownerId">ownerId</option>
                <option value="value">value</option>
                <option value="status">status</option>
                <option value="createdAt">createdAt</option>
                <option value="custom">Custom field...</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${field.confidence}%` }}
                />
              </div>
              <span className="text-sm text-slate-600">{field.confidence}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PreviewStep({ 
  onNext,
  onBack,
}: { 
  onNext: () => void;
  onBack: () => void;
}) {
  const previewMetrics = [
    { label: 'Total Records', value: '1,247' },
    { label: 'Unique Owners', value: '12' },
    { label: 'Total Value', value: '$847,230' },
    { label: 'Avg Value', value: '$679' },
  ];

  return (
    <div className="animate-in">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Preview your data
      </h2>
      <p className="text-slate-600 mb-8">
        Here's what your dashboard will look like. Everything looks good!
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {previewMetrics.map((metric) => (
          <div 
            key={metric.label}
            className="p-4 bg-white rounded-xl border border-slate-200"
          >
            <p className="text-sm text-slate-500 mb-1">{metric.label}</p>
            <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-slate-900 mb-4">Sample Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Owner</th>
                <th className="pb-2 pr-4">Value</th>
                <th className="pb-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4">Acme Corp</td>
                <td className="py-2 pr-4">John D.</td>
                <td className="py-2 pr-4">$12,500</td>
                <td className="py-2 pr-4">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                    Won
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4">TechStart Inc</td>
                <td className="py-2 pr-4">Sarah M.</td>
                <td className="py-2 pr-4">$8,200</td>
                <td className="py-2 pr-4">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    In Progress
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">GlobalTech</td>
                <td className="py-2 pr-4">Mike R.</td>
                <td className="py-2 pr-4">$45,000</td>
                <td className="py-2 pr-4">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                    Proposal
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors"
        >
          Launch Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function LaunchStep() {
  return (
    <div className="animate-in text-center py-12">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Your dashboard is ready!
      </h2>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        We've created your analytics dashboard. Start exploring your data now.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors"
        >
          Open Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/settings/data"
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
        >
          Configure More
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('source');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId);
    setStep('connect');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">InsightBoard</span>
          </Link>
          
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {step === 'source' && (
          <SourceStep onSelect={handleSourceSelect} />
        )}
        
        {step === 'connect' && selectedSource && (
          <ConnectStep 
            sourceId={selectedSource}
            onNext={() => setStep('map')}
            onBack={() => setStep('source')}
          />
        )}
        
        {step === 'map' && (
          <MapStep 
            onNext={() => setStep('preview')}
            onBack={() => setStep('connect')}
          />
        )}
        
        {step === 'preview' && (
          <PreviewStep 
            onNext={() => setStep('launch')}
            onBack={() => setStep('map')}
          />
        )}
        
        {step === 'launch' && (
          <LaunchStep />
        )}
      </main>
    </div>
  );
}

