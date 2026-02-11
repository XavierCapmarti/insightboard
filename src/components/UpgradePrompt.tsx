'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
}

export default function UpgradePrompt({ feature }: UpgradePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl bg-surface-secondary border border-surface-tertiary text-center">
      <Lock className="w-8 h-8 text-text-tertiary mb-4" />
      <h3 className="font-semibold text-text-primary mb-2">
        {feature} is a Pro feature
      </h3>
      <p className="text-sm text-text-secondary mb-6 max-w-md">
        Upgrade to Pro to unlock {feature.toLowerCase()}, unlimited uploads, Google Sheets, and more.
      </p>
      <Link
        href="/#pricing"
        className="px-6 py-2.5 bg-brand-950 text-surface text-sm font-medium rounded-lg hover:bg-brand-900 transition-colors"
      >
        View Plans — Starting at $29/mo
      </Link>
    </div>
  );
}
