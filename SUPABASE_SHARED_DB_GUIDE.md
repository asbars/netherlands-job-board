# Using Shared Supabase Database Guide

This guide explains how to use the JobMarket tables in an existing Supabase project alongside other tables.

## Why Table Prefixes?

Supabase free tier allows only **2 active projects**. If you're already using both slots, you can add JobMarket tables to an existing project by using the `jobmarket_` prefix. This keeps everything organized and makes it easy to migrate to a dedicated project later.

## Table Names with Prefix

All JobMarket tables use the `jobmarket_` prefix:

### Main Tables
- `jobmarket_jobs` - Job listings (main table)
- `jobmarket_user_job_alerts` - User notification preferences
- `jobmarket_apify_usage_logs` - Cost tracking

### Views
- `jobmarket_active_jobs_with_metrics` - Active jobs with analytics
- `jobmarket_jobs_expiring_soon` - Jobs about to expire
- `jobmarket_monthly_cost_summary` - Monthly cost breakdown

### Functions
- `jobmarket_increment_view_count(job_id)` - Track job views
- `jobmarket_update_modified_column()` - Auto-update timestamps

## Setup in Existing Supabase Project

### Step 1: Run the Schema

1. Open your existing Supabase project
2. Go to **SQL Editor**
3. Copy the entire `DATABASE_SCHEMA.sql` file
4. Click **Run**

All tables will be created with the `jobmarket_` prefix and won't conflict with your existing tables.

### Step 2: Verify Tables

Go to **Table Editor** and you should see:
- ✅ `jobmarket_jobs`
- ✅ `jobmarket_user_job_alerts`
- ✅ `jobmarket_apify_usage_logs`
- Your existing tables (unchanged)

### Step 3: Configure Environment Variables

Use the **same** Supabase credentials as your existing project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-existing-anon-key
```

No changes needed - the code automatically uses the prefixed table names!

## Querying Prefixed Tables

### In SQL Editor

```sql
-- Get all active jobs
SELECT * FROM jobmarket_jobs 
WHERE status = 'active'
ORDER BY date_posted DESC
LIMIT 10;

-- Check usage costs
SELECT * FROM jobmarket_monthly_cost_summary;

-- View job alerts
SELECT * FROM jobmarket_user_job_alerts
WHERE is_active = true;
```

### In Your Application

The code is already updated to use prefixed tables. For example:

```typescript
// lib/supabase.ts already uses 'jobmarket_jobs'
const { data } = await supabase
  .from('jobmarket_jobs')
  .select('*')
  .eq('status', 'active');
```

## Database Size Management

### Monitor Storage

Free tier includes **500 MB** database storage. Check usage:

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'jobmarket_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Storage Estimates

With 15,000 active jobs:

- `jobmarket_jobs`: ~50-100 MB (with all 90+ fields)
- `jobmarket_user_job_alerts`: <1 MB (unless many users)
- `jobmarket_apify_usage_logs`: <1 MB
- **Total**: ~100-150 MB

You'll have **350-400 MB** remaining for your other project data.

## Isolation & Security

### Row Level Security (RLS)

Each JobMarket table has its own RLS policies:

```sql
-- Jobs are public read-only
CREATE POLICY "Allow public read access to active jobs" 
  ON jobmarket_jobs
  FOR SELECT
  USING (status = 'active');

-- Alerts are user-specific
CREATE POLICY "Users can view their own alerts" 
  ON jobmarket_user_job_alerts
  FOR SELECT
  USING (user_id = current_user);
```

These policies don't affect your existing tables.

### Indexes

All indexes are prefixed too:
- `idx_jobmarket_jobs_*`
- `idx_jobmarket_user_job_alerts_*`
- `idx_jobmarket_apify_usage_logs_*`

No conflicts with your existing indexes!

## Migrating to Dedicated Project Later

When you're ready to move JobMarket to its own project:

### Step 1: Export Data

```sql
-- Export jobs
COPY jobmarket_jobs TO '/tmp/jobs.csv' CSV HEADER;

-- Export usage logs
COPY jobmarket_apify_usage_logs TO '/tmp/usage.csv' CSV HEADER;
```

Or use Supabase Dashboard → Table Editor → Export

### Step 2: Create New Project

1. Create new Supabase project
2. Run `DATABASE_SCHEMA.sql`
3. Import the CSV data

### Step 3: Update Environment Variables

```env
# Update to new project
NEXT_PUBLIC_SUPABASE_URL=https://new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=new-anon-key
```

### Step 4: Clean Up Old Project (Optional)

```sql
-- Drop all JobMarket tables from old project
DROP TABLE IF EXISTS jobmarket_jobs CASCADE;
DROP TABLE IF EXISTS jobmarket_user_job_alerts CASCADE;
DROP TABLE IF EXISTS jobmarket_apify_usage_logs CASCADE;

