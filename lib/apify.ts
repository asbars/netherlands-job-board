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
const EXPIRED_JOBS_ACTOR_ID = 'fantastic-jobs~expired-jobs-api-for-career-site-job-listing-api';

/**
 * Fetch new jobs from Apify Career Site Job Listing API (incremental)
 * Returns only jobs added in the specified timeframe
 */
export async function fetchNewJobsFromAPI(config: ApifyRunConfig = {}): Promise<ApifyJobData[]> {
  const {
    timeframe = '24h',
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
      timeRange: timeframe, // Apify expects 'timeRange', not 'timeframe'
      limit,
      includeAi: include_ai,
      includeLinkedIn: include_li,
      descriptionType: 'html',
      populateAiRemoteLocation: true,
      populateAiRemoteLocationDerived: true,
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
    
    return items as unknown as ApifyJobData[];
  } catch (error) {
    console.error('Error fetching new jobs from Apify API:', error);
    throw error;
  }
}

/**
 * Fetch all active jobs from Apify Career Site Job Listing Feed
 * Returns complete snapshot of all active jobs (last 6 months)
 *
 * Uses async approach: start run -> poll for completion -> fetch results
 */
export async function fetchAllJobsFromFeed(config: ApifyRunConfig = {}): Promise<ApifyJobData[]> {
  const {
    locationSearch = ['Netherlands'],
    locationExclusionSearch,
    limit = 5000,
    include_ai = true,
    include_li = true,
    memory = 1024, // 1GB memory in MB
  } = config;

  console.log(`Fetching all active jobs from Apify Feed (location: ${locationSearch.join(', ')}, limit: ${limit}, memory: ${memory}MB)`);

  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN environment variable is not set');
  }

  try {
    // Build the input object
    const input: Record<string, any> = {
      limit,
      includeAi: include_ai,
      includeLinkedIn: include_li,
      descriptionType: 'html',
      populateAiRemoteLocation: true,
      populateAiRemoteLocationDerived: true,
    };

    if (locationSearch && locationSearch.length > 0) {
      input.locationSearch = locationSearch;
    }
    if (locationExclusionSearch && locationExclusionSearch.length > 0) {
      input.locationExclusionSearch = locationExclusionSearch;
    }

    // Step 1: Start the actor run (async - returns immediately)
    console.log('Starting actor run with input:', JSON.stringify(input));
    const run = await apifyClient.actor(CAREER_SITE_FEED_ACTOR_ID).start(input, {
      memory,
    });

    console.log(`Actor run started: ${run.id}, status: ${run.status}, datasetId: ${run.defaultDatasetId}`);

    // Step 2: Poll for completion
    const runClient = apifyClient.run(run.id);
    let runInfo = await runClient.get();

    while (runInfo && !['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(runInfo.status)) {
      console.log(`Run ${run.id} status: ${runInfo.status}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      runInfo = await runClient.get();
    }

    if (!runInfo || runInfo.status !== 'SUCCEEDED') {
      throw new Error(`Actor run failed with status: ${runInfo?.status || 'unknown'}`);
    }

    console.log(`Run completed: ${run.id}, status: ${runInfo.status}`);

    // Step 3: Fetch results from dataset
    const datasetClient = apifyClient.dataset(run.defaultDatasetId);
    const { items } = await datasetClient.listItems();

    console.log(`Fetched ${items.length} jobs from Apify Feed`);

    return items as unknown as ApifyJobData[];
  } catch (error) {
    console.error('Error fetching jobs from Apify Feed:', error);
    throw error;
  }
}

/**
 * Fetch list of expired job IDs from Apify
 * The actor returns a flat array of numeric IDs: [1316438376, 1318648037, ...]
 * We convert them to strings to match our external_id column format
 */
export async function fetchExpiredJobs(): Promise<string[]> {
  console.log('Fetching expired jobs from Apify');

  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN environment variable is not set');
  }

  try {
    const run = await apifyClient.actor(EXPIRED_JOBS_ACTOR_ID).call({
      returnAsArray: true,
    });

    console.log(`Expired jobs run completed: ${run.id}, status: ${run.status}, datasetId: ${run.defaultDatasetId}`);

    if (run.status !== 'SUCCEEDED') {
      throw new Error(`Expired jobs actor run failed with status: ${run.status}`);
    }

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    console.log(`Dataset returned ${items.length} item(s), first item type: ${typeof items[0]}, isArray: ${Array.isArray(items[0])}`);

    // Parse expired IDs from the actor response.
    // The actor returns [ID, ID, ID, ...] but the Apify SDK can wrap this in
    // various ways: as a nested array [[ID, ...]], a comma-separated string,
    // a JSON string, or individual numeric items.
    const expiredIds: string[] = [];

    const extractIds = (value: unknown): void => {
      if (Array.isArray(value)) {
        for (const v of value) extractIds(v);
      } else if (typeof value === 'number') {
        expiredIds.push(String(value));
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        // Try parsing as JSON first (e.g. "[123, 456, ...]")
        if (trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              extractIds(parsed);
              return;
            }
          } catch { /* not JSON, fall through */ }
        }
        // Comma-separated string of IDs (e.g. "123,456,789")
        if (trimmed.includes(',')) {
          for (const part of trimmed.split(',')) {
            const id = part.trim();
            if (id && /^\d+$/.test(id)) expiredIds.push(id);
          }
        } else if (/^\d+$/.test(trimmed)) {
          expiredIds.push(trimmed);
        }
      } else if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        const id = obj.id || obj.external_id;
        if (id != null) expiredIds.push(String(id));
      }
    };

    for (const item of items) {
      extractIds(item);
    }

    console.log(`Found ${expiredIds.length} expired job IDs (first 5: ${expiredIds.slice(0, 5).join(', ')})`);

    return expiredIds;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error).slice(0, 100);
    console.error('Error fetching expired jobs:', errMsg);
    throw error;
  }
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
