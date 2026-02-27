# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint via next lint
npm test             # Run favorites integration tests (tsx tests/test-favorites.ts)
```

## Architecture

**Next.js 14 + TypeScript** app with client-side Metabase-style filtering, Supabase (PostgreSQL) backend, and Clerk authentication.

### Data flow
1. Jobs are synced from Apify Career Site API via cron (`/api/cron/daily-sync`)
2. AI-enhanced fields (salary, skills, experience) are parsed during ingestion
3. Client fetches jobs via Supabase client with RPC for array/salary fields
4. Filters are serialized to URL query params for shareability

### Key patterns
- **Filters**: `FilterCondition[]` in `types/filters.ts` drives the entire filtering system. `lib/filterEngine.ts` applies AND/OR logic, `lib/filterUrl.ts` handles URL serialization, `lib/filterConfig.ts` defines available fields/operators, `lib/dynamicFilterOptions.ts` generates dropdown options from sampled data.
- **Array fields** (cities, skills, benefits): cast to text for ILIKE matching in Supabase RPC (`search_jobs_rpc`)
- **Salary**: multi-currency with conversion utilities in `lib/currencyConverter.ts`
- **Favorites**: React Context (`contexts/FavoritesContext.tsx`) with optimistic updates and error rollback
- **Saved filters**: max 25 per user, with 12-hour "new job" badge snapshots stored both server-side (`/api/filter-context`) and in localStorage as fallback
- **Scroll behavior**: header collapses at 80px scroll on desktop, right toolbar appears; mobile header stays visible

### Styling
- Tailwind CSS with HSL CSS variables defined in `app/globals.css`
- shadcn/ui components (new-york style) in `components/ui/`
- Fonts: DM Sans (body), Bricolage Grotesque (headings) via Google Fonts
- Background pattern switchable via `--bg-pattern` CSS variable + `BackgroundPatternPicker`

### Auth
- Clerk wraps the app in `layout.tsx`
- Admin routes (`/admin`, `/api/admin`) gated by email check in `middleware.ts`

### Database
Main table `jobmarket_jobs` with supporting tables: `jobmarket_saved_filters`, `jobmarket_favorites`, `jobmarket_user_job_alerts`, `jobmarket_filter_context`, `jobmarket_apify_usage_logs`. Schema in `DATABASE_SCHEMA.sql`.

## Environment Variables

Required in `.env.local` (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `APIFY_API_TOKEN`
- `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`
