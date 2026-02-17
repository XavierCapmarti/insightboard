# ClarLens

**CSV to insights in 5 minutes**

Upload your CSV and get instant insights. No setup, no code, just clarity.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3002
```

## Project Structure

```
insightboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── onboarding/         # Onboarding flow
│   │   └── dashboard/          # Dashboard views
│   │
│   ├── adapters/               # Data source adapters
│   │   ├── base.ts             # Base adapter class
│   │   ├── csv.ts              # CSV upload adapter
│   │   ├── google-sheets.ts    # Google Sheets adapter
│   │   ├── generic-crm.ts      # Generic REST API adapter
│   │   └── index.ts            # Adapter registry
│   │
│   ├── engine/                 # Metrics computation
│   │   ├── metrics.ts          # Core metrics engine
│   │   ├── funnel.ts           # Funnel analysis
│   │   └── index.ts
│   │
│   ├── templates/              # Dashboard templates (JSON)
│   │   ├── revenue-overview.json
│   │   ├── funnel-analysis.json
│   │   ├── performance-by-owner.json
│   │   ├── time-to-close.json
│   │   └── index.ts
│   │
│   └── types/                  # TypeScript interfaces
│       ├── core.ts             # Core domain models
│       ├── adapters.ts         # Adapter contracts
│       ├── dashboard.ts        # Dashboard configuration
│       └── index.ts
│
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Architecture

### 1. Data Adapter Layer

All data sources implement the `DataAdapter` interface:

```typescript
interface DataAdapter<TRawData> {
  type: string;
  name: string;
  supportedFormats: string[];
  
  ingest(config: DataSourceConfig): Promise<IngestResult<TRawData>>;
  normalise(rawData: TRawData, mappings: FieldMapping[]): Promise<NormaliseResult>;
  validate(data: NormaliseResult): Promise<ValidationResult>;
  preview(rawData: TRawData, mappings: FieldMapping[], limit?: number): Promise<PreviewResult>;
  detectSchema(rawData: TRawData): Promise<DetectedSchema>;
}
```

**Built-in adapters:**
- `CSVUploadAdapter` - Upload CSV/TSV files
- `GoogleSheetsAdapter` - Connect to Google Spreadsheets
- `GenericCRMAdapter` - REST API integration

**Adding a new adapter:**

```typescript
import { BaseAdapter } from './base';

export class MyAdapter extends BaseAdapter<MyRawData> {
  readonly type = 'my_source';
  readonly name = 'My Data Source';
  readonly supportedFormats = ['custom'];

  async ingest(config: DataSourceConfig): Promise<IngestResult<MyRawData>> {
    // Fetch data from your source
  }

  protected getRows(rawData: MyRawData): unknown[] {
    // Extract rows from raw data
  }

  protected getFieldNames(rawData: MyRawData): string[] {
    // Return field names
  }

  protected detectFields(rawData: MyRawData): DetectedField[] {
    // Detect field types
  }
}

// Register in src/adapters/index.ts
adapterRegistry.register(new MyAdapter());
```

### 2. Core Data Models

All data is normalised to these generic entities:

```typescript
interface Record {
  id: string;
  externalId?: string;
  ownerId: string;
  value?: number;
  status: string;
  metadata: RecordMetadata;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

interface StageEvent {
  id: string;
  recordId: string;
  fromStage: string | null;
  toStage: string;
  timestamp: Date;
  durationInPreviousStage?: number;
}

interface Actor {
  id: string;
  name: string;
  email?: string;
  role?: string;
  team?: string;
}
```

### 3. Metrics Engine

Compute metrics from normalised data:

```typescript
import { createMetricsEngine, createPeriod } from '@/engine';

const engine = createMetricsEngine(records, stageEvents);

const revenueMetric: MetricDefinition = {
  id: 'total_revenue',
  name: 'Total Revenue',
  aggregation: 'sum',
  formula: { type: 'field', field: 'value' },
  format: { type: 'currency', currency: 'USD' },
};

const period = createPeriod('month');
const result = engine.compute(revenueMetric, period);
console.log(result.formattedValue); // "$847,230"
```

**Supported aggregations:**
- `count` - Count of records
- `sum` - Sum of a field
- `average` - Average value
- `min` / `max` - Extremes
- `median` - Median value
- `conversion_rate` - Percentage converted
- `cycle_time` - Average time to close

### 4. Dashboard Templates

Dashboards are JSON-configurable:

```json
{
  "id": "revenue-overview",
  "name": "Revenue Overview",
  "template": "revenue_overview",
  "sections": [
    {
      "id": "kpis",
      "widgets": [
        {
          "id": "total-revenue",
          "type": "kpi_card",
          "position": { "x": 0, "y": 0, "width": 3, "height": 2 },
          "config": {
            "type": "kpi_card",
            "metricId": "total_revenue",
            "showComparison": true
          }
        }
      ]
    }
  ]
}
```

**Available widget types:**
- `kpi_card` - Single metric with comparison
- `line_chart` - Time series
- `bar_chart` - Categorical comparison
- `pie_chart` - Distribution
- `funnel_chart` - Pipeline stages
- `table` - Data grid
- `leaderboard` - Ranked list
- `progress_bar` - Goal tracking

### 5. Onboarding Flow

The onboarding wizard guides users through:

1. **Source Selection** - Choose data source type
2. **Connection** - Configure and connect
3. **Field Mapping** - Map source fields to core schema
4. **Preview** - Review normalised data
5. **Launch** - Create dashboard

## Extending the Platform

### Adding a New Widget Type

1. Define the widget config type in `src/types/dashboard.ts`
2. Create the widget component in `src/components/widgets/`
3. Register in the widget renderer

### Adding a New Metric Type

1. Add aggregation type to `AggregationType` union
2. Implement in `MetricsEngine.aggregate()`
3. Add formatting if needed

### Creating Custom Templates

1. Create JSON file in `src/templates/`
2. Define sections, widgets, and filters
3. Register in `src/templates/index.ts`

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Validation:** Zod
- **Date Handling:** date-fns

## Roadmap

- [ ] API routes for data ingestion
- [ ] Real Google Sheets OAuth integration
- [ ] Stripe adapter
- [ ] Airtable adapter
- [ ] Notion adapter
- [ ] Dashboard sharing and embedding
- [ ] Scheduled email reports
- [ ] Team/workspace management
- [ ] Custom metric builder UI
- [ ] Alert/notification rules

## License

MIT

