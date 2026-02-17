# CLAUDE.md - ClarLens (InsightBoard)

## Project Overview

ClarLens is a SaaS analytics platform for SMEs that turns CSV data into actionable dashboards. Users upload CSV files, map fields to a universal schema, and get real-time analytics with pre-built templates. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Recharts.

**Tagline:** "CSV to insights in 5 minutes"

## Quick Reference

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3001
npm run build        # Production build (includes ESLint)
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run Jest tests
npm run test:watch   # Jest in watch mode
```

**Dev server runs on port 3001**, not the default 3000.

## Architecture

### Adapter-Engine-Template Pipeline

```
CSV/Data Source -> Adapters -> Normalize to Core Models -> Engines -> Dashboard Templates -> React UI
```

**Adapters** (`src/adapters/`) - Pluggable data source connectors. Each adapter implements `DataAdapter<TRawData>` via `BaseAdapter`. Three registered:
- `CSVUploadAdapter` - Fully implemented. Parses CSV, auto-detects types.
- `GoogleSheetsAdapter` - Scaffolded, needs OAuth.
- `GenericCRMAdapter` - Scaffolded, REST API integration.

**Engines** (`src/engine/`) - Stateless computation:
- `MetricsEngine` - Aggregations (count, sum, avg, min, max, median, percentile, conversion_rate, cycle_time), period comparison, grouping, filtering.
- `FunnelEngine` - Pipeline analysis, stage conversion rates, drop-off, cycle time.

**Templates** (`src/templates/`) - JSON-configurable dashboard layouts defining widgets, positions, metrics, and filters. Four pre-built: revenue-overview, funnel-analysis, performance-by-owner, time-to-close.

### Core Data Models (`src/types/core.ts`)

Industry-agnostic entities designed to represent deals, orders, tickets, leads, etc.:
- `DataRecord` - Universal tracked entity with id, ownerId, value, status, metadata, timestamps.
- `StageEvent` - Pipeline stage transitions with timing.
- `Actor` - Users/owners/assignees.
- `Category` - Grouping/segmentation.
- `MetricDefinition` - Configurable metric with aggregation, formula, format, and comparison.
- `Period` - Time ranges (day, week, month, quarter, year, custom).
- `Workspace` - Multi-tenant structure.

### State Management

Client-side only (no database yet). CSV data and field mappings are persisted in `sessionStorage` between the onboarding wizard and dashboard page.

## Directory Structure

```
src/
  app/                        # Next.js App Router
    layout.tsx                # Root layout (dark theme, Inter/Cal Sans fonts)
    page.tsx                  # Landing page (hero, CTAs, sample CSV buttons)
    globals.css               # Global styles (dark theme CSS variables)
    onboarding/page.tsx       # 3-step wizard: upload -> map fields -> preview
    dashboard/page.tsx        # Main analytics dashboard with charts and filters
    api/
      ingest/route.ts         # POST: CSV upload, schema detection
      metrics/route.ts        # GET: Compute metrics from stored data
      templates/route.ts      # GET: List dashboard templates
      test-email/route.ts     # POST: Send test email via Resend
      sheets/
        fetch/route.ts        # GET: Fetch Google Sheets data
        metadata/route.ts     # GET: Sheet metadata
        link/route.ts         # POST: Link sheet to account
  adapters/
    base.ts                   # BaseAdapter abstract class
    csv.ts                    # CSV parser and adapter (fully implemented)
    google-sheets.ts          # Google Sheets adapter (scaffolded)
    generic-crm.ts            # REST API adapter (scaffolded)
    index.ts                  # AdapterRegistry - register and discover adapters
  engine/
    metrics.ts                # MetricsEngine class
    funnel.ts                 # FunnelEngine class
    index.ts                  # Re-exports
  types/
    core.ts                   # Core domain models
    adapters.ts               # Adapter interfaces and result types
    dashboard.ts              # Dashboard, widget, template types
    index.ts                  # Re-exports
  lib/
    utils.ts                  # cn(), formatCurrency, formatNumber, generateId, debounce, throttle, groupBy, safeJsonParse, getChartColor
    filters.ts                # Apply filters to CSV data, extract filter options
    timeSeries.ts             # Time series metric computation
    repPerformance.ts         # Rep/owner performance metrics
    dealQuality.ts            # Deal quality/size distribution analysis
    stageDuration.ts          # Stage duration analysis
    sheets.ts                 # Google Sheets API client
    resend.ts                 # Email service client (Resend)
  components/
    charts/
      TimeSeriesChart.tsx     # Line/area charts for trends (Recharts)
      RepLeaderboard.tsx      # Ranked performance leaderboard
      DealQualityChart.tsx    # Deal size distribution
      StageDurationChart.tsx  # Time-in-stage analysis
    filters/
      DashboardFilters.tsx    # Period, owner, stage filter dropdowns
    sheets/
      SheetLinker.tsx         # Google Sheets linking UI
  templates/
    revenue-overview.json     # Revenue KPIs, trends, breakdowns
    funnel-analysis.json      # Pipeline funnel visualization
    performance-by-owner.json # Rep leaderboards, team comparison
    time-to-close.json        # Cycle time analysis
    index.ts                  # Template registry and utilities
