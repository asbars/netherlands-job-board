import { ApifyClient } from 'apify-client';
import { ApifyJobData, ApifyRunConfig } from '@/types/job';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';

// Initialize Apify Client
const apifyClient = new ApifyClient({
  token: APIFY_API_TOKEN,
});

// Apify Actor IDs (note: using ~ not / for API calls)
const CAREER_SITE_API_ACTOR_ID = 'fantastic-jobs~career-site-job-listing-api';
const CAREER_SITE_FEED_ACTOR_ID = 'fantastic-jobs~career-site-job-listing-feed';
const EXPIRED_JOBS_ACTOR_ID = 'fantastic-jobs~career-site-job-listing-expired-jobs';

/**
 * Fetch new jobs from Apify Career Site Job Listing API (incremental)
 * Returns only jobs added in the specified timeframe
 */
export async function fetchNewJobsFromAPI(config: ApifyRunConfig = {}): Promise<ApifyJobData[]> {
  const { 
    timeframe = '24hours', 
    locationSearch = ['Netherlands'], 
    locationExclusionSearch,
    titleSearch,
    titleExclusionSearch,
    organizationSearch,
    organizationExclusionSearch,
    limit = 5000,
    include_ai = true,
    include_li = true 
  } = config;
  
  console.log(`Fetching new jobs from Apify API (timeframe: ${timeframe}, location: ${locationSearch.join(', ')})`);
  
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN environment variable is not set');
  }
  
  try {
    // Build the input object (only include defined search parameters)
    const input: Record<string, any> = {
      timeframe,
      maxItems: limit,
      include_ai,
      include_li,
    };
    
    if (locationSearch && locationSearch.length > 0) {
      input.locationSearch = locationSearch;
    }
    if (locationExclusionSearch && locationExclusionSearch.length > 0) {
      input.locationExclusionSearch = locationExclusionSearch;
    }
    if (titleSearch && titleSearch.length > 0) {
      input.titleSearch = titleSearch;
    }
    if (titleExclusionSearch && titleExclusionSearch.length > 0) {
      input.titleExclusionSearch = titleExclusionSearch;
    }
    if (organizationSearch && organizationSearch.length > 0) {
      input.organizationSearch = organizationSearch;
    }
    if (organizationExclusionSearch && organizationExclusionSearch.length > 0) {
      input.organizationExclusionSearch = organizationExclusionSearch;
    }
    
    // Start the actor run using SDK
    const run = await apifyClient.actor(CAREER_SITE_API_ACTOR_ID).call(input);
    
    console.log(`Run completed: ${run.id}, status: ${run.status}`);
    
    if (run.status !== 'SUCCEEDED') {
      throw new Error(`Actor run failed with status: ${run.status}`);
    }
    
    // Fetch the results from the dataset
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    console.log(`Fetched ${items.length} new jobs from Apify API`);
    
    return items;
  } catch (error) {
    console.error('Error fetching new jobs from Apify API:', error);
    throw error;
  }
}

/**
 * Fetch all active jobs from Apify Career Site Job Listing Feed
 * Returns complete snapshot of all active jobs (last 6 months)
 */
export async function fetchAllJobsFromFeed(config: ApifyRunConfig = {}): Promise<ApifyJobData[]> {
  const { 
    locationSearch = ['Netherlands'], 
    locationExclusionSearch,
    limit = 20000,
    include_ai = true,
    include_li = true 
  } = config;
  
  console.log(`Fetching all active jobs from Apify Feed (location: ${locationSearch.join(', ')})`);
  
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN environment variable is not set');
  }
  
  try {
    // Build the input object
    const input: Record<string, any> = {
      maxItems: limit,
      include_ai,
      include_li,
    };
    
    if (locationSearch && locationSearch.length > 0) {
      input.locationSearch = locationSearch;
    }
    if (locationExclusionSearch && locationExclusionSearch.length > 0) {
      input.locationExclusionSearch = locationExclusionSearch;
    }
    
    // Start the actor run using SDK
    const run = await apifyClient.actor(CAREER_SITE_FEED_ACTOR_ID).call(input);
    
    console.log(`Feed run completed: ${run.id}, status: ${run.status}`);
    
    if (run.status !== 'SUCCEEDED') {
      throw new Error(`Feed actor run failed with status: ${run.status}`);
    }
    
    // Fetch the results from the dataset
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    console.log(`Fetched ${items.length} jobs from Apify Feed`);
    
    return items;
  } catch (error) {
    console.error('Error fetching jobs from Apify Feed:', error);
    throw error;
  }
}

/**
 * Fetch list of expired job IDs
 * Returns array of external_ids that have expired
 */
export async function fetchExpiredJobs(): Promise<string[]> {
  console.log('Fetching expired jobs from Apify');
  
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN environment variable is not set');
  }
  
  try {
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${EXPIRED_JOBS_ACTOR_ID}/runs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIFY_API_TOKEN}`,
        },
        body: JSON.stringify({
          country: 'Netherlands',
        }),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Apify Expired Jobs API error: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const datasetId = runData.data.defaultDatasetId;
    
    console.log(`Expired jobs run started: ${runId}`);
    
    // Wait for completion
    await waitForRunCompletion(runId);
    
    // Fetch results
    const expiredJobsData = await fetchDatasetItems(datasetId);
    
    // Extract job IDs
    const expiredIds = expiredJobsData.map((job: any) => job.id || job.external_id);
    console.log(`Found ${expiredIds.length} expired jobs`);
    
    return expiredIds;
  } catch (error) {
    console.error('Error fetching expired jobs:', error);
    throw error;
  }
}

/**
 * Wait for an Apify actor run to complete
 */
async function waitForRunCompletion(runId: string, maxWaitTime = 600000): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 5000; // Poll every 5 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}`,
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`,
        },
      }
    );
    
    if (!statusResponse.ok) {
      throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
    }
    
    const statusData = await statusResponse.json();
    const status = statusData.data.status;
    
    console.log(`Run ${runId} status: ${status}`);
    
    if (status === 'SUCCEEDED') {
      return;
    }
    
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Actor run ${status.toLowerCase()}: ${runId}`);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error(`Run ${runId} did not complete within ${maxWaitTime / 1000} seconds`);
}

