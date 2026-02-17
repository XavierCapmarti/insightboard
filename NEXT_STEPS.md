# ClarLens Next Steps - Action Plan
**Based on Build Quality Assessment**  
**Date:** January 23, 2025

---

## 🎯 Overall Quality: 7.8/10 - GOOD

**Status:** Ready for development, needs security fixes before production.

---

## 🔴 Phase 1: Critical Security Fixes (This Week)

### 1. Secure OAuth Token Storage
**Priority:** CRITICAL  
**Effort:** 4-6 hours  
**Impact:** Security vulnerability

**Current Issue:**
- OAuth tokens passed via URL parameters (insecure)
- Tokens visible in browser history, logs

**Solution:**
- Implement secure session storage (encrypted cookies)
- Use Next.js cookies API with httpOnly flag
- Add token expiration handling

**Files to Update:**
- `src/app/api/auth/google/callback/route.ts`
- Create `src/lib/session.ts` for secure token storage

---

### 2. Fix Security Vulnerabilities
**Priority:** HIGH  
**Effort:** 1-2 days  
**Impact:** Security patches

**Actions:**
1. Update Next.js 14 → 16 (fixes glob vulnerability)
2. Run `npm audit fix` (fixes lodash vulnerability)
3. Test thoroughly after updates
4. Create feature branch: `chore/update-dependencies`

**Risk:** Breaking changes possible, test all features

---

### 3. Add Rate Limiting
**Priority:** MEDIUM  
**Effort:** 2-3 hours  
**Impact:** Prevents API abuse

**Solution:**
- Add rate limiting middleware
- Protect `/api/ingest` and `/api/metrics`
- Use `@upstash/ratelimit` or similar

**Files to Create:**
- `src/lib/rateLimit.ts`
- Update API routes with rate limiting

---

## 🟡 Phase 2: Test Coverage Expansion (Next 2 Weeks)

### 4. API Route Tests
**Priority:** MEDIUM  
**Effort:** 1-2 days  
**Target:** 60%+ coverage

**Tests to Add:**
- `src/__tests__/api/ingest.test.ts`
- `src/__tests__/api/metrics.test.ts`
- `src/__tests__/api/dataset.test.ts`

**Coverage Goals:**
- `/api/ingest`: Test CSV upload, field mapping, error handling
- `/api/metrics`: Test metric calculations, period filtering
- `/api/dataset/[datasetId]/metrics`: Test dataset retrieval

---

### 5. Engine Tests
**Priority:** MEDIUM  
**Effort:** 1-2 days

**Tests to Add:**
- `src/__tests__/engine/metrics.test.ts`
- `src/__tests__/engine/funnel.test.ts`

**Test Cases:**
- Aggregation calculations (sum, average, count)
- Period filtering
- Funnel stage calculations
- Edge cases (empty data, invalid dates)

---

### 6. Component Tests
**Priority:** LOW  
**Effort:** 1 day

**Tests to Add:**
- `src/__tests__/components/onboarding.test.tsx`
- `src/__tests__/components/charts.test.tsx`

---

## 🟢 Phase 3: Production Hardening (Next Month)

### 7. Replace Console Logging
**Priority:** MEDIUM  
**Effort:** 3-4 hours

**Current:** 70 console.log statements  
**Solution:** Create logger utility with levels

**Files to Create:**
- `src/lib/logger.ts`

**Features:**
- Log levels (debug, info, warn, error)
- Environment-based logging (dev vs prod)
- Structured logging

---

### 8. Add Error Tracking
**Priority:** MEDIUM  
**Effort:** 2-3 hours

**Solution:** Integrate Sentry

**Steps:**
1. Install `@sentry/nextjs`
2. Configure Sentry in `next.config.js`
3. Add error boundaries with Sentry
4. Track API errors

---

### 9. API Documentation
**Priority:** LOW  
**Effort:** 1 day

**Solution:** Add OpenAPI/Swagger docs

**Tools:**
- `next-swagger-doc` or similar
- Document all API endpoints
- Add request/response examples

---

## 🚀 Phase 4: Feature Development (Ongoing)

### 10. Dashboard Sharing
**Priority:** FEATURE  
**Effort:** 3-5 days

**Features:**
- Generate shareable links
- Public/private visibility
- Embed codes for external sites
- Password protection option

---

### 11. Scheduled Reports
**Priority:** FEATURE  
**Effort:** 3-5 days

**Features:**
- Email scheduling system
- Weekly/monthly reports
- Custom report templates
- Email delivery via Resend

---

### 12. Additional Adapters
**Priority:** FEATURE  
**Effort:** 2-3 days each

**Adapters to Add:**
- Stripe (transaction data)
- Airtable
- Notion

---

## 📊 Quick Wins (Can Do Now)

### Immediate (1-2 hours each):
1. ✅ **Remove excessive console.log** - Replace with logger
2. ✅ **Add .env.example** - Document required env vars
3. ✅ **Add API route validation** - Use Zod schemas
4. ✅ **Improve error messages** - More user-friendly

### Short Term (Half day each):
5. ✅ **Add request validation** - Validate API inputs
6. ✅ **Add response caching** - Cache metrics calculations
7. ✅ **Optimize bundle size** - Code splitting improvements

---

## 📈 Success Metrics

### Current State
- ✅ Build: Passing
- ✅ Lint: Clean
- ✅ Tests: 11 passing (4% coverage)
- ⚠️ Security: 2 vulnerabilities
- ⚠️ Dependencies: 20 outdated

### Target State (4 weeks)
- ✅ Build: Passing
- ✅ Lint: Clean
- ✅ Tests: 60%+ coverage
- ✅ Security: 0 vulnerabilities
- ✅ Dependencies: Updated
- ✅ Production: Ready

---

## 🎯 Recommended Order

**Week 1:**
1. Secure OAuth token storage
2. Fix security vulnerabilities
3. Add rate limiting

**Week 2:**
4. Replace console logging
5. Add error tracking
6. Start test coverage expansion

**Week 3-4:**
7. Complete test coverage (60%+)
8. API documentation
9. Production deployment prep

**Ongoing:**
10. Feature development
11. Performance optimization
12. User feedback integration

---

## 📝 Notes

- All fixes should be tested thoroughly
- Create feature branches for major changes
- Keep main branch stable
- Document all changes

---

**Ready to start?** Begin with Phase 1, Item 1 (Secure OAuth Token Storage).