-- Drop views
DROP VIEW IF EXISTS jobmarket_active_jobs_with_metrics;
DROP VIEW IF EXISTS jobmarket_jobs_expiring_soon;
DROP VIEW IF EXISTS jobmarket_monthly_cost_summary;

-- Drop functions
DROP FUNCTION IF EXISTS jobmarket_increment_view_count(BIGINT);
DROP FUNCTION IF EXISTS jobmarket_update_modified_column();
```

**Done!** Zero downtime migration.

## Backup Strategy

### Automatic Backups

Supabase automatically backs up your database daily (7-day retention on free tier).

### Manual Export (Recommended)

Export regularly for extra safety:

```bash
# Using Supabase CLI
supabase db dump -f jobmarket_backup.sql --db-url "postgresql://..."

# Or via Dashboard
# Table Editor → Select table → Export → CSV
```

### Restore from Backup

```bash
# Using Supabase CLI
supabase db reset --db-url "postgresql://..."
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f jobmarket_backup.sql
```

## Performance Considerations

### Shared Database Performance

Since you're sharing a database:

1. **Connections**: Free tier has 50 concurrent connections
   - JobMarket uses ~2-5 connections typically
   - Monitor in Dashboard → Database → Connection pooling

2. **Query Performance**: 
   - All JobMarket tables have proper indexes
   - GIN indexes for array/JSON searches
   - Full-text search indexes

3. **Storage I/O**:
   - Free tier: Up to 500 MB storage
   - Unlimited reads/writes
   - No throttling on free tier

### Monitoring

Check metrics in Dashboard → Reports:
- Database size
- Active connections
- Query performance
- API requests

## Troubleshooting

### Problem: Tables Not Showing in Table Editor

**Solution**: Refresh the page or check SQL Editor for errors

### Problem: RLS Policy Blocking Queries

**Solution**: Remember you need to query through Supabase client (respects RLS), not direct SQL (bypasses RLS in SQL editor)

### Problem: Out of Storage

**Solution**:
1. Check table sizes (query above)
2. Delete old expired jobs:
   ```sql
   DELETE FROM jobmarket_jobs 
   WHERE status = 'expired' 
   AND expired_date < NOW() - INTERVAL '90 days';
   ```
3. Archive old usage logs

### Problem: Conflicts with Existing Tables

**Solution**: All JobMarket tables are prefixed, but if you have a table named `jobmarket_*`, rename it first.

## Cost Comparison

### Option 1: Shared Database (This Approach)
- **Cost**: $0 (use existing project)
- **Storage**: Shared 500 MB
- **Projects Used**: 1 of 2

### Option 2: Dedicated Project
- **Cost**: $0 (new project)
- **Storage**: Full 500 MB for JobMarket
- **Projects Used**: 2 of 2 (both slots filled)

### Option 3: Upgrade to Pro
- **Cost**: $25/month per project
- **Storage**: 8 GB per project
- **Projects**: Unlimited

For testing, shared database is perfect!

## Example: Checking Your Setup

Run this query to verify everything is set up correctly:

```sql
-- Check JobMarket table status
SELECT 
  'jobmarket_jobs' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('jobmarket_jobs')) as size
FROM jobmarket_jobs
UNION ALL
SELECT 
  'jobmarket_user_job_alerts',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('jobmarket_user_job_alerts'))
FROM jobmarket_user_job_alerts
UNION ALL
SELECT 
  'jobmarket_apify_usage_logs',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('jobmarket_apify_usage_logs'))
FROM jobmarket_apify_usage_logs;
```

Expected output:
```
table_name                    | row_count | size
------------------------------+-----------+------
jobmarket_jobs                | 15000     | 85 MB
jobmarket_user_job_alerts     | 0         | 8 kB
jobmarket_apify_usage_logs    | 30        | 16 kB
```

## Summary

✅ **Safe**: Prefixed tables don't conflict with existing data  
✅ **Easy**: Same Supabase credentials  
✅ **Organized**: Clear namespace for JobMarket  
✅ **Migrateable**: Easy to move to dedicated project later  
✅ **Free**: No additional costs  

You can now test JobMarket in your existing Supabase project without any conflicts!

