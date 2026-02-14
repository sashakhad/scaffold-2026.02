# AnyUsage Rebuild

Enterprise usage analytics dashboard powered by **RevOps-blessed data only**.

This is a ground-up rebuild of anyusage that replaces the old Redshift + webhook architecture with direct Databricks queries using only dbt models and Salesforce mirror tables sanctioned by RevOps.

## Tech Stack

- **Next.js 16** with App Router and Turbopack
- **React 19** + TypeScript 5.9
- **Tailwind CSS 4** + shadcn/ui components
- **Recharts** for data visualization
- **Databricks SQL SDK** (`@databricks/sql`) for data access

## Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in your Databricks credentials in .env.local
pnpm dev
```

## Environment Variables

| Variable                     | Description                   |
| ---------------------------- | ----------------------------- |
| `DATABRICKS_SERVER_HOSTNAME` | Databricks workspace hostname |
| `DATABRICKS_HTTP_PATH`       | SQL warehouse HTTP path       |
| `DATABRICKS_ACCESS_TOKEN`    | Personal access token         |

## Data Sources (Blessed)

All queries use RevOps-approved tables:

- **`main.dbt.*`** - dbt models (dim_teams, fct_revops_daily_team_metrics, fct_revops_user_metrics, etc.)
- **`revops_share.pt_salesforce.*`** - Salesforce mirror (subscription\_\_c, account, opportunity, user)
- **`revops.analytics.*`** - Analytics tables (temp_model_usage_monthly_sfdc)

## Features

- Subscription/team search and selection
- MAU trend (monthly active users)
- Model spend breakdown (by AI model)
- Monthly spend tracking (API cost + Cursor Token Fee)
- Active users trend (DAU, WAU, MAU, power users)
- Feature adoption percentages (Rules, MCP, Agent, Plan Mode, Commands)
- Top users leaderboard
- True-ups / license growth
- Depth of usage distribution
- Overage billing

## API Routes

All routes under `/api/` query Databricks directly using blessed SQL:

- `/api/subscriptions` - List all subscriptions
- `/api/teams/search` - Enterprise team search
- `/api/teams/[teamId]` - Team-to-subscription lookup
- `/api/teams/bulk` - Bulk team lookup
- `/api/metrics/mau` - MAU growth data
- `/api/metrics/model-spend` - Model spend breakdown
- `/api/metrics/active-users` - DAU/WAU/MAU/power users
- `/api/metrics/feature-adoption` - Feature adoption (rules + MCP)
- `/api/metrics/feature-adoption-pct` - Feature adoption percentages
- `/api/metrics/top-users` - Top users by engagement
- `/api/metrics/monthly-spend` - Monthly spend totals
- `/api/metrics/overage` - Overage billing
- `/api/metrics/true-ups` - True-up opportunities
- `/api/metrics/depth-of-usage` - Request volume distribution
- `/api/accounts/search` - Account name search
- `/api/accounts/[id]/opportunities` - Account opportunities
