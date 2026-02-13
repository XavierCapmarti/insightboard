'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  X,
} from 'lucide-react';

type Step = 'upload' | 'map' | 'preview';

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');
    
    const headers = lines[0].split(',').map(h => h.trim());
    const rows: CSVRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: CSVRow = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  const autoSuggestMappings = (sourceHeaders: string[]): FieldMapping[] => {
    const suggestions: FieldMapping[] = [];
    
    sourceHeaders.forEach(header => {
      const lower = header.toLowerCase();
      let target = '';
      let required = false;
      
      // Auto-match common patterns
      if (lower.includes('stage') || lower.includes('status') || lower.includes('state')) {
        target = 'status';
        required = true;
      } else if (lower.includes('created') || lower.includes('date') || lower.includes('timestamp')) {
        target = 'createdAt';
        required = true;
      } else if (lower.includes('owner') || lower.includes('assigned') || lower.includes('person') || lower.includes('rep')) {
        target = 'ownerId';
        required = false;
      } else if (lower.includes('value') || lower.includes('amount') || lower.includes('revenue') || lower.includes('price')) {
        target = 'value';
        required = false;
      }
      
      if (target) {
        suggestions.push({
          sourceField: header,
          targetField: target,
          required,
        });
      }
    });
    
    return suggestions;
  };

  const processFile = async (selectedFile: File) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const text = await selectedFile.text();
      
      if (!text.trim()) {
        throw new Error('File is empty');
      }
      
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        throw new Error('No data rows found');
      }
      
      const detectedHeaders = Object.keys(rows[0]);
      
      setFile(selectedFile);
      setCsvData(rows);
      setHeaders(detectedHeaders);
      
      // Auto-suggest mappings
      const suggestedMappings = autoSuggestMappings(detectedHeaders);
      setMappings(suggestedMappings);
      
      setIsLoading(false);
      setStep('map');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setIsLoading(false);
    }
  };

  const loadSampleCSV = async (sampleFile: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const filename = sampleFile === 'true' ? 'sample-data.csv' : sampleFile;
      console.log('Loading sample CSV:', filename);
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const text = await response.text();
      console.log('CSV loaded, length:', text.length);
      const blob = new Blob([text], { type: 'text/csv' });
      const file = new File([blob], filename, { type: 'text/csv' });
      await processFile(file);
    } catch (err) {
      console.error('Error loading sample CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sample CSV');
      setIsLoading(false);
    }
  };

  // Load sample CSV if requested
  useEffect(() => {
    const sampleParam = searchParams.get('sample');
    if (sampleParam && csvData.length === 0) {
      loadSampleCSV(sampleParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
      processFile(droppedFile);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMappingChange = (sourceField: string, targetField: string) => {
    setMappings(prev => prev.map(m => 
      m.sourceField === sourceField ? { ...m, targetField } : m
    ));
  };

  const canProceed = () => {
    const hasStatus = mappings.some(m => m.targetField === 'status' && m.sourceField);
    const hasDate = mappings.some(m => m.targetField === 'createdAt' && m.sourceField);
    return hasStatus && hasDate;
  };

  const handlePreview = () => {
    // Store data in sessionStorage for dashboard
    sessionStorage.setItem('clarLensCSVData', JSON.stringify(csvData));
    sessionStorage.setItem('clarLensMappings', JSON.stringify(mappings));
    setStep('preview');
  };

  const handleLaunch = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-surface-tertiary bg-surface-secondary">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-950 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-surface" />
            </div>
            <span className="font-semibold text-lg text-text-primary">ClarLens</span>
          </Link>
          
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            {step === 'upload' && <span className="text-text-primary">1. Upload</span>}
            {step === 'map' && <span className="text-text-primary">2. Map Fields</span>}
            {step === 'preview' && <span className="text-text-primary">3. Preview</span>}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {step === 'upload' && (
          <div className="animate-in">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Upload your CSV
            </h2>
            <p className="text-text-secondary mb-8">
              Drag &amp; drop your file or click to browse. We&apos;ll detect the structure automatically.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-surface-tertiary border border-surface-tertiary rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-brand-950 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-text-primary">{error}</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Make sure your CSV has headers and at least one data row.
                  </p>
                </div>
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>
            )}

            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
                ${file ? 'border-brand-950 bg-surface-tertiary' : 'border-surface-tertiary hover:border-brand-300'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-brand-950 animate-spin" />
                  <p className="text-text-secondary">Processing CSV...</p>
                </div>
              ) : file ? (
                <div>
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-4 text-brand-950" />
                  <p className="font-medium text-text-primary">{file.name}</p>
                  <p className="text-sm text-text-secondary mt-1">
                    {(file.size / 1024).toFixed(1)} KB • {csvData.length} rows
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-4 text-text-tertiary" />
                  <p className="font-medium text-text-primary mb-1">
                    Drop your CSV here or click to browse
                  </p>
                  <p className="text-sm text-text-secondary">
                    Supports CSV files with headers
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-tertiary mb-2">Or try with sample data:</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Button clicked, loading sample CSV');
                    loadSampleCSV('sample-data.csv');
                  }}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-surface-secondary text-text-secondary text-xs font-medium rounded-lg border border-surface-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Loading...' : 'Sales Pipeline'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    loadSampleCSV('sample-sales-pipeline.csv');
                  }}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-surface-secondary text-text-secondary text-xs font-medium rounded-lg border border-surface-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Sales (Extended)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    loadSampleCSV('sample-ecommerce-orders.csv');
                  }}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-surface-secondary text-text-secondary text-xs font-medium rounded-lg border border-surface-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  E-commerce
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    loadSampleCSV('sample-leads.csv');
                  }}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-surface-secondary text-text-secondary text-xs font-medium rounded-lg border border-surface-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Leads
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="animate-in">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Map your fields
            </h2>
            <p className="text-text-secondary mb-6">
              We&apos;ve auto-detected your fields. Confirm the mappings below.
            </p>

            <div className="mb-6 p-4 bg-surface-secondary border border-brand-600/20 rounded-lg">
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Required:</span> Stage/Status, Date (created or updated)
                <br />
                <span className="font-medium text-text-primary">Optional:</span> Owner, Value
              </p>
            </div>

            <div className="border border-brand-600/20 rounded-lg overflow-hidden mb-8">
              <div className="grid grid-cols-2 gap-4 p-4 bg-surface-secondary text-sm font-medium text-text-secondary border-b border-brand-600/20">
                <div>Source Field</div>
                <div>Maps To</div>
              </div>
              {headers.map((header) => {
                const mapping = mappings.find(m => m.sourceField === header);
                const targetField = mapping?.targetField || '';
                const required = mapping?.required || false;
                
                return (
                  <div key={header} className="grid grid-cols-2 gap-4 p-4 border-b border-brand-600/10 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{header}</span>
                      {required && (
                        <span className="text-xs text-brand-950">required</span>
                      )}
                    </div>
                    <div>
                      <select
                        value={targetField}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-surface-secondary border border-surface-tertiary text-text-primary text-sm focus:border-brand-950 focus:ring-1 focus:ring-brand-950"
                      >
                        <option value="">Skip</option>
                        <option value="status">Stage/Status</option>
                        <option value="createdAt">Date (Created)</option>
                        <option value="updatedAt">Date (Updated)</option>
                        <option value="ownerId">Owner/Person</option>
                        <option value="value">Value/Amount</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {!canProceed() && (
              <div className="mb-6 p-4 bg-surface-secondary border border-brand-600/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-brand-950 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  Please map at least Stage/Status and Date fields to continue.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handlePreview}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="animate-in">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Preview your data
            </h2>
            <p className="text-text-secondary mb-8">
              Review your data summary and sample rows before generating insights.
            </p>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-surface-secondary rounded-lg border border-surface-tertiary">
                <p className="text-sm text-text-tertiary mb-1">Total Rows</p>
                <p className="text-2xl font-bold text-text-primary">{csvData.length}</p>
              </div>
              <div className="p-4 bg-surface-secondary rounded-lg border border-surface-tertiary">
                <p className="text-sm text-text-tertiary mb-1">Date Range</p>
                <p className="text-lg font-semibold text-text-primary">
                  {(() => {
                    const dateField = mappings.find(m => m.targetField === 'createdAt' || m.targetField === 'updatedAt');
                    if (!dateField) return 'N/A';
                    const dates = csvData.map(row => row[dateField.sourceField]).filter(Boolean);
                    if (dates.length === 0) return 'N/A';
                    const sorted = dates.sort();
                    return `${sorted[0]} - ${sorted[sorted.length - 1]}`;
                  })()}
                </p>
              </div>
              <div className="p-4 bg-surface-secondary rounded-lg border border-surface-tertiary">
                <p className="text-sm text-text-tertiary mb-1">Unique Owners</p>
                <p className="text-2xl font-bold text-text-primary">
                  {(() => {
                    const ownerField = mappings.find(m => m.targetField === 'ownerId');
                    if (!ownerField) return 'N/A';
                    const owners = new Set(csvData.map(row => row[ownerField.sourceField]).filter(Boolean));
                    return owners.size || 'N/A';
                  })()}
                </p>
              </div>
              <div className="p-4 bg-surface-secondary rounded-lg border border-surface-tertiary">
                <p className="text-sm text-text-tertiary mb-1">Unique Stages</p>
                <p className="text-2xl font-bold text-text-primary">
                  {(() => {
                    const statusField = mappings.find(m => m.targetField === 'status');
                    if (!statusField) return 'N/A';
                    const stages = new Set(csvData.map(row => row[statusField.sourceField]).filter(Boolean));
                    return stages.size || 'N/A';
                  })()}
                </p>
              </div>
            </div>

            {/* Sample rows */}
            <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6 mb-8">
              <h3 className="font-semibold text-text-primary mb-4">Sample Records (first 20)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text-tertiary border-b border-brand-600/20">
                      {headers.slice(0, 6).map(header => (
                        <th key={header} className="pb-2 pr-4">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    {csvData.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="border-b border-brand-600/10">
                        {headers.slice(0, 6).map(header => (
                          <td key={header} className="py-2 pr-4">{row[header] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('map')}
                className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleLaunch}
                className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-colors"
              >
                Generate Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-950 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
