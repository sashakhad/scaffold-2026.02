# AnyUsage Rebuild: Data Source Differences

This document catalogs every data source and methodology difference between the **old anyusage** (fieldsphere monorepo, Redshift/Modal webhooks) and the **anyusage-rebuild** (standalone Next.js, Databricks blessed queries). Intended for RevOps review before the rebuild goes live.

---

## Summary: What RevOps Should Focus On

1. **Cost calculation methodology changed.** Old anyusage hardcodes Cursor Token Fee as `$0.25 per million tokens`. The rebuild uses the pre-computed `cursor_token_fee_calc_usd_month` column from the dbt model. If these don't match, the numbers will differ.

2. **Time granularity dropped from daily to monthly.** Old anyusage supports arbitrary date ranges (exact day-level filtering). The rebuild filters by month boundaries, so a "Last 30 Days" query spanning Jan 15 to Feb 14 includes ALL of January and ALL of February.

3. **User spend distribution changed from dollar-based to request-based.** Old anyusage buckets users by dollar spend ($0-$20, $20-$50, etc.). The rebuild buckets by request count (1-100, 101-500, etc.) because the blessed tables don't have per-user cost data.

4. **Bugbot usage is no longer excluded.** Old anyusage filters out `usage_type = 'bugBot'` from all queries. The blessed model spend table doesn't have a usage_type column, so bugbot usage is included in totals.

5. **Entity join path changed.** Old anyusage queries by `owningteam` (team ID) directly. The rebuild translates team ID to `sf_subscription_id` via `dim_teams`, then queries by subscription. This could yield different results if team-to-subscription mapping has gaps.

---

## Infrastructure

| Aspect   | Old Anyusage                                   | Rebuild                                  |
| -------- | ---------------------------------------------- | ---------------------------------------- |
| Runtime  | Python webhooks on Modal                       | Next.js API routes (server-side)         |
| Database | AWS Redshift via `psycopg2`                    | Databricks via `@databricks/sql` SDK     |
| Auth     | TTM_API_KEY passed to Modal endpoints          | Direct Databricks PAT (server-side only) |
| Latency  | HTTP hop: Next.js -> Modal webhook -> Redshift | Direct: Next.js -> Databricks            |

---

## Tables Used

### Old Anyusage (Redshift)

| Table                                  | Used For                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `dev.dbt.int_team_model_usage_summary` | Model breakdown, cost metrics, event type breakdown. Filtered by `owningteam` and `usage_date`.                                |
| `dev.dbt.int_user_spending_summary`    | Per-user spend, median cost, user spend distribution, active user count. Filtered by `owningteam`, `usage_date`, `usage_type`. |
| `dev.salesforce.account`               | Account name typeahead search.                                                                                                 |
| `dev.salesforce.opportunity`           | Opportunity lookup by account name. Filtered to `type = 'New Business'` and `is_deleted = False`.                              |

### Rebuild (Databricks)

| Table                                            | Used For                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| `revops.analytics.temp_model_usage_monthly_sfdc` | Model breakdown, cost metrics. Filtered by `subscription_id` and `month`. |
| `main.dbt.dim_teams`                             | Team ID to `sf_subscription_id` mapping.                                  |
| `main.dbt.stg_user_team`                         | User-to-team mapping for distribution queries.                            |
| `main.dbt.int_monthly_user_agent_usage`          | User request counts for distribution buckets.                             |
| `main.dbt.int_revops_daily_user_activity`        | Active user count in date range. Filtered by `cursor_team_id` and `dt`.   |
| `revops_share.pt_salesforce.account`             | Account name search. Filtered by `IsDeleted = false`.                     |
| `revops_share.pt_salesforce.opportunity`         | Opportunity lookup by account. No type filter.                            |
| `revops_share.pt_salesforce.subscription__c`     | Joined for `All_Cursor_Team_IDs__c` (team ID from subscription).          |

---

## Feature-by-Feature Comparison

### 1. Cost Calculation Methodology

