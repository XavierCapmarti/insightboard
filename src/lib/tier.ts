/**
 * Tier Gating
 * ===========
 * Simple free/pro tier logic using localStorage.
 * Replace with real auth + Stripe lookup once payments are wired up.
 */

export type Tier = 'free' | 'pro';

export interface TierLimits {
  maxUploads: number;
  features: string[];
}

const TIER_CONFIG: Record<Tier, TierLimits> = {
  free: {
    maxUploads: 1,
    features: [
      'funnel_analysis',
      'kpi_cards',
      'stage_metrics',
      'magic_insight',
    ],
  },
  pro: {
    maxUploads: Infinity,
    features: [
      'funnel_analysis',
      'kpi_cards',
      'stage_metrics',
      'magic_insight',
      'rep_leaderboard',
      'time_series',
      'deal_quality',
      'cycle_time',
      'date_filter',
      'csv_export',
      'google_sheets',
    ],
  },
};

const STORAGE_KEY = 'clarlens_tier';

export function getTier(): Tier {
  if (typeof window === 'undefined') return 'free';
  return (localStorage.getItem(STORAGE_KEY) as Tier) || 'free';
}

export function setTier(tier: Tier): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, tier);
}

export function getTierLimits(tier?: Tier): TierLimits {
  return TIER_CONFIG[tier ?? getTier()];
}

export function hasFeature(feature: string, tier?: Tier): boolean {
  return getTierLimits(tier).features.includes(feature);
}

export function isPro(tier?: Tier): boolean {
  return (tier ?? getTier()) === 'pro';
}

export const PRO_FEATURES = TIER_CONFIG.pro.features.filter(
  (f) => !TIER_CONFIG.free.features.includes(f)
);
