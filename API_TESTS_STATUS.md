# API Route Tests - Status & Next Steps
**Date:** January 23, 2025

---

## ✅ What Was Created

### Test Files Created
1. ✅ `src/__tests__/api/test-utils.ts` - Test utilities for API routes
2. ✅ `src/__tests__/api/ingest.test.ts` - Tests for `/api/ingest` endpoint
3. ✅ `src/__tests__/api/metrics.test.ts` - Tests for `/api/metrics` endpoint  
4. ✅ `src/__tests__/api/dataset.test.ts` - Tests for `/api/dataset/[datasetId]/metrics` endpoint

### Test Coverage Planned
- ✅ Rate limiting behavior
- ✅ Request validation (Zod schemas)
- ✅ Error handling
- ✅ Success cases
- ✅ Edge cases (empty data, invalid inputs)

---

## ⚠️ Current Issue

**Problem:** Tests are timing out or failing due to Next.js API route import issues in Jest environment.

**Root Cause:** Next.js API routes use server-side APIs (`NextRequest`, `NextResponse`) that require special handling in test environments.

---

## 🔧 Solutions to Try

### Option 1: Integration Tests (Recommended)
Instead of unit testing route handlers directly, test the API endpoints via HTTP:

```typescript
// Use a test server or fetch directly
const response = await fetch('http://localhost:3002/api/ingest', {
  method: 'POST',
  body: JSON.stringify({ sourceType: 'csv_upload', content: '...' })
});
```

**Pros:**
- Tests actual HTTP behavior
- No import issues
- More realistic

**Cons:**
- Requires running server
- Slower tests

### Option 2: Mock Next.js Server APIs
Create proper mocks for `NextRequest` and `NextResponse`:

```typescript
// Mock Next.js server APIs
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest { ... },
  NextResponse: { json: jest.fn() }
}));
```

**Pros:**
- Unit test speed
- No server needed

**Cons:**
- Complex mocking
- May miss real behavior

### Option 3: Test Business Logic Separately
Extract business logic from route handlers and test that:

```typescript
// Test the core logic, not the route handler
import { processIngestRequest } from '@/lib/ingestLogic';

test('processes CSV correctly', () => {
  const result = processIngestRequest({ sourceType: 'csv', content: '...' });
  expect(result.success).toBe(true);
});
```

**Pros:**
- Clean separation
- Easy to test
- Fast

**Cons:**
- Doesn't test route handler itself
- Less coverage of integration points

---

## 📊 Current Test Status

### Existing Tests (Working)
- ✅ `src/__tests__/adapters/csv.test.ts` - 5 tests passing
- ✅ `src/__tests__/lib/fieldMapping.test.ts` - 6 tests passing
- **Total:** 11 tests passing

### New API Tests (Pending)
- ⏳ `src/__tests__/api/ingest.test.ts` - 8 test cases written
- ⏳ `src/__tests__/api/metrics.test.ts` - 7 test cases written
- ⏳ `src/__tests__/api/dataset.test.ts` - 8 test cases written
- **Total:** 23 test cases written, need environment fix

---

## 🎯 Recommended Next Steps

### Immediate (Choose One)

**Option A: Integration Tests** (Best for confidence)
1. Set up test server helper
2. Convert tests to HTTP-based integration tests
3. Run tests against actual server

**Option B: Fix Unit Tests** (Best for speed)
1. Create proper Next.js server API mocks
2. Fix import issues
3. Get unit tests running

**Option C: Hybrid Approach** (Best balance)
1. Test business logic separately (unit tests)
2. Add a few integration tests for critical paths
3. Get best of both worlds

---

## 📝 Test Cases Written

### `/api/ingest` Tests (8 cases)
- ✅ Successfully ingest CSV data
- ✅ Rate limiting (429 response)
- ✅ Invalid request body (400)
- ✅ Unknown source type (400)
- ✅ Ingestion failure (400)
- ✅ No records normalized (400)
- ✅ Server errors (500)
- ✅ Schema detection in response

### `/api/metrics` Tests (7 cases)
- ✅ Compute metrics successfully
- ✅ Default period when not specified
- ✅ Filter metrics by metricIds
- ✅ Rate limiting (429)
- ✅ Invalid period type (400)
- ✅ Different period types
- ✅ Server errors (500)

### `/api/dataset/[datasetId]/metrics` Tests (8 cases)
- ✅ Compute metrics for existing dataset
- ✅ Non-existent dataset (404)
- ✅ Dataset with no records (400)
- ✅ No stages found (400)
- ✅ Different period types
- ✅ Invalid dates handling
- ✅ Server errors (500)
- ✅ Funnel metrics in response

---

## ✅ Summary

**Status:** Tests written but need environment configuration fix

**Next Action:** Choose testing approach (integration vs unit vs hybrid) and implement

**Coverage Goal:** 60%+ (currently ~4%, would be ~25%+ with these tests passing)

---

**Created:** January 23, 2025  
**Next Review:** After choosing testing approach
