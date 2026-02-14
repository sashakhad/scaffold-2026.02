# Cloud Agent Review & Improvement Guide

You are reviewing the **anyusage-rebuild** project -- a ground-up rebuild of an internal enterprise usage analytics tool. Your job is to thoroughly audit what's been built, identify issues, and improve the codebase.

## Context

This app is a **Token Usage Calculator** for enterprise customers. The flow:
1. User searches for an account name (Salesforce accounts)
2. User selects opportunity(ies) from that account (which provide Cursor team IDs)
3. User picks a date range (30/60/90 days)
4. App fetches consumption data and displays:
   - Requests by Model chart (bar chart)
   - Cost Breakdown by Model chart (stacked bar chart)
   - Summary cards (active users, total cost, API cost, cursor token fee, avg/median cost per user)
   - Contract Scoping Calculator ($480/seat annual, bugbot seats, CTF discount)
   - User Distribution chart (request count buckets)

All data comes from **Databricks** using RevOps-blessed dbt models and Salesforce mirror tables. See `docs/DATA_DIFFERENCES.md` for the full comparison with the old system.

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript 5.9
- Tailwind CSS 4, shadcn/ui
- Recharts for data visualization
- `@databricks/sql` SDK for database access
- pnpm package manager

## Project Structure

```
src/
  app/
    page.tsx                          -- Main page (TokenUsageCalculator)
    layout.tsx                        -- Root layout
    api/
      account-suggestions/route.ts    -- Account name typeahead (Databricks)
      opportunities/route.ts          -- Opportunities by account name (Databricks)
      active-users/route.ts           -- Unique user count in date range (Databricks)
      consumption-analytics/route.ts  -- Model breakdown + costs + user distribution (Databricks)
      subscriptions/route.ts          -- All subscriptions list (Databricks)
      teams/search/route.ts           -- Enterprise team search (Databricks)
      teams/[teamId]/route.ts         -- Single team lookup (Databricks)
      teams/bulk/route.ts             -- Bulk team-to-subscription mapping (Databricks)
      metrics/                        -- Additional blessed metric endpoints (MAU, model spend, etc.)
      accounts/search/route.ts        -- Account search (Databricks)
      accounts/[id]/opportunities/    -- Account opportunities (Databricks)
  components/
    AccountSearch.tsx                 -- Account name search combobox
    OpportunitiesDropdown.tsx         -- Multi-select opportunity picker
    DateRangeSelector.tsx             -- 30/60/90 day quick selector
    QueryHeader.tsx                   -- Sticky header showing team/account/date
    RequestsByModelChart.tsx          -- Bar chart of requests per model
    TokenBreakdownChart.tsx           -- Stacked bar chart of cost per model
    UserSpendDistributionChart.tsx    -- Horizontal bar distribution chart
    charts/                           -- Additional chart components (from initial build)
    ui/                               -- shadcn/ui components
  lib/
    databricks.ts                     -- Databricks connection pool + executeQuery
    validation.ts                     -- Input validation (subscription IDs, team IDs)
    metrics-helpers.ts                -- Shared parameter parsing for metric routes
    chart-colors.ts                   -- Color constants for charts
  types/
    index.ts                          -- All TypeScript interfaces
```

## Review Checklist

### 1. Charts Quality (HIGH PRIORITY)

The charts currently look bad. Specific issues to fix:

- **X-axis labels**: Model names are long and overlap when angled. Consider truncating, using abbreviations, or switching to horizontal bar charts.
- **Scale dominance**: One model (e.g., `4-6-Opus-thinking`) dominates request counts, making all other models invisible at the bottom. Consider log scale, or showing top N with an "Other" bucket.
- **Y-axis formatting**: The cost chart Y-axis shows raw numbers. Should use `$1.2M` format consistently.
- **Chart responsiveness**: Charts need to work at different viewport widths.
- **Color consistency**: Model colors should be consistent across both charts (same model = same color).
- **Empty states**: Charts should show meaningful messages when there's no data, not just blank space.
- **Tooltip formatting**: Ensure currency values show `$X,XXX.XX` and request counts show `X,XXX`.

Files to focus on:
- `src/components/RequestsByModelChart.tsx`
- `src/components/TokenBreakdownChart.tsx`
- `src/components/UserSpendDistributionChart.tsx`

### 2. Data Accuracy Audit

Review every API route and verify:

- The SQL queries match the blessed-api patterns exactly (compare against `docs/REBUILD_PLAN.md` and `docs/DATA_DIFFERENCES.md`)
- No accidental SQL injection vectors (all user input is validated or parameterized)
- Error handling is consistent (all routes return `{ error: string }` on failure)
- Response shapes match what the frontend expects

Key files:
- `src/app/api/consumption-analytics/route.ts` -- the main data endpoint
- `src/app/api/active-users/route.ts`
- `src/app/api/account-suggestions/route.ts`
- `src/app/api/opportunities/route.ts`
- `src/lib/databricks.ts` -- connection pool
- `src/lib/validation.ts` -- input validation

