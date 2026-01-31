# Complete Salary Filtering with Period + Currency Conversion

## Overview

The salary filtering system allows users to filter jobs by salary in their preferred **period** (per hour/month/year) AND **currency** (EUR, USD, GBP, etc.). The system automatically:
1. Converts all job salaries to the user's selected period
2. Converts all job salaries to the user's selected currency using live exchange rates
3. Compares converted values to provide accurate results

## User Flow

When adding a salary filter:

1. **Step 1**: Select field (e.g., "Minimum Salary")
2. **Step 2**: Select salary period
   - Per Hour
   - Per Month
   - Per Year
3. **Step 3**: Select currency
   - EUR (Euro)
   - USD (US Dollar)
   - GBP (British Pound)
   - CHF (Swiss Franc)
   - SEK, NOK, DKK, PLN, CZK, HUF
4. **Step 4**: Select operator (e.g., "is greater than")
5. **Step 5**: Enter value (e.g., 50000)

## Example Scenarios

### Example 1: User filters "Minimum Salary > €50,000 per year"

**Job A**: Has $60,000 per year (USD)
- Period conversion: Already per year, no conversion needed
- Currency conversion: Fetch USD→EUR rate (0.93)
- Calculation: $60,000 × 0.93 = **€55,800**
- Result: **INCLUDED** ✅ (€55,800 > €50,000)

**Job B**: Has £3,000 per month (GBP)
- Period conversion: £3,000 × 12 = £36,000 per year
- Currency conversion: Fetch GBP→EUR rate (1.17)
- Calculation: £36,000 × 1.17 = **€42,120**
- Result: **EXCLUDED** ❌ (€42,120 < €50,000)

**Job C**: Has €30 per hour (EUR, 40 hours/week)
- Period conversion: €30 × 40 × 52 = €62,400 per year
- Currency conversion: Already EUR, no conversion needed
- Result: **INCLUDED** ✅ (€62,400 > €50,000)

**Job D**: Has CHF 6,000 per month (CHF)
- Period conversion: CHF 6,000 × 12 = CHF 72,000 per year
- Currency conversion: Fetch CHF→EUR rate (1.05)
- Calculation: CHF 72,000 × 1.05 = **€75,600**
- Result: **INCLUDED** ✅ (€75,600 > €50,000)

### Example 2: User filters "Minimum Salary > $25 per hour"

**Job A**: Has €48,000 per year (EUR, 40 hours/week)
- Period conversion: €48,000 / (52 × 40) = €23.08 per hour
- Currency conversion: Fetch EUR→USD rate (1.08)
- Calculation: €23.08 × 1.08 = **$24.93 per hour**
- Result: **EXCLUDED** ❌ ($24.93 < $25)

**Job B**: Has $4,500 per month (USD, 40 hours/week)
- Period conversion: $4,500 / (4.33 × 40) = $25.95 per hour
- Currency conversion: Already USD, no conversion needed
- Result: **INCLUDED** ✅ ($25.95 > $25)

## Technical Implementation

### 1. Currency Conversion API

