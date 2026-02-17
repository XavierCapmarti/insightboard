# ClarLens Track A - Definition of Done

## Part 1: Rename InsightBoard → ClarLens ✅

### Acceptance Criteria:
- [x] All UI components show "ClarLens" (not InsightBoard)
- [x] Metadata (title, description) updated
- [x] README and PROJECT_LOG updated
- [x] Email templates updated
- [x] No "InsightBoard" visible to users

## Part 2: Track A - CSV → Insight in 5 Minutes ✅

### 1. Landing Page
- [x] Clear value statement: "CSV to insights in 5 minutes"
- [x] Primary CTA: "Upload CSV" button
- [x] Secondary CTA: "Try with sample CSV" button
- [x] Sample CSV loads instantly (no external download)

### 2. Upload Flow
- [x] Drag & drop zone visible
- [x] File picker button works
- [x] Validates: empty file, bad delimiter, missing headers
- [x] Friendly error messages
- [x] Shows file name after selection

### 3. Field Mapping
- [x] Auto-suggests mappings (best effort)
- [x] Required fields clearly marked:
  - Stage/Status (required)
  - Date (created or updated) (required)
  - Owner/Person (optional but preferred)
  - Value/Amount (optional)
- [x] Clear guidance text (short)
- [x] Can proceed with minimal fields

### 4. Preview
- [x] Shows first ~20 rows in table
- [x] Detected summary shows:
  - Row count
  - Date range
  - Unique owners count
  - Unique stages count
- [x] "Continue to Dashboard" button

### 5. Dashboard Render
- [x] Renders funnel-analysis.json template fully
- [x] All widgets use REAL computed metrics from CSV (no placeholders)
- [x] Default period: last 90 days
- [x] Period selector works (optional)
- [x] Magic moment insight callout:
  - Shows biggest drop-off between stages OR
  - Median time to close OR
  - Top owner by conversions
- [x] Insight is accurate based on computed data

## Part 3: Design Theme ✅

### Dark, Sober, Edgy Aesthetic
- [x] Charcoal/near-black surfaces (#0a0a0a, #111111)
- [x] Subtle contrast (not harsh)
- [x] Restrained highlights (minimal color, muted)
- [x] No gradients (except subtle if needed)
- [x] No neon colors
- [x] Strong typography (Inter, clear hierarchy)
- [x] Compact spacing (not cramped, but efficient)
- [x] Polished empty states
- [x] Professional B2B feel (not gamer UI)

## Files Changed
- `src/app/layout.tsx` - Metadata rename
- `src/app/page.tsx` - Landing page redesign + CSV flow
- `src/app/onboarding/page.tsx` - CSV upload flow
- `src/app/dashboard/page.tsx` - Dark theme + real metrics
- `src/app/globals.css` - Dark theme variables
- `tailwind.config.js` - Dark color palette
- `README.md` - Updated project name
- `PROJECT_LOG.md` - Updated references
- `public/sample-data.csv` - Sample CSV dataset
- `src/app/api/ingest/route.ts` - CSV processing
- `src/app/api/metrics/route.ts` - Real metrics computation

## How to Run Locally

```bash
cd ~/Documents/insightboard
npm install
npm run dev
```

Visit: http://localhost:3001

## Environment Variables

None required for Track A (CSV upload works without external services).

Optional (for future):
- `RESEND_API_KEY` - For email features
- `EMAIL_FROM` - Email sender

## Sample CSV

Located at: `public/sample-data.csv`

Contains:
- 50 rows of sample deal/pipeline data
- Columns: id, owner, stage, value, created_at, updated_at, closed_at
- Loads via "Try with sample CSV" button on landing page


