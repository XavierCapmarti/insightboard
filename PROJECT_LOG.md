# InsightBoard - Project Log

Personal side project: Plug-and-play analytics SaaS for SMEs.

---

## Project Info

| Field | Value |
|-------|-------|
| Repo | [github.com/XavierCapmarti/solitude](https://github.com/XavierCapmarti/solitude) |
| Vercel | (not yet deployed) |
| Domain | (TBD) |
| Tech | Next.js 14, TypeScript, Tailwind, Recharts |

---

## Progress Log

### 2025-01-06 - Initial Scaffold
- Created project structure with adapter pattern
- Core models: Record, StageEvent, Actor, Category
- Adapters: CSV, Google Sheets, Generic CRM
- Metrics engine with aggregations
- Funnel analysis engine
- Landing page, onboarding wizard, dashboard shell
- JSON-configurable dashboard templates

### 2025-01-06 - Decoupling from Company Stack
- Initialized git with personal author config
- Added Resend email infrastructure
- Created .env.example with documented vars
- Added /api/test-email endpoint
- Ready for personal Vercel deployment

---

## Next Steps

- [ ] Create GitHub repo and push
- [ ] Deploy to personal Vercel account
- [ ] Set up Resend with verified domain
- [ ] Wire up real data flow end-to-end
- [ ] Add authentication (NextAuth or Clerk)
- [ ] Connect database for persistence

---

## Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | For emails | Get from resend.com/api-keys |
| `EMAIL_FROM` | For emails | Verified sender email |

---

## Notes

- No company data, accounts, or SSO
- Completely independent from sales-dashboarding
- Self-serve onboarding for external SME customers

