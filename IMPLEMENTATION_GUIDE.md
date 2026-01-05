# Implementation Guide - Netherlands Job Board

This guide walks you through implementing the complete automated job sync system.

## Phase 1: Initial Setup (Week 1)

### Step 1: Database Setup

1. Run the complete `DATABASE_SCHEMA.sql` in Supabase SQL Editor
2. Verify tables are created:
   - `jobs`
   - `user_job_alerts`
   - `apify_usage_logs`

### Step 2: Initial Job Population

Create a one-time script to populate your database:

```typescript
// scripts/initial-population.ts
import { fetchAllJobsFromFeed } from '@/lib/apify';
import { supabase } from '@/lib/supabase';

async function initialPopulation() {
  console.log('Starting initial job population...');
  
  // Fetch all active jobs from Apify Feed
  const apifyJobs = await fetchAllJobsFromFeed({
    country: 'Netherlands',
    limit: 20000
  });
  
  console.log(`Fetched ${apifyJobs.length} jobs from Apify`);
  
  // Transform and insert jobs
  const jobsToInsert = apifyJobs.map(job => ({
    external_id: job.external_id,
    title: job.title,
    organization: job.organization,
    url: job.url,
    description_html: job.description_html,
    location: job.location,
    job_type: job.job_type,
    experience_level: job.experience_level,
    salary_range: job.salary_range,
    remote_allowed: job.remote_allowed,
    company_size: job.company_size,
    industry: job.industry,
    headquarters_location: job.headquarters_location,
    linkedin_org_slug: job.linkedin_org_slug,
    linkedin_org_description: job.linkedin_org_description,
    source: 'feed',
    status: 'active',
    first_seen_date: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  }));
  
  // Insert in batches of 1000
  for (let i = 0; i < jobsToInsert.length; i += 1000) {
    const batch = jobsToInsert.slice(i, i + 1000);
    const { error } = await supabase
      .from('jobs')
      .upsert(batch, { onConflict: 'external_id' });
    
    if (error) {
      console.error(`Error inserting batch ${i / 1000 + 1}:`, error);
    } else {
      console.log(`Inserted batch ${i / 1000 + 1} (${batch.length} jobs)`);
    }
  }
  
  // Log usage
  await supabase.from('apify_usage_logs').insert({
    actor: 'career-site-job-listing-feed',
    job_count: apifyJobs.length,
    cost: apifyJobs.length * 0.002,
    notes: 'Initial population'
  });
  
  console.log('Initial population complete!');
}

initialPopulation();
```

Run it:
```bash
npx tsx scripts/initial-population.ts
```

## Phase 2: Daily Job Sync (Week 2)

### Step 1: Create Daily Sync API Route

