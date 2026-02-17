# ClarLens - Claude Code Setup Guide

**CSV to insights in 5 minutes** - Plug-and-play analytics SaaS for SMEs

## Quick Start

```bash
cd /Users/xavier.capmarti/Documents/insightboard
npm install
npm run dev
# Open http://localhost:3002
```

## Project Overview

ClarLens is a Next.js 16 analytics dashboard that ingests CSV data and generates instant insights. Users upload CSVs, map fields, and get funnel analysis, conversion metrics, and drop-off insights.

**Tech Stack:**
- Next.js 16.1.5 (App Router)
- React 19.2.4
- TypeScript 5
- Tailwind CSS
- Recharts for visualizations

## Key Files & Structure

### Entry Points
- `src/app/page.tsx` - Landing page with "Try sample dataset" button
- `src/app/onboarding/page.tsx` - CSV upload → mapping → preview flow
- `src/app/dashboard-template/page.tsx` - Main dashboard with magic insight callout

### Core Systems (DO NOT MODIFY unless fixing bugs)
- `src/lib/datasetStore.ts` - Hybrid storage (memory + file persistence)
- `src/engine/funnel.ts` - Funnel metrics with predefined stage ordering
- `src/engine/metrics.ts` - Core metrics computation
- `src/adapters/` - Data source adapters (CSV, Google Sheets, Generic CRM)

### API Routes
- `src/app/api/ingest/route.ts` - Data ingestion endpoint
- `src/app/api/dataset/[datasetId]/metrics/route.ts` - Metrics computation (uses `period=all` by default)

### Data Files
- `public/sample-data.csv` - Compelling demo dataset (100 deals, 15% conversion)
- `data/datasets/` - Persisted datasets (auto-created)

## Current Features (Working)

✅ **CSV Upload Flow**
- Upload → Auto-detect fields → Map → Preview → Dashboard
- "Try sample dataset" button for instant demo
- Loading states and error handling

✅ **Persistence**
- Datasets persist to `data/datasets/*.json`
- Survives server restart
- Hybrid memory cache + file storage

✅ **Metrics**
- Funnel analysis with cumulative counts
- Conversion rates and drop-off detection
- Cycle time calculation
- Predefined stage ordering (prospecting → qualification → proposal → negotiation → closed_won)

✅ **Magic Insight**
- Shows biggest drop-off at top of dashboard
- Uses `period=all` to show all historical data
- Format: "Biggest drop-off is X → Y (Z%)"

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# Required
SESSION_SECRET=your-secure-random-string-here-change-this-in-production

# Optional (for Google Sheets OAuth)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google/callback

# Optional (for email)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
```

## Architecture Highlights

### Data Flow
1. User uploads CSV → `onboarding/page.tsx`
2. CSV parsed → Auto-suggest field mappings
3. User confirms mappings → Calls `/api/ingest`
4. Adapter normalizes data → Stores in `datasetStore`
5. Dataset persisted to `data/datasets/{datasetId}.json`
6. Dashboard loads → Calls `/api/dataset/{datasetId}/metrics?period=all`
7. Metrics computed → Funnel engine calculates cumulative counts
8. Magic insight extracted → Biggest drop-off shown at top

### Stage Ordering
Stages are automatically ordered by predefined progression map:
- `prospecting` (order 1) → `qualification` (order 3) → `proposal` (order 6) → `negotiation` (order 7) → `closed_won` (order 8)

Unknown stages get order 999 and appear at end.

### Persistence Logic
- `storeDataset()` - Saves to memory cache + file (`data/datasets/`)
- `getDataset()` - Checks memory first, falls back to file
- Datasets survive server restarts

## Known Issues / Recent Fixes

✅ **Fixed:** Period filtering bug - Changed default from `month` to `all` so historical data shows
✅ **Fixed:** File persistence - Wired up `saveDataset()`/`loadDataset()` calls
✅ **Fixed:** Stage ordering - Added predefined progression map
✅ **Fixed:** Demo data - Created compelling dataset (100 deals, 15% conversion, clear drop-offs)

## Testing the Demo

1. Start server: `npm run dev`
2. Visit: `http://localhost:3002`
3. Click "Try sample dataset" button
4. Should redirect to dashboard showing:
   - Total Pipeline: 100
   - Overall Conversion: 15.0%
   - Biggest Drop-off: "prospecting → qualification (40.0%)"
   - Funnel stages: 100 → 60 → 40 → 25 → 15

## Important Constraints

⚠️ **DO NOT:**
- Modify core systems (datasetStore, funnel engine, metrics engine) unless fixing bugs
- Add new features (OAuth, adapters, Stripe, sharing) during polish work
- Refactor architecture unnecessarily
- Change persistence logic (it's working correctly)

✅ **DO:**
- Fix UI bugs and improve UX
- Add loading states and empty states
- Improve copy and messaging
- Polish existing features

## File Locations Reference

```
insightboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── onboarding/page.tsx         # Upload flow
│   │   ├── dashboard-template/page.tsx  # Dashboard view
│   │   └── api/
│   │       ├── ingest/route.ts          # Data ingestion
│   │       └── dataset/[datasetId]/metrics/route.ts  # Metrics API
│   ├── lib/
│   │   ├── datasetStore.ts             # Persistence (memory + file)
│   │   └── fileStorage.ts              # File I/O helpers
│   ├── engine/
│   │   ├── funnel.ts                   # Funnel analysis + stage ordering
│   │   └── metrics.ts                  # Core metrics
│   └── adapters/                       # Data source adapters
├── public/
│   └── sample-data.csv                  # Demo dataset
├── data/
│   └── datasets/                        # Persisted datasets (auto-created)
├── package.json                         # Dependencies
├── .env.example                         # Environment template
└── README.md                            # Full documentation
```

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (port 3002)
npm run build            # Production build
npm run start            # Production server

# Testing
npm test                 # Run tests
npm run lint             # Lint code

# Data
ls data/datasets/        # View persisted datasets
```

## Demo Dataset Stats

The `public/sample-data.csv` contains:
- **100 deals** total
- **15 closed won** (15% conversion)
- **Clear drop-offs:** 40% at prospecting→qualification
- **Cycle times:** 30-90 days for closed deals
- **Stages:** prospecting, qualification, proposal, negotiation, closed_won

This creates compelling metrics that demonstrate ClarLens' value.

---

**Last Updated:** Feb 3, 2026
**Status:** Production-ready for demo, persistence working, compelling sample data