|                         | Old Anyusage                                                                                         | Rebuild                                                                       | Impact                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| API Cost                | `SUM(total_api_price)` from `int_team_model_usage_summary`                                           | `SUM(api_cost_usd_month)` from `temp_model_usage_monthly_sfdc`                | Different source tables. May produce different totals if the underlying dbt models aggregate differently.                                |
| Cursor Token Fee        | **Hardcoded formula**: `(total_tokens / 1,000,000) * $0.25` per model, with `default` model excluded | **Pre-computed column**: `cursor_token_fee_calc_usd_month` from the dbt model | **HIGH RISK.** The hardcoded formula may not match what the dbt model computes. This is likely the largest source of number discrepancy. |
| Default model exclusion | Explicitly excludes `standardized_model = 'default'` from CTF calculation                            | No special handling -- whatever the dbt model includes                        | If the dbt model handles the default model differently, CTF numbers will differ.                                                         |
| Total Cost              | `total_api_price + cursor_fee` (computed inline)                                                     | `api_cost_usd + cursor_token_fee_usd` (both from dbt)                         | Depends on whether the two fee calculations align.                                                                                       |

### 2. Time Granularity

|                    | Old Anyusage                                                  | Rebuild                                                                                                  | Impact                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter granularity | Day-level: `usage_date BETWEEN '2026-01-15' AND '2026-02-14'` | Month-level: `month >= DATE_TRUNC('month', '2026-01-15') AND month <= DATE_TRUNC('month', '2026-02-14')` | **MEDIUM RISK.** A "Last 30 Days" query from Jan 15 to Feb 14 in the rebuild includes ALL of January and ALL of February (potentially 59 days of data). Old version includes exactly 30 days. |
| Data freshness     | Up to the current day (daily rows in Redshift)                | Up to the last completed month (monthly aggregation)                                                     | Current-month partial data may be missing or inflated depending on when the dbt model runs.                                                                                                   |

### 3. User Spend Distribution

|                  | Old Anyusage                                                                  | Rebuild                                                            | Impact                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucketing metric | **Dollar spend** per user ($0-$20, $20-$50, $50-$100, $100-$500, $500+)       | **Request count** per user (0, 1-100, 101-500, 501-1K, 1K-5K, 5K+) | **HIGH RISK.** These are fundamentally different metrics. The rebuild cannot show per-user dollar spend because the blessed tables don't have that data. |
| Data source      | `int_user_spending_summary` with per-user cost rollup                         | `int_monthly_user_agent_usage` with per-user request count         | Different tables, different dimensions.                                                                                                                  |
| Drill-down       | Old has a modal to view users within a bucket with model-level cost breakdown | Rebuild has no drill-down                                          | Feature gap.                                                                                                                                             |

### 4. Median / Average Cost Per User

|                        | Old Anyusage                                                         | Rebuild                                                         | Impact                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Median                 | True statistical median via `PERCENTILE_CONT(0.5)` on per-user costs | Simple division: `(totalApiCost + cursorTokenFee) / totalUsers` | **MEDIUM RISK.** The rebuild's "median" is actually a mean. In skewed distributions (common with usage data), these can be very different. |
| Average                | `AVG(user_total_cost)` from `int_user_spending_summary`              | Same formula as median (total / count)                          | Functionally equivalent but computed from different source data.                                                                           |
| Active user definition | Users with `total_api_price > 0` and `usage_type != 'bugBot'`        | Users with any activity in `int_revops_daily_user_activity`     | Different definition could change user counts, which changes per-user averages.                                                            |

### 5. Token Counts

|            | Old Anyusage                                                                          | Rebuild                              | Impact                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Token data | Returns `total_tokens` (input + output) per model from `int_team_model_usage_summary` | Returns `totalTokens: 0` (hardcoded) | **LOW-MEDIUM RISK.** The "Token Breakdown" chart in the rebuild is actually showing cost breakdown, not tokens. The chart title is misleading. The blessed table `temp_model_usage_monthly_sfdc` does not have a token count column. |

### 6. Bugbot Exclusion

|           | Old Anyusage                                                                                                   | Rebuild                                  | Impact                                                                                                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Filtering | All queries filter `usage_type != 'bugBot'`. Separate `/api/bugbot-consumption` endpoint for bugbot-only data. | No bugbot filtering. No bugbot endpoint. | **MEDIUM RISK.** If a customer has significant bugbot usage, it will be included in the rebuild's cost totals but excluded from the old version's totals. The contract scoping calculator would then overestimate usage costs. |

### 7. Opportunity Lookup