public/
  sample-data.csv             # 50-row sales pipeline (default sample)
  sample-sales-pipeline.csv   # Extended sales dataset
  sample-ecommerce-orders.csv # E-commerce fulfillment pipeline
  sample-leads.csv            # Lead conversion funnel
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **UI:** React 18.3, Tailwind CSS 3.4, Lucide React icons
- **Charts:** Recharts 2.12
- **Validation:** Zod 3.23
- **Dates:** date-fns 3.6
- **IDs:** uuid 9.0
- **Class merging:** clsx + tailwind-merge (via `cn()` helper in `src/lib/utils.ts`)
- **Linting:** ESLint 8
- **Testing:** Jest 29 (configured, no tests written yet)

## Coding Conventions

### File & Naming

- **Components:** PascalCase files and exports (`TimeSeriesChart.tsx`)
- **Utilities/libs:** camelCase files (`timeSeries.ts`, `utils.ts`)
- **Types/interfaces:** PascalCase (`DataRecord`, `MetricDefinition`)
- **API routes:** Lowercase directories following Next.js conventions (`/api/sheets/fetch/route.ts`)
- **Imports:** Use `@/*` path alias (maps to `./src/*`), avoid relative paths

### Components

- Functional components with React hooks
- `'use client'` directive on all interactive components
- Props interfaces defined directly above or inside the component file
- Use `useMemo` for expensive computations
- No global state library - use React hooks and sessionStorage

### Styling

- Tailwind utility classes exclusively; no inline styles
- Use `cn()` from `src/lib/utils.ts` to merge classes (combines `clsx` + `tailwind-merge`)
- Dark theme: backgrounds use `surface-*` tokens (#0a0a0a, #171717, #262626), text uses `text-*` tokens (#ffffff, #d4d4d4, #a3a3a3)
- Custom color tokens defined in `tailwind.config.js` under `brand`, `surface`, `text`
- Mobile-first responsive design

### TypeScript

- Strict mode enabled
- Use Zod for runtime validation (API inputs, environment variables)
- Avoid `any` - use explicit types for props, state, and function signatures
- Core domain types in `src/types/core.ts`; adapter types in `src/types/adapters.ts`; dashboard types in `src/types/dashboard.ts`

### Error Handling

- API routes: try-catch with `NextResponse.json()` returning `{ error: string }` and appropriate status codes
- Adapters: return `ValidationResult` with `errors[]` (blocking) and `warnings[]` (non-blocking)
- UI: Friendly error messages tied to user actions

### Formatting Utilities

Use the helpers in `src/lib/utils.ts` for consistent formatting:
- `formatCurrency(value, currency?)` - Currency with symbol
- `formatNumber(value)` - Thousands separators
- `formatPercent(value)` - Percentage with % sign
- `formatDuration(ms)` - Human-readable duration
- `getChartColor(index)` - Rotating color palette for charts

## User Flow

```
/ (Landing) -> /onboarding (Upload CSV -> Map Fields -> Preview) -> /dashboard (Analytics)
```

Data is passed between pages via `sessionStorage` keys for `csvData` and field `mappings`.

## Environment Variables

No environment variables are required for the MVP (works with sample data out of the box).

Optional variables (see `.env.example`):
```
RESEND_API_KEY          # Email service (resend.com)
EMAIL_FROM              # Sender email address
GOOGLE_SHEETS_CLIENT_EMAIL  # Google Sheets service account
GOOGLE_SHEETS_PRIVATE_KEY   # Google Sheets private key
DATABASE_URL            # Future database connection
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ingest` | Upload CSV content, detect schema, return field mappings |
| GET | `/api/metrics` | Compute metrics with period/metric filters |
| GET | `/api/templates` | List available dashboard templates |
| POST | `/api/test-email` | Send test email via Resend |
| GET | `/api/sheets/fetch` | Fetch data from Google Sheets |
| GET | `/api/sheets/metadata` | Get sheet metadata |
| POST | `/api/sheets/link` | Link user account to a sheet |

## Extension Points

### Adding a New Data Adapter

1. Create `src/adapters/my-adapter.ts` extending `BaseAdapter<TRawData>`
2. Implement `getRows()`, `getFieldNames()`, `detectFields()`
3. Register in `src/adapters/index.ts`: `adapterRegistry.register(new MyAdapter())`

### Adding a New Dashboard Template

1. Create `src/templates/my-template.json` following the schema in `src/types/dashboard.ts`
2. Define sections with widgets (type, position, config, metrics)
3. Register in `src/templates/index.ts`

### Adding a New Widget Type

1. Add the type to `WidgetType` union in `src/types/dashboard.ts`
2. Create the React component in `src/components/charts/`
3. Handle rendering in the dashboard page

### Adding a New Metric Aggregation

1. Add the type to `AggregationType` in `src/types/core.ts`
2. Implement the computation in `MetricsEngine.computeAggregation()` in `src/engine/metrics.ts`

## Current Status

**Track A (MVP) is complete:**
- CSV upload, parsing, auto-mapping
- Core data model normalization
- Metrics engine with 8 aggregation types
- Funnel analysis engine
- 4 pre-built dashboard templates
- Dark theme UI
- Period filtering and comparison

**Planned (not yet implemented):**
- Google Sheets OAuth integration
- Database persistence (Supabase/PostgreSQL)
- Authentication (Clerk/NextAuth)
- Additional adapters (Stripe, Airtable, Notion)
- Dashboard sharing and embedding
- Scheduled email reports
- Team/workspace management
- Custom metric builder UI