Create `/app/api/cron/daily-sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fetchNewJobsFromAPI, fetchExpiredJobs } from '@/lib/apify';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    console.log('Starting daily job sync...');
    
    // 1. Fetch new jobs from last 24 hours
    const newJobs = await fetchNewJobsFromAPI({
      timeframe: '24hours',
      country: 'Netherlands',
    });
    
    console.log(`Found ${newJobs.length} new jobs`);
    
    // 2. Get existing job external_ids
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('external_id')
      .eq('status', 'active');
    
    const existingIds = new Set(existingJobs?.map(j => j.external_id) || []);
    
    // 3. Filter for truly new jobs
    const trulyNewJobs = newJobs.filter(j => !existingIds.has(j.external_id));
    
    console.log(`Inserting ${trulyNewJobs.length} truly new jobs`);
    
    // 4. Insert new jobs
    if (trulyNewJobs.length > 0) {
      const jobsToInsert = trulyNewJobs.map(job => ({
        external_id: job.external_id,
        title: job.title,
        organization: job.organization,
        url: job.url,
        description_html: job.description_html,
        location: job.location,
        job_type: job.job_type,
        experience_level: job.experience_level,
        salary_range: job.salary_range,
        remote_allowed: job.remote_allowed,
        company_size: job.company_size,
        industry: job.industry,
        headquarters_location: job.headquarters_location,
        linkedin_org_slug: job.linkedin_org_slug,
        linkedin_org_description: job.linkedin_org_description,
        source: 'api',
        status: 'active',
        first_seen_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      }));
      
      await supabase.from('jobs').insert(jobsToInsert);
    }
    
    // 5. Check for expired jobs
    const expiredJobIds = await fetchExpiredJobs();
    
    console.log(`Found ${expiredJobIds.length} expired jobs`);
    
    // 6. Mark jobs as expired
    if (expiredJobIds.length > 0) {
      await supabase
        .from('jobs')
        .update({
          status: 'expired',
          expired_date: new Date().toISOString(),
        })
        .in('external_id', expiredJobIds)
        .eq('status', 'active');
    }
    
    // 7. Log usage
    await supabase.from('apify_usage_logs').insert([
      {
        actor: 'career-site-job-listing-api',
        job_count: newJobs.length,
        cost: newJobs.length * 0.012,
        notes: 'Daily sync - new jobs'
      },
      {
        actor: 'expired-jobs-actor',
        job_count: expiredJobIds.length,
        cost: 20 / 30, // $20/month divided by 30 days
        notes: 'Daily sync - expired jobs'
      }
    ]);
    
    // 8. TODO: Send notifications to users
    // await sendDailyNotifications(trulyNewJobs);
    
    return NextResponse.json({
      success: true,
      newJobs: trulyNewJobs.length,
      expiredJobs: expiredJobIds.length,
    });
    
  } catch (error) {
    console.error('Daily sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error },
      { status: 500 }
    );
  }
}
```

### Step 2: Test the Endpoint Locally

```bash
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/daily-sync
```

### Step 3: Configure External Cron Service

Since Railway doesn't have built-in cron, use an external service:

#### Option A: cron-job.org (Free & Easy)

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create new cron job:
   - **URL**: `https://your-app.railway.app/api/cron/daily-sync`
   - **Schedule**: `0 5 * * *` (5am daily)
   - **Request Method**: GET
   - **Headers**: Add `Authorization: Bearer your-cron-secret`

#### Option B: GitHub Actions (Free for public repos)

The project includes `.github/workflows/daily-cron.yml`:

1. Add secrets to GitHub repository:
   - `CRON_SECRET`: Your cron secret
   - `APP_URL`: Your Railway app URL
2. Enable GitHub Actions in your repo
3. It will run automatically at 5am daily

## Phase 3: Monthly Cleanup (Optional)

Create `/app/api/cron/monthly-cleanup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fetchAllJobsFromFeed } from '@/lib/apify';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    console.log('Starting monthly cleanup...');
    
    // Fetch complete feed
    const feedJobs = await fetchAllJobsFromFeed({
      country: 'Netherlands',
    });
    
    const activeExternalIds = new Set(feedJobs.map(j => j.external_id));
    
    // Get all active jobs from DB
    const { data: dbJobs } = await supabase
      .from('jobs')
      .select('id, external_id')
      .eq('status', 'active');
    
    // Find jobs in DB but not in feed
    const toExpire = dbJobs?.filter(j => !activeExternalIds.has(j.external_id)) || [];
    
    console.log(`Expiring ${toExpire.length} jobs`);
    
    // Mark as expired
    if (toExpire.length > 0) {
      await supabase
        .from('jobs')
        .update({
          status: 'expired',
          expired_date: new Date().toISOString(),
        })
        .in('id', toExpire.map(j => j.id));
    }
    
    // Log usage
    await supabase.from('apify_usage_logs').insert({
      actor: 'career-site-job-listing-feed',
      job_count: feedJobs.length,
      cost: feedJobs.length * 0.002,
      notes: 'Monthly cleanup'
    });
    
    return NextResponse.json({
      success: true,
      totalJobs: feedJobs.length,
      expiredJobs: toExpire.length,
    });
    
  } catch (error) {
    console.error('Monthly cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
```

