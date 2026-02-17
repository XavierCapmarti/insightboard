'use client';

import { useState } from 'react';
import { FileSpreadsheet, Link2, Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { sheetsClient } from '@/lib/sheets';

interface SheetLinkerProps {
  onSheetLinked: (data: { headers: string[]; rows: Record<string, string>[] }) => void;
  isSubscribed?: boolean;
}

export function SheetLinker({ onSheetLinked, isSubscribed = false }: SheetLinkerProps) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sheetName, setSheetName] = useState('');

  if (!isSubscribed) {
    return (
      <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-brand-950/20 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-brand-950" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-2">Google Sheets Integration</h3>
            <p className="text-sm text-text-secondary mb-4">
              Link your Google Sheets for automatic data sync. Requires a subscription.
            </p>
            <button className="px-4 py-2 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLink = async () => {
    if (!sheetUrl.trim()) {
      setError('Please enter a Google Sheets URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Parse spreadsheet ID from URL
      const spreadsheetId = sheetsClient.parseSpreadsheetUrl(sheetUrl);
      if (!spreadsheetId) {
        throw new Error('Invalid Google Sheets URL. Please paste the full URL.');
      }

      // Fetch sheet metadata to get available tabs
      const metadataResponse = await fetch(
        `/api/sheets/metadata?spreadsheetId=${encodeURIComponent(spreadsheetId)}`
      );
      
      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.error || 'Failed to access sheet');
      }

      const { data: metadata } = await metadataResponse.json();
      
      // Use first sheet if no sheet name specified
      const targetSheet = sheetName || metadata.sheets[0]?.title || 'Sheet1';
      const range = `${targetSheet}!A:Z`;

      // Fetch sheet data
      const fetchResponse = await fetch(
        `/api/sheets/fetch?spreadsheetId=${encodeURIComponent(spreadsheetId)}&range=${encodeURIComponent(range)}&sheetName=${encodeURIComponent(targetSheet)}`
      );

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        throw new Error(errorData.error || 'Failed to fetch sheet data');
      }

      const { data } = await fetchResponse.json();
      
      setSuccess(true);
      onSheetLinked({ headers: data.headers, rows: data.rows });
    } catch (err: any) {
      setError(err.message || 'Failed to link sheet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-lg bg-brand-950/20 flex items-center justify-center flex-shrink-0">
          <FileSpreadsheet className="w-6 h-6 text-brand-950" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary mb-2">Link Google Sheet</h3>
          <p className="text-sm text-text-secondary mb-4">
            Connect your Google Sheet for automatic data sync. Make sure to share the sheet with:{' '}
            <code className="text-xs bg-surface-tertiary px-2 py-1 rounded text-brand-950">
              {sheetsClient.serviceAccountEmail}
            </code>
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-400">{error}</p>
            {error.includes('Permission denied') && (
              <p className="text-xs text-red-300 mt-1">
                Click{' '}
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetsClient.parseSpreadsheetUrl(sheetUrl)}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  here
                </a>{' '}
                to open the sheet and share it with the service account email.
              </p>
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-400" />
          <p className="text-sm text-green-400">Sheet linked successfully!</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Google Sheets URL
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full pl-10 pr-4 py-2 bg-surface-tertiary border border-surface-tertiary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-950 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleLink}
              disabled={isLoading || !sheetUrl.trim()}
              className="px-6 py-2 bg-brand-950 text-surface font-medium rounded-lg hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Link Sheet
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-xs text-text-tertiary bg-surface-tertiary/50 p-3 rounded-lg">
          <p className="font-medium mb-1">How to share your sheet:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Open your Google Sheet</li>
            <li>Click &quot;Share&quot; button (top right)</li>
            <li>Add this email: <code className="bg-surface px-1 rounded">{sheetsClient.serviceAccountEmail}</code></li>
            <li>Give it &quot;Viewer&quot; access</li>
            <li>Click &quot;Send&quot;</li>
          </ol>
        </div>
      </div>
    </div>
  );
}


