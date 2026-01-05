import { ApifyJobData } from '@/types/job';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';

// Career Site Job Listing API (incremental - new jobs)
const CAREER_SITE_API_ACTOR_ID = 'fantastic-jobs/career-site-job-listing-api';

// Career Site Job Listing Feed (full snapshot)
const CAREER_SITE_FEED_ACTOR_ID = 'fantastic-jobs/career-site-job-listing-feed';

// Expired Jobs Actor
const EXPIRED_JOBS_ACTOR_ID = 'fantastic-jobs/expired-jobs-actor';

interface ApifyRunConfig {
  timeframe?: '1hour' | '24hours' | '7days';
  country?: string;
  limit?: number;
}

export async function fetchNewJobsFromAPI(config: ApifyRunConfig = {}): Promise<ApifyJobData[]> {
  const { timeframe = '24hours', country = 'Netherlands', limit = 5000 } = config;
  
  console.log(`Fetching new jobs from Apify API (timeframe: ${timeframe})`);
  
  // This is a placeholder - you'll need to implement the actual Apify API call
  // using their SDK or REST API
  const response = await fetch(
    `https://api.apify.com/v2/acts/${CAREER_SITE_API_ACTOR_ID}/runs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
      body: JSON.stringify({
        timeframe,
        country,
        maxItems: limit,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Wait for the run to complete and fetch results
  // This is simplified - you'd need to poll for completion
  const datasetId = result.defaultDatasetId;
  const dataResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items`,
    {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
    }
  );

  const jobs = await dataResponse.json();
  console.log(`Fetched ${jobs.length} new jobs from Apify API`);
  
  return jobs;
}

export async function fetchAllJobsFromFeed(config: ApifyRunConfig = {}): Promise<ApifyJobData[]> {
  const { country = 'Netherlands', limit = 20000 } = config;
  
  console.log('Fetching all active jobs from Apify Feed');
  
  // This is a placeholder - implement actual Apify API call
  const response = await fetch(
    `https://api.apify.com/v2/acts/${CAREER_SITE_FEED_ACTOR_ID}/runs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
      body: JSON.stringify({
        country,
        maxItems: limit,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Apify Feed API error: ${response.statusText}`);
  }

  const result = await response.json();
  const datasetId = result.defaultDatasetId;
  
  const dataResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items`,
    {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
    }
  );

  const jobs = await dataResponse.json();
  console.log(`Fetched ${jobs.length} jobs from Apify Feed`);
  
  return jobs;
}

export async function fetchExpiredJobs(): Promise<string[]> {
  console.log('Fetching expired jobs from Apify');
  
  // This is a placeholder - implement actual Apify API call
  const response = await fetch(
    `https://api.apify.com/v2/acts/${EXPIRED_JOBS_ACTOR_ID}/runs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Apify Expired Jobs API error: ${response.statusText}`);
  }

  const result = await response.json();
  const datasetId = result.defaultDatasetId;
  
  const dataResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items`,
    {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
    }
  );

  const expiredJobs = await dataResponse.json();
  console.log(`Found ${expiredJobs.length} expired jobs`);
  
  // Return array of external_ids
  return expiredJobs.map((job: any) => job.external_id);
}