|                | Old Anyusage                                              | Rebuild                                                                           | Impact                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Filter         | `o.type = 'New Business' AND o.is_deleted = False`        | `opp.IsDeleted = false` (no type filter)                                          | **LOW RISK.** The rebuild shows all opportunity types (renewals, expansions, etc.), not just New Business. This actually gives a more complete picture but changes what appears in the dropdown. |
| Team ID source | `o.cursor_team_id_c` directly from the opportunity record | `s.All_Cursor_Team_IDs__c` from the subscription linked via `opp.Subscription__c` | Different join path. An opportunity might have a team ID directly but its linked subscription might not, or vice versa.                                                                          |
| Data source    | `dev.salesforce.opportunity` (Redshift mirror)            | `revops_share.pt_salesforce.opportunity` (Databricks mirror)                      | Different Salesforce sync pipelines. Data could be out of sync.                                                                                                                                  |

### 8. Entity Identification / Join Path

|                    | Old Anyusage                                           | Rebuild                                                                                                       | Impact                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary key        | Team ID (`owningteam`) used directly in all queries    | Team ID translated to `sf_subscription_id` via `dim_teams`, then subscription ID used for model spend queries | **MEDIUM RISK.** If `dim_teams.sf_subscription_id` is null or stale for a team, the rebuild returns no model spend data even if the old version would have returned data. |
| Active users query | Filters by `owningteam` on `int_user_spending_summary` | Filters by `cursor_team_id` on `int_revops_daily_user_activity`                                               | Different tables and column names. The "active user" definition differs.                                                                                                  |

### 9. Account Search

|             | Old Anyusage                            | Rebuild                                                 | Impact                                                                                              |
| ----------- | --------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Data source | `dev.salesforce.account` on Redshift    | `revops_share.pt_salesforce.account` on Databricks      | Different sync pipelines. Should return same accounts but could differ if sync timing is different. |
| Filter      | `name ILIKE pattern` (case-insensitive) | `LOWER(Name) LIKE LOWER(pattern) AND IsDeleted = false` | Functionally equivalent but the rebuild also excludes deleted accounts.                             |

---

## Features Dropped in the Rebuild

| Feature                         | Old Behavior                                                                       | Why Dropped                                                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event type breakdown            | Groups usage by `usage_type` (Chat Completion, Embedding, etc.)                    | The blessed `temp_model_usage_monthly_sfdc` table doesn't have a `usage_type` column.                                                                      |
| Bugbot consumption endpoint     | Separate endpoint showing bugbot-only model spend                                  | No `usage_type` column in blessed data to filter on.                                                                                                       |
| Per-user model spend drill-down | Click a spend bucket to see individual users with their model-level cost breakdown | No per-user cost data in blessed tables.                                                                                                                   |
| Salesforce embedding mode       | `?embed=true&teamId=X` URL param for iframe embedding in Salesforce                | Not yet implemented. Can be re-added.                                                                                                                      |
| Developer quadrants             | Scatter plot of tab accepts vs agent requests per user                             | Used `dev.dbt.int_user_usage_snapshot` on Redshift, no blessed equivalent.                                                                                 |
| User model stats                | Per-user, per-model cost breakdown from raw usage events                           | Used `dev.analyticsdbpublic.usageevent` (raw events) on Redshift. This is exactly the kind of unblessed data stitching the rebuild is trying to eliminate. |

---

## Questions for RevOps

1. **Is the `cursor_token_fee_calc_usd_month` column in `temp_model_usage_monthly_sfdc` the correct source for Cursor Token Fee?** The old version uses `$0.25 per million tokens` hardcoded. Which is the source of truth?

2. **Is there a blessed per-user cost table?** The rebuild can't show user spend distribution by dollar because `fct_revops_user_metrics` only has request counts, not costs. Does a per-user cost table exist in the blessed dbt models?

3. **Should bugbot usage be included or excluded from consumption totals?** The old version explicitly excludes it. The blessed tables don't have a way to filter it. Is there a `usage_type` or equivalent column we should be using?

4. **Is monthly granularity acceptable for the consumption view?** Or do we need to use `temp_model_usage_daily_sfdc` (which exists in the analytics schema) for day-level filtering?

5. **Is `dim_teams.sf_subscription_id` reliably populated?** The rebuild depends on this mapping. If it has gaps, customers would see empty dashboards.
