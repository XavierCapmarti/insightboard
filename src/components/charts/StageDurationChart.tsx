'use client';

import { useMemo } from 'react';
import { Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { computeStageDurations, computeTimeToClose } from '@/lib/stageDuration';

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

export function StageDurationChart({ csvData, mappings }: {
  csvData: CSVRow[];
  mappings: FieldMapping[];
}) {
  const durations = useMemo(() => 
    computeStageDurations(csvData, mappings),
    [csvData, mappings]
  );

  const timeToClose = useMemo(() => 
    computeTimeToClose(csvData, mappings),
    [csvData, mappings]
  );

  if (durations.length === 0 && !timeToClose) {
    return (
      <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-brand-950" />
          <h3 className="font-semibold text-text-primary">Stage Duration Predictions</h3>
        </div>
        <p className="text-sm text-text-tertiary">
          No duration data available. Make sure your CSV includes created_at and updated_at fields.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Time to Close */}
      {timeToClose && (
        <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-brand-950" />
            <h3 className="font-semibold text-text-primary">Time to Close</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-surface-tertiary/50 rounded-lg p-4">
              <p className="text-xs text-text-tertiary mb-1">Average</p>
              <p className="text-2xl font-bold text-text-primary">{timeToClose.avgDays} days</p>
            </div>
            <div className="bg-surface-tertiary/50 rounded-lg p-4">
              <p className="text-xs text-text-tertiary mb-1">Median</p>
              <p className="text-2xl font-bold text-text-primary">{timeToClose.medianDays} days</p>
            </div>
            <div className="bg-surface-tertiary/50 rounded-lg p-4">
              <p className="text-xs text-text-tertiary mb-1">Fastest</p>
              <p className="text-2xl font-bold text-text-primary">{timeToClose.minDays} days</p>
            </div>
            <div className="bg-surface-tertiary/50 rounded-lg p-4">
              <p className="text-xs text-text-tertiary mb-1">Slowest</p>
              <p className="text-2xl font-bold text-text-primary">{timeToClose.maxDays} days</p>
            </div>
          </div>
          <p className="text-xs text-text-tertiary mt-4">
            Based on {timeToClose.sampleSize} closed deals
          </p>
        </div>
      )}

      {/* Stage-by-Stage Durations */}
      {durations.length > 0 && (
        <div className="bg-surface-secondary rounded-lg border border-brand-600/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-950" />
            <h3 className="font-semibold text-text-primary">Stage Duration Predictions</h3>
          </div>
          
          <div className="space-y-4">
            {durations.map((duration) => {
              const isSlow = duration.avgDays > 30;
              
              return (
                <div
                  key={duration.stage}
                  className="p-4 bg-surface-tertiary/50 rounded-lg border border-surface-tertiary"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-text-primary mb-1">{duration.stage}</h4>
                      {duration.prediction && (
                        <p className="text-sm text-text-secondary">{duration.prediction}</p>
                      )}
                    </div>
                    {isSlow && (
                      <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Average</p>
                      <p className="text-lg font-bold text-text-primary">{duration.avgDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Median</p>
                      <p className="text-lg font-bold text-text-primary">{duration.medianDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Range</p>
                      <p className="text-lg font-bold text-text-primary">
                        {duration.minDays}-{duration.maxDays} days
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Sample Size</p>
                      <p className="text-lg font-bold text-text-primary">{duration.sampleSize} deals</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

