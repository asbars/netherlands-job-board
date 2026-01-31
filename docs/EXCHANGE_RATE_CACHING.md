# Exchange Rate Caching System

## Overview

Exchange rates are cached for **1 hour** to reduce API calls to Frankfurter and improve performance. Rates are stored in the database with timestamps.

## How It Works

### 1. User Applies Salary Filter

When a user filters by salary (e.g., "Minimum Salary > €50,000 per year"):

1. **Get unique currencies** from database (USD, GBP, CHF, etc.)
2. **For each currency pair** (e.g., USD → EUR):
   - **Check cache**: Is there a rate less than 1 hour old?
   - **Cache hit**: Use cached rate ✅ (no API call)
   - **Cache miss**: Fetch from Frankfurter API, save to cache
3. **Pass rates** to SQL function for conversion
4. **Filter jobs** using converted salaries

### 2. Cache Lookup Flow

```
User filters by EUR
  ↓
Need to convert USD, GBP, CHF → EUR
  ↓
For USD → EUR:
  ↓
Check cache: get_cached_exchange_rate('USD', 'EUR')
  ↓
  ├─ Rate found & < 1 hour old? → Use cached rate (0.93)
  │                                 ✅ No API call
  ↓
  └─ Rate not found OR > 1 hour old? → Fetch from API
                                       → Save to cache
                                       → Use fresh rate
```

### 3. Cache Storage

**Table**: `exchange_rates_cache`

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| from_currency | TEXT | Source currency (e.g., 'USD') |
| to_currency | TEXT | Target currency (e.g., 'EUR') |
| rate | NUMERIC | Exchange rate |
| fetched_at | TIMESTAMPTZ | When rate was fetched |

**Unique constraint**: (from_currency, to_currency)

### 4. Example Records

```sql
SELECT * FROM exchange_rates_cache;
```

| from_currency | to_currency | rate | fetched_at |
|--------------|-------------|------|------------|
| USD | EUR | 0.93 | 2026-01-31 14:30:00 |
| GBP | EUR | 1.17 | 2026-01-31 14:30:00 |
| CHF | EUR | 1.05 | 2026-01-31 14:30:00 |
| USD | GBP | 0.79 | 2026-01-31 13:15:00 |

## Functions

### `get_cached_exchange_rate(from, to)`

Returns cached rate if less than 1 hour old, NULL otherwise.

```sql
SELECT public.get_cached_exchange_rate('USD', 'EUR');
-- Returns: 0.93 (if cached and < 1 hour)
-- Returns: NULL (if not cached or > 1 hour)
```

### `set_cached_exchange_rate(from, to, rate)`

Saves or updates exchange rate with current timestamp.

```sql
SELECT public.set_cached_exchange_rate('USD', 'EUR', 0.93);
-- Inserts new rate or updates existing with NOW()
```

### `cleanup_old_exchange_rates()`

Removes rates older than 7 days.

```sql
SELECT public.cleanup_old_exchange_rates();
-- Returns: number of rows deleted
```

**Schedule this to run daily** to keep table clean.

## Performance Benefits

### Without Caching
- Every filter operation = API calls for all currency pairs
- Example: 5 currencies = 5 API calls per filter
- 100 users filtering = 500 API calls

### With 1-Hour Caching
- First user in an hour = API calls (cache population)
- Next 99 users = cached rates (no API calls)
- 100 users filtering = 5 API calls (95% reduction!)

## API Call Reduction

**Scenario**: 100 users filter by EUR salary over 1 hour
- Unique currencies in database: USD, GBP, CHF, SEK, NOK (5 currencies)

**Without cache**:
- 100 users × 5 currencies = **500 API calls**

**With cache**:
- First user: 5 API calls (populates cache)
- Next 99 users: 0 API calls (use cache)
- Total: **5 API calls** (99% reduction!)

## Cache Expiry

Rates expire after **1 hour** because:
- Exchange rates change throughout the day
- 1 hour balances freshness vs API usage
- ECB (Frankfurter) updates rates daily
- Intraday fluctuations are captured

## Deployment Steps

1. **Run SQL script** in Supabase:
   ```
   sql/create_exchange_rates_cache.sql
   ```

2. **Code automatically deployed** (already in lib/supabase.ts)

3. **Optional**: Set up daily cleanup job
   ```sql
   -- Run daily via Supabase cron or external scheduler
   SELECT public.cleanup_old_exchange_rates();
   ```

## Monitoring

### Check cache usage:

```sql
-- Total cached rates
SELECT COUNT(*) FROM exchange_rates_cache;

-- Recent rates (last hour)
SELECT * FROM exchange_rates_cache
WHERE fetched_at > NOW() - INTERVAL '1 hour'
ORDER BY fetched_at DESC;

-- Most frequently cached pairs
SELECT from_currency, to_currency, COUNT(*) as updates
FROM exchange_rates_cache
GROUP BY from_currency, to_currency
ORDER BY updates DESC;
```

### Check cache freshness:

```sql
-- Rates older than 1 hour (expired)
SELECT * FROM exchange_rates_cache
WHERE fetched_at < NOW() - INTERVAL '1 hour';

-- Average age of cached rates
SELECT AVG(NOW() - fetched_at) as avg_age
FROM exchange_rates_cache;
```

## Error Handling

- **Cache query fails**: Falls back to API fetch
- **API fetch fails**: Uses rate of 1.0 (no conversion)
- **Cache save fails**: Logs warning, continues with fetched rate

## Future Enhancements

- **Extend cache duration** to 24 hours (rates updated daily by ECB)
- **Batch API calls** using Frankfurter's multi-currency endpoint
- **Cache warming** on startup for common currency pairs
- **Redis cache** for faster lookups (if needed)
