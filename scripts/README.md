# Scripts Directory

## populate-initial-jobs.ts

Manual script to populate the database with job data from Apify API.

### What it does:

1. ✅ Validates environment variables
2. 🚀 Calls Apify Career Site Job Listing API
3. ⏳ Waits for the Apify run to complete
4. 📥 Fetches job data from the dataset
5. 📋 Displays sample jobs in the console
6. 💾 Inserts jobs into Supabase database (batch of 100)
7. 📊 Shows summary and cost
8. 📝 Logs usage to database

### Configuration:

- **Timeframe**: Last 24 hours
- **Country**: Netherlands
- **Max Items**: 1000 jobs (for testing)
- **Include AI fields**: Yes
- **Include LinkedIn data**: Yes

### Prerequisites:

1. Create `.env.local` file with your credentials:
   ```bash
   cp .env.local.example .env.local
   # Then edit .env.local with your actual values
   ```

2. Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `APIFY_API_TOKEN`

### Usage:

```bash
# Run the population script
npm run populate
```

### What you'll see:

```
═══════════════════════════════════════════════════════════
  Netherlands Job Board - Initial Population Script
═══════════════════════════════════════════════════════════

✅ Environment variables validated

🚀 Starting Apify Career Site Job Listing API...
   Timeframe: Last 24 hours
   Country: Netherlands
   Include AI fields: Yes
   Include LinkedIn data: Yes

📋 Run ID: xxxxx
📦 Dataset ID: xxxxx

⏳ Waiting for Apify run xxxxx to complete...
   Status: RUNNING...
✅ Apify run completed successfully

📥 Fetching job data from dataset...
✅ Retrieved 247 jobs from Apify

📋 Sample of 3 jobs:

1. Senior Software Engineer
   Company: TechCorp Netherlands
   Location: ["Amsterdam"]
   Type: Full-time
   Experience: 5-10
   Remote: Yes
   Skills: React, TypeScript, Node.js
   Source: greenhouse (careers.techcorp.com)
   External ID: abc123

...

💾 Inserting jobs into Supabase database...

   Processing batch 1/3 (100 jobs)...
   ✅ Batch complete (100 new, 0 updated)
   Processing batch 2/3 (100 jobs)...
   ✅ Batch complete (98 new, 2 updated)
   Processing batch 3/3 (47 jobs)...
   ✅ Batch complete (47 new, 0 updated)

📊 Summary:
   ✅ Successfully inserted/updated: 245 jobs
   ⏭️  Skipped (duplicates): 2 jobs

✅ Usage logged to database

🔍 Verifying data in database...
✅ Total active jobs in database: 245

💰 Cost Summary:
   Jobs fetched: 247
   Cost: $2.96

═══════════════════════════════════════════════════════════
✅ Population complete! Visit your app to see the jobs.
═══════════════════════════════════════════════════════════
```

### Timeframe Options:

You can modify the script to use different timeframes:

```typescript
// In populate-initial-jobs.ts, line ~114
body: JSON.stringify({
  timeframe: '24hours',  // Options: '1hour', '24hours', '7days'
  country: 'Netherlands',
  maxItems: 1000,
  include_ai: true,
  include_li: true,
}),
```

### Cost Calculation:

- API price: $0.012 per job
- 100 jobs = $1.20
- 500 jobs = $6.00
- 1000 jobs = $12.00

### Troubleshooting:

#### Missing environment variables
```
❌ Missing required environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
```
**Solution**: Create `.env.local` file with all required variables

#### No jobs found
```
⚠️  No jobs found for the last 24 hours in Netherlands.
```
**Solution**: Normal if no new postings. Try `'7days'` timeframe

#### Database connection error
```
❌ Error inserting jobs: connection refused
```
**Solution**: 
- Check Supabase URL and key
- Verify your IP is allowed (if using IP restrictions)
- Check if Supabase project is paused

#### Apify API error
```
❌ Apify API error: 401 - Unauthorized
```
**Solution**: Verify your `APIFY_API_TOKEN` is correct

### Running with different parameters:

To fetch more jobs or change timeframe, edit the script directly:

```typescript
// Line ~114 in populate-initial-jobs.ts
timeframe: '7days',     // Get last 7 days instead
maxItems: 2000,         // Increase limit
```

### Verifying data:

After running, check your Supabase database:

```sql
-- Total jobs
SELECT COUNT(*) FROM jobmarket_jobs WHERE status = 'active';

-- Jobs by source
SELECT source, COUNT(*) as count 
FROM jobmarket_jobs 
WHERE status = 'active'
GROUP BY source 
ORDER BY count DESC;

-- Jobs with AI data
SELECT COUNT(*) FROM jobmarket_jobs 
WHERE ai_key_skills IS NOT NULL;

-- Sample jobs
SELECT title, organization, cities_derived, ai_experience_level
FROM jobmarket_jobs 
WHERE status = 'active'
LIMIT 10;
```

### Next steps:

After successful population:
1. Visit your Railway app URL to see the jobs
2. Test the filters
3. Verify data quality
4. Set up automated cron jobs (when ready)

