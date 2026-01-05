# Scripts Directory

## populate-with-sdk.ts

Manual script to populate the database with job data from Apify API using the official Apify SDK.

### What it does:

1. ✅ Validates environment variables
2. 🚀 Calls Apify Career Site Job Listing API (using SDK)
3. ⏳ Waits for the Apify run to complete automatically
4. 📥 Fetches job data from the dataset
5. 📋 Displays sample jobs in the console
6. 💾 Inserts jobs into Supabase database (batch of 100)
7. 📊 Shows summary and cost
8. 📝 Logs usage to database
9. 📍 Shows location breakdown

### Configuration:

- **Timeframe**: Last 24 hours
- **Location**: Netherlands (using `locationSearch` parameter)
- **Max Items**: 1000 jobs (for testing)
- **Include AI fields**: Yes
- **Include LinkedIn data**: Yes

### Prerequisites:

1. Create `.env.local` file with your credentials:
   ```bash
   cp env.local.template .env.local
   # Then edit .env.local with your actual values
   ```

2. Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (admin key for backend scripts)
   - `APIFY_API_TOKEN`

### Usage:

```bash
# Run the population script
npm run populate

# Or run directly
npx tsx scripts/populate-with-sdk.ts
```

### What you'll see:

```
═══════════════════════════════════════════════════════════
  Netherlands Job Board - Initial Population Script (SDK)
═══════════════════════════════════════════════════════════

✅ Environment variables validated

🚀 Starting Apify Career Site Job Listing API...
   Timeframe: Last 24 hours
   Location Search: Netherlands
   Include AI fields: Yes
   Include LinkedIn data: Yes

📋 Run ID: xxxxx
   Status: SUCCEEDED
   Dataset ID: xxxxx

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
   ✅ Batch complete (100 jobs processed)
   Processing batch 2/3 (100 jobs)...
   ✅ Batch complete (100 jobs processed)
   Processing batch 3/3 (47 jobs)...
   ✅ Batch complete (47 jobs processed)

📊 Summary:
   ✅ Successfully processed: 247 jobs

✅ Usage logged to database
📍 Location Breakdown:
   Netherlands: 245 jobs
   Belgium: 2 jobs

🔍 Verifying data in database...
✅ Total active jobs in database: 247

💰 Cost Summary:
   Jobs fetched: 247
   Cost: $2.96

═══════════════════════════════════════════════════════════
✅ Population complete! Visit your app to see the jobs.
═══════════════════════════════════════════════════════════
```

### Location Search Options:

The script uses the `locationSearch` parameter (array format):

```typescript
// Single location
locationSearch: ['Netherlands']

// Multiple locations
locationSearch: ['Amsterdam', 'Rotterdam', 'Utrecht']

// With exclusions
locationSearch: ['Netherlands']
locationExclusionSearch: ['Amsterdam']  // All Netherlands except Amsterdam

// ⚠️ Don't use abbreviations!
locationSearch: ['United Kingdom']  // ✅ Correct
locationSearch: ['UK']               // ❌ Wrong
```

### Other Search Parameters:

You can modify the script to use additional filters:

```typescript
// In populate-with-sdk.ts, modify the call parameters
const run = await apifyClient.actor(CAREER_SITE_API_ACTOR_ID).call({
  timeframe: '24hours',              // '1hour', '24hours', '7days'
  locationSearch: ['Netherlands'],   // Location filter (required array)
  titleSearch: ['Software', 'Developer'],  // Filter by job title
  organizationSearch: ['Google'],    // Filter by company
  organizationExclusionSearch: ['Recruitment'],  // Exclude agencies
  maxItems: 1000,
  include_ai: true,
  include_li: true,
});
```

### Cost Calculation:

- API price: $0.012 per job
- 100 jobs = $1.20
- 500 jobs = $6.00
- 1000 jobs = $12.00

### Troubleshooting:

#### Missing SERVICE_ROLE_KEY
```
❌ Missing required environment variables:
   - SUPABASE_SERVICE_ROLE_KEY
```
**Solution**: 
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (secret key)
3. Add to `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=your_key_here`

#### RLS Policy Error
```
❌ Error in batch: new row violates row-level security policy
```
**Solution**: Use `SUPABASE_SERVICE_ROLE_KEY` instead of `ANON_KEY`

#### Actor Not Found (404)
```
❌ Actor not found or not accessible!
```
**Solution**: 
1. Visit https://apify.com/fantastic-jobs/career-site-job-listing-api
2. Click "Try for free" to subscribe
3. Verify your API token is correct

#### Invalid locationSearch
```
❌ Input is not valid: Field input.locationSearch must be array
```
**Solution**: Use array format: `locationSearch: ['Netherlands']`

### Verifying data:

After running, check your Supabase database:

```sql
-- Total jobs
SELECT COUNT(*) FROM jobmarket_jobs WHERE status = 'active';

-- Jobs by country
SELECT 
  jsonb_array_elements_text(countries_derived) as country,
  COUNT(*) as count 
FROM jobmarket_jobs 
WHERE status = 'active'
GROUP BY country 
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

## test-sdk.ts

Diagnostic script to test Apify API access and actor availability.

### Usage:

```bash
npm run test-apify
```

This will verify:
- ✅ API token is valid
- ✅ User account is authenticated
- ✅ Target actor is accessible
- ✅ You're subscribed to the actor