Add another cron job to your external service:

**cron-job.org**:
- URL: `https://your-app.railway.app/api/cron/monthly-cleanup`
- Schedule: `0 3 1 * *` (3am on 1st of month)

**GitHub Actions**:
Already configured in `.github/workflows/daily-cron.yml`

## Phase 4: User Notifications (Future)

### Email Notification System

1. Sign up for a service like Resend, SendGrid, or AWS SES
2. Create notification logic:

```typescript
// lib/notifications.ts
import { Job } from '@/types/job';
import { supabase } from './supabase';

export async function sendDailyNotifications(newJobs: Job[]) {
  // Get users with daily alerts
  const { data: alerts } = await supabase
    .from('user_job_alerts')
    .select('*')
    .eq('frequency', 'daily')
    .eq('is_active', true);
  
  for (const alert of alerts || []) {
    // Filter jobs matching user preferences
    const matchingJobs = newJobs.filter(job => 
      matchesUserPreferences(job, alert)
    );
    
    if (matchingJobs.length > 0) {
      await sendEmail({
        to: alert.email,
        subject: `${matchingJobs.length} new jobs matching your criteria`,
        template: 'daily-digest',
        data: {
          jobs: matchingJobs,
          alert: alert,
        }
      });
      
      // Update last_sent
      await supabase
        .from('user_job_alerts')
        .update({ last_sent: new Date().toISOString() })
        .eq('id', alert.id);
    }
  }
}

function matchesUserPreferences(job: Job, alert: any): boolean {
  // Check keywords
  if (alert.keywords.length > 0) {
    const hasKeyword = alert.keywords.some((keyword: string) =>
      job.title.toLowerCase().includes(keyword.toLowerCase()) ||
      job.description_html.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!hasKeyword) return false;
  }
  
  // Check locations
  if (alert.locations.length > 0 && job.location) {
    const hasLocation = alert.locations.some((loc: string) =>
      job.location?.toLowerCase().includes(loc.toLowerCase())
    );
    if (!hasLocation) return false;
  }
  
  // Check job types
  if (alert.job_types.length > 0 && job.job_type) {
    if (!alert.job_types.includes(job.job_type)) return false;
  }
  
  // Check remote
  if (alert.remote_only && !job.remote_allowed) {
    return false;
  }
  
  return true;
}
```

## Monitoring & Maintenance

### Cost Dashboard

Create an admin page to monitor costs:

```typescript
// app/admin/page.tsx (protected route)
import { supabase } from '@/lib/supabase';

export default async function AdminDashboard() {
  const { data: usage } = await supabase
    .from('apify_usage_logs')
    .select('*')
    .order('date', { ascending: false })
    .limit(30);
  
  const monthTotal = usage
    ?.filter(u => isThisMonth(u.date))
    .reduce((sum, u) => sum + parseFloat(u.cost), 0);
  
  return (
    <div>
      <h1>Cost Dashboard</h1>
      <p>This Month: ${monthTotal?.toFixed(2)}</p>
      {/* Display usage table */}
    </div>
  );
}
```

### Health Checks

Monitor your sync jobs:
- Check Vercel Cron logs
- Monitor Supabase query performance
- Track Apify API success rates
- Alert on failures

## Testing Checklist

- [ ] Initial population runs successfully
- [ ] Daily sync endpoint works locally
- [ ] Duplicate jobs are prevented (unique external_id)
- [ ] Expired jobs are marked correctly
- [ ] Filtering works on frontend
- [ ] Mobile responsive design
- [ ] Database indexes improve query speed
- [ ] Cron jobs run on schedule in production
- [ ] Cost tracking logs data correctly
- [ ] Error handling for API failures

## Go Live Checklist

- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Initial population complete
- [ ] Cron jobs scheduled
- [ ] Domain configured
- [ ] Analytics set up
- [ ] Error monitoring (Sentry, etc.)
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] First user tested the flow

---

Good luck with your Netherlands Job Board! 🚀

