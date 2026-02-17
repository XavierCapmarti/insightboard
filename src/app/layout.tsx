import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'ClarLens - CSV to Insights in 5 Minutes',
  description: 'Upload your CSV and get instant insights. No setup, no code, just clarity.',
  keywords: ['analytics', 'dashboard', 'CSV', 'data visualization', 'insights'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="min-h-screen bg-surface text-text-primary antialiased overflow-x-hidden">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

