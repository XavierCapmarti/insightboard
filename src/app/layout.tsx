import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InsightBoard - Analytics Made Simple',
  description: 'Plug-and-play analytics for SMEs. Connect your data, get insights instantly.',
  keywords: ['analytics', 'dashboard', 'business intelligence', 'SME', 'data visualization'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface antialiased">
        {children}
      </body>
    </html>
  );
}