/**
 * Fetch items from an Apify dataset
 */
async function fetchDatasetItems(datasetId: string): Promise<ApifyJobData[]> {
  const response = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items`,
    {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch dataset items: ${response.statusText}`);
  }

  const items = await response.json();
  return items;
}

/**
 * Transform Apify job data to our database format
 */
export function transformApifyJobToDb(apifyJob: ApifyJobData, source: 'feed' | 'api') {
  return {
    external_id: apifyJob.id,
    title: apifyJob.title,
    organization: apifyJob.organization,
    organization_url: apifyJob.organization_url,
    organization_logo: apifyJob.organization_logo,
    url: apifyJob.url,
    
    // Dates
    date_posted: apifyJob.date_posted,
    date_created: apifyJob.date_created,
    date_validthrough: apifyJob.date_validthrough,
    date_modified: apifyJob.date_modified,
    
    // Descriptions
    description_text: apifyJob.description_text,
    description_html: apifyJob.description_html,
    
    // Location data
    locations_raw: apifyJob.locations_raw,
    locations_alt_raw: apifyJob.locations_alt_raw,
    locations_derived: apifyJob.locations_derived,
    location_type: apifyJob.location_type,
    location_requirements_raw: apifyJob.location_requirements_raw,
    
    // Derived locations
    cities_derived: apifyJob.cities_derived,
    regions_derived: apifyJob.regions_derived,
    countries_derived: apifyJob.countries_derived,
    timezones_derived: apifyJob.timezones_derived,
    lats_derived: apifyJob.lats_derived,
    lngs_derived: apifyJob.lngs_derived,
    remote_derived: apifyJob.remote_derived,
    
    // Employment & Salary
    employment_type: apifyJob.employment_type,
    salary_raw: apifyJob.salary_raw,
    
    // Source
    source: apifyJob.source,
    source_type: apifyJob.source_type,
    source_domain: apifyJob.source_domain,
    domain_derived: apifyJob.domain_derived,
    modified_fields: apifyJob.modified_fields,
    
    // AI fields
    ai_salary_currency: apifyJob.ai_salary_currency,
    ai_salary_value: apifyJob.ai_salary_value,
    ai_salary_minvalue: apifyJob.ai_salary_minvalue,
    ai_salary_maxvalue: apifyJob.ai_salary_maxvalue,
    ai_salary_unittext: apifyJob.ai_salary_unittext,
    ai_benefits: apifyJob.ai_benefits,
    ai_experience_level: apifyJob.ai_experience_level,
    ai_work_arrangement: apifyJob.ai_work_arrangement,
    ai_work_arrangement_office_days: apifyJob.ai_work_arrangement_office_days,
    ai_remote_location: apifyJob.ai_remote_location,
    ai_remote_location_derived: apifyJob.ai_remote_location_derived,
    ai_key_skills: apifyJob.ai_key_skills,
    ai_education_requirements: apifyJob.ai_education_requirements,
    ai_keywords: apifyJob.ai_keywords,
    ai_taxonomies_a: apifyJob.ai_taxonomies_a,
    ai_core_responsibilities: apifyJob.ai_core_responsibilities,
    ai_requirements_summary: apifyJob.ai_requirements_summary,
    ai_working_hours: apifyJob.ai_working_hours,
    ai_employment_type: apifyJob.ai_employment_type,
    ai_job_language: apifyJob.ai_job_language,
    ai_visa_sponsorship: apifyJob.ai_visa_sponsorship,
    ai_hiring_manager_name: apifyJob.ai_hiring_manager_name,
    ai_hiring_manager_email_address: apifyJob.ai_hiring_manager_email_address,
    
    // LinkedIn fields
    linkedin_org_employees: apifyJob.linkedin_org_employees,
    linkedin_org_url: apifyJob.linkedin_org_url,
    linkedin_org_size: apifyJob.linkedin_org_size,
    linkedin_org_slogan: apifyJob.linkedin_org_slogan,
    linkedin_org_industry: apifyJob.linkedin_org_industry,
    linkedin_org_followers: apifyJob.linkedin_org_followers,
    linkedin_org_headquarters: apifyJob.linkedin_org_headquarters,
    linkedin_org_type: apifyJob.linkedin_org_type,
    linkedin_org_foundeddate: apifyJob.linkedin_org_foundeddate,
    linkedin_org_specialties: apifyJob.linkedin_org_specialties,
    linkedin_org_locations: apifyJob.linkedin_org_locations,
    linkedin_org_description: apifyJob.linkedin_org_description,
    linkedin_org_recruitment_agency_derived: apifyJob.linkedin_org_recruitment_agency_derived,
    linkedin_org_slug: apifyJob.linkedin_org_slug,
    
    // Internal tracking
    data_source: source,
    first_seen_date: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    status: 'active' as const,
  };
}