**Provider**: Frankfurter API (https://api.frankfurter.app)
- Free, no API key required
- Provided by European Central Bank
- Daily exchange rate updates
- Reliable and stable

**API Endpoint**:
```
GET https://api.frankfurter.app/latest?from=USD&to=EUR
```

**Response**:
```json
{
  "amount": 1,
  "base": "USD",
  "date": "2026-01-31",
  "rates": {
    "EUR": 0.93
  }
}
```

### 2. Database Functions

#### `convert_salary_to_unit()`
Converts salary between time periods (hour/day/week/month/year).

```sql
public.convert_salary_to_unit(
  p_value numeric,           -- The salary amount
  p_from_unit text,          -- Current unit ('per hour', 'per month', etc.)
  p_to_unit text,            -- Target unit
  p_working_hours numeric    -- Hours per week (default 40)
) RETURNS numeric
```

#### `convert_salary_full()`
Combines period AND currency conversion in one function.

```sql
public.convert_salary_full(
  p_value numeric,              -- The salary amount
  p_from_period text,           -- Current period ('per hour', etc.)
  p_to_period text,             -- Target period
  p_from_currency text,         -- Current currency ('USD', 'EUR', etc.)
  p_to_currency text,           -- Target currency
  p_exchange_rate_map jsonb,    -- Map of currency → rate
  p_working_hours numeric       -- Hours per week (default 40)
) RETURNS numeric
```

#### `search_jobs_with_filters()`
Updated RPC function with exchange rate support.

```sql
public.search_jobs_with_filters(
  p_filters jsonb,              -- Filter conditions
  p_page integer,               -- Page number
  p_page_size integer,          -- Results per page
  p_exchange_rates jsonb        -- Exchange rate map
) RETURNS TABLE (jobs jsonb, total_count bigint)
```

### 3. Frontend Logic

**Step 1**: User selects currency (e.g., EUR)

**Step 2**: Frontend fetches unique currencies from database
```typescript
SELECT DISTINCT ai_salary_currency
FROM jobmarket_jobs
WHERE status = 'active'
```

**Step 3**: Frontend fetches exchange rates FROM each currency TO target currency
```typescript
// If target is EUR and database has [USD, GBP, CHF]
// Fetch: USD→EUR, GBP→EUR, CHF→EUR
const rates = {
  "USD": 0.93,  // 1 USD = 0.93 EUR
  "GBP": 1.17,  // 1 GBP = 1.17 EUR
  "CHF": 1.05,  // 1 CHF = 1.05 EUR
  "EUR": 1.00   // 1 EUR = 1.00 EUR
};
```

**Step 4**: Frontend passes filter with exchange rates to backend
```typescript
const filter = {
  field: 'ai_salary_minvalue',
  operator: 'greater_than',
  value: 50000,
  salary_period: 'per year',
  salary_currency: 'EUR'
};

await supabase.rpc('search_jobs_with_filters', {
  p_filters: [filter],
  p_page: 1,
  p_page_size: 20,
  p_exchange_rates: rates  // Pass the exchange rate map
});
```

**Step 5**: Backend applies conversion for each job
```sql
-- For a job with $60,000 per year (USD)
-- Convert to EUR per year
convert_salary_full(
  60000,                  -- value
  'per year',            -- from period
  'per year',            -- to period (no change)
  'USD',                 -- from currency
  'EUR',                 -- to currency
  '{"USD": 0.93}'::jsonb, -- exchange rates
  40                     -- working hours
)
-- Result: 60000 × 0.93 = 55,800
-- Then compare: 55,800 > 50,000 → INCLUDE
```

## Deployment Steps

1. **Run SQL scripts** in Supabase (in order):
   ```sql
   -- First: Create/update conversion functions
   sql/salary_conversion_functions.sql

   -- Second: Update RPC function
   sql/array_text_search_v12_final.sql
   ```

2. **Deploy frontend code**
   - Already pushed to try-shadcn-ui branch
   - Will deploy automatically via Railway

3. **Test**
   - Add a salary filter
   - Select different currencies
   - Verify exchange rates are fetched
   - Verify results are accurate

## Conversion Constants

- **Hours per week**: 40 (default) or `ai_working_hours` from job
- **Weeks per year**: 52
- **Weeks per month**: 4.33 (52/12)
- **Days per week**: 5
- **Hours per day**: 8

## Supported Currencies

| Code | Name | Symbol |
|------|------|--------|
| EUR | Euro | € |
| USD | US Dollar | $ |
| GBP | British Pound | £ |
| CHF | Swiss Franc | CHF |
| SEK | Swedish Krona | kr |
| NOK | Norwegian Krone | kr |
| DKK | Danish Krone | kr |
| PLN | Polish Zloty | zł |
| CZK | Czech Koruna | Kč |
| HUF | Hungarian Forint | Ft |

## Error Handling

- **Exchange rate fetch fails**: Uses rate of 1.0 (no conversion)
- **Unknown currency**: Treats as target currency (no conversion)
- **NULL salary values**: Skipped in filtering
- **Invalid period**: Returns NULL from conversion

## Performance Considerations

- Exchange rates fetched once per filter operation
- Rates cached for the duration of the request
- Conversion done in SQL (fast)
- Only unique currencies fetched (efficient)

## Future Enhancements

- Cache exchange rates for 24 hours (reduce API calls)
- Add more currencies
- Historical rate comparisons
- Salary range normalization across currencies