### 3. UI/UX Improvements

- **Loading states**: The main page shows a basic spinner. Add skeleton loaders that match the layout.
- **Error handling**: Network errors should show retry buttons with clear messages.
- **Responsive layout**: The two-column account/opportunity layout should stack on mobile.
- **Dark mode**: The app uses Tailwind dark mode classes but they're inconsistent. Either fully support dark mode or remove the dark: classes.
- **Accessibility**: Add proper ARIA labels to interactive elements, keyboard navigation for dropdowns.
- **URL state**: The original anyusage persisted team ID and date range in URL params. The rebuild should too for shareability.

### 4. Contract Scoping Calculator

Review the contract scoping math in `src/app/page.tsx` (the `ContractScopingResults` component):

- $480/seat annual pricing is hardcoded. Verify this is still correct.
- Bugbot at $32/month/seat. Verify.
- Daily cost projection: `totalCost / activeUsers / daysInRange * 365 * scopingUsers`. This extrapolation assumes usage is linear, which it probably isn't.
- The Cursor Token Fee discount is applied as a simple percentage reduction. Verify the math.

### 5. Type Safety

- Check for any implicit `any` types (the project rules say never use implicit any)
- Ensure all API response types are properly defined
- Verify Recharts tooltip formatter types handle `undefined` correctly (Recharts v3 is strict)

### 6. Performance

- The `consumption-analytics` endpoint makes 3 sequential Databricks queries. Consider parallelizing with `Promise.all`.
- The account suggestions endpoint has no debouncing at the API level (frontend debounces at 300ms, which is fine).
- The Databricks connection pool (`src/lib/databricks.ts`) has a 10-minute session timeout. Verify this is appropriate for serverless deployment.

### 7. Unused Code

The initial build created chart-generator-style components that are no longer used by the main page but are still in the codebase:
- `src/components/charts/MAUBarChart.tsx`
- `src/components/charts/ModelSpendChart.tsx`
- `src/components/charts/ActiveUsersChart.tsx`
- `src/components/charts/FeatureAdoptionChart.tsx`
- `src/components/charts/TopUsersTable.tsx`
- `src/components/charts/TrueUpsChart.tsx`
- `src/components/charts/DepthOfUsageChart.tsx`
- `src/components/charts/OverageChart.tsx`
- `src/components/charts/MonthlySpendChart.tsx`
- `src/components/charts/ChartSkeleton.tsx`
- `src/lib/chart-colors.ts`
- `src/hooks/` directory (empty after cleanup)

The `/api/metrics/*` routes and `/api/subscriptions` and `/api/teams/*` routes are also not used by the current UI. They were built for a chart-generator-style dashboard that was scrapped.

**Decision needed**: Keep these for future use, or remove them to reduce surface area. If keeping, they should be documented. If removing, delete the files and their imports.

### 8. Testing

There are currently no tests for:
- API routes (should at least have integration tests with mocked Databricks responses)
- Component rendering (basic smoke tests with mock data)
- Validation helpers (unit tests for `validation.ts`)

The project has Jest, Vitest, and Cypress set up. Add tests where they provide the most value.

### 9. Security

- `src/lib/databricks.ts`: Verify the connection credentials are only used server-side (they are -- only imported in API routes)
- `src/app/api/accounts/search/route.ts`: Uses string interpolation for the LIKE query (`%${safeTerm}%`). The `safeTerm` does escape single quotes, percent signs, and underscores, but verify this is sufficient.
- `src/app/api/opportunities/route.ts`: Uses string interpolation for account name. Same escaping concern.
- `.env.local` is gitignored. `.env.example` has placeholder values only. Good.

### 10. Build & Deploy

- `next.config.ts` has `serverExternalPackages: ['@databricks/sql', 'lz4']` -- this is required for the native module. Don't remove it.
- The LZ4 native module warning on Apple Silicon is harmless (falls back to JS implementation).
- Verify `pnpm run build` succeeds before any PR.
- Verify `pnpm run lint` and `pnpm run type-check` pass with zero errors.

## Environment Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in Databricks credentials:
# DATABRICKS_SERVER_HOSTNAME=<workspace>.cloud.databricks.com
# DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/<warehouse-id>
# DATABRICKS_ACCESS_TOKEN=<pat-token>
pnpm dev
```

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm lint:fix     # ESLint autofix
pnpm type-check   # TypeScript check
pnpm test         # Jest tests
pnpm test:e2e     # Cypress E2E tests
```

## Key Rules

- Always use `pnpm`, never npm or yarn
- Run `pnpm lint:fix` before manual lint fixes (let ESLint autofix handle what it can)
- No implicit `any` types
- Use function declarations over arrow functions
- Prefer readable iteration over `reduce`
- Tailwind CSS for all styling
- React Hook Form for controlled form inputs
