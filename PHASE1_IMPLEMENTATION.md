# Phase 1 Implementation Plan

## Overview
Implementing Phase 1 features + Google Sheets integration for subscribed users.

## Architecture Decisions

### Google Sheets Integration
**Option A: OAuth2 (User-level access)** ✅ Recommended
- Users authenticate with their Google account
- Each user can link their own sheets
- More secure, follows Google best practices
- Requires OAuth setup

**Option B: Service Account (App-level access)**
- Single service account for all users
- Users share sheets with service account email
- Simpler setup, but less secure
- Good for MVP/testing

**Decision: Start with Service Account for MVP, add OAuth later**

### Subscription System
**Simple approach for MVP:**
- Store subscription status in localStorage/sessionStorage (client-side)
- Add subscription check middleware
- Later: Move to database + payment integration

**Future:**
- Database (PostgreSQL/Supabase)
- Stripe integration
- User accounts with email/password or OAuth

## Implementation Steps

### Step 1: Google Sheets Integration (Service Account)
1. ✅ Copy Sheets client from sales-dashboarding project
2. ✅ Create API route for fetching sheet data
3. ✅ Update Google Sheets adapter to use real API
4. ✅ Add sheet linking UI in onboarding

### Step 2: Subscription Gating
1. ✅ Add subscription status check
2. ✅ Show upgrade prompt for non-subscribers
3. ✅ Allow CSV upload for free users
4. ✅ Require subscription for Sheets linking

### Step 3: Phase 1 Features
1. ✅ Time Series Charts
2. ✅ Rep Performance Leaderboard
3. ✅ Deal Quality Metrics

## File Structure

```
src/
├── lib/
│   └── sheets.ts                    # Google Sheets client
├── app/
│   ├── api/
│   │   └── sheets/
│   │       ├── connect/route.ts     # OAuth callback
│   │       ├── fetch/route.ts       # Fetch sheet data
│   │       └── link/route.ts        # Link sheet to user
│   └── dashboard/
│       └── page.tsx                 # Enhanced dashboard
├── components/
│   ├── charts/
│   │   ├── TimeSeriesChart.tsx     # Deal velocity over time
│   │   ├── RepLeaderboard.tsx       # Rep performance
│   │   └── DealQualityChart.tsx     # Deal size distribution
│   └── sheets/
│       └── SheetLinker.tsx          # Sheet linking UI
└── types/
    └── subscription.ts              # Subscription types
```

## Environment Variables Needed

```env
# Google Sheets (Service Account)
GOOGLE_SHEETS_CREDENTIALS_PATH=./sheets-credentials.json
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=sheets-bot@your-project.iam.gserviceaccount.com

# Or OAuth (future)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/sheets/connect
```

## API Routes

### POST /api/sheets/link
Link a Google Sheet to user's account
```json
{
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheetName": "Sheet1",
  "range": "A:Z"
}
```

### GET /api/sheets/fetch?spreadsheetId=xxx&range=xxx
Fetch data from linked sheet
- Requires subscription
- Returns CSV-like data

### GET /api/sheets/connect
OAuth callback (future)

## UI Components

### Sheet Linker Component
- Input field for spreadsheet URL or ID
- Test connection button
- Show linked sheets list
- Refresh data button

### Subscription Gate Component
- Check subscription status
- Show upgrade prompt if not subscribed
- Allow CSV upload (free tier)

## Phase 1 Features Details

### 1. Time Series Charts
- **Deal Velocity**: Line chart showing deals moving through stages over time
- **Stage Distribution**: Stacked area chart
- **Win Rate Trend**: Monthly progression

**Data needed:**
- Group by date (created_at, updated_at, closed_at)
- Count deals per stage per time period
- Calculate conversion rates over time

### 2. Rep Performance
- **Leaderboard**: Top N reps by:
  - Closed deals count
  - Conversion rate
  - Avg deal size
  - Total value
- **Rep Funnel Comparison**: Side-by-side funnels
- **Activity Heatmap**: Rep activity by stage

**Data needed:**
- Group by ownerId
- Calculate metrics per owner
- Sort and rank

### 3. Deal Quality Metrics
- **Deal Size Distribution**: Histogram
- **Deal Size by Stage**: Box plot
- **High-Value Deals**: Flag deals above threshold

**Data needed:**
- Value field
- Stage field
- Calculate percentiles, min/max/avg

