/**
 * Populate from Feed Script
 * 
 * Uses Apify Career Site Job Listing Feed (cheaper: $2 per 1000 jobs)
 * to populate the database with latest jobs in the Netherlands.
 * 
 * Feed API returns all active jobs (last 6 months) sorted by date_created DESC,
 * so setting maxItems limits to the most recent jobs.
 * 
 * Usage:
 *   npm run populate:feed
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';

// Apify Actor ID for Feed
const CAREER_SITE_FEED_ACTOR_ID = 'fantastic-jobs~career-site-job-listing-feed';

// Configuration
const MAX_JOBS = 5000;
const COST_PER_1000_JOBS = 2; // $2 per 1000 jobs for Feed

// Validate environment variables
function validateEnvironment() {
  const missing: string[] = [];
  
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!APIFY_API_TOKEN) missing.push('APIFY_API_TOKEN');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nMake sure your .env.local file is set up correctly.');
    console.error('Get your Apify token from: https://console.apify.com/account/integrations');
    console.error('Get your Supabase SERVICE_ROLE key from: https://supabase.com/dashboard (Settings > API)');
    console.error('\n⚠️  Note: SERVICE_ROLE key is needed for backend scripts to bypass RLS policies.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated\n');
}

// Initialize clients
const apifyClient = new ApifyClient({
  token: APIFY_API_TOKEN,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Fetch jobs from Apify Feed (all active jobs, most recent first)
 */
async function fetchJobsFromFeed(): Promise<any[]> {
  console.log('🚀 Starting Apify Career Site Job Listing Feed...');
  console.log('   Type: Feed (all active jobs, last 6 months)');
  console.log('   Location: Netherlands');
  console.log('   Max Items: ' + MAX_JOBS.toLocaleString());
  console.log('   Include AI fields: Yes');
  console.log('   Include LinkedIn data: Yes');
  console.log(`   Estimated cost: $${((MAX_JOBS / 1000) * COST_PER_1000_JOBS).toFixed(2)}\n`);
  
  try {
    // Start the actor run using SDK
    const run = await apifyClient.actor(CAREER_SITE_FEED_ACTOR_ID).call({
      locationSearch: ['Netherlands'],
      limit: MAX_JOBS,
      includeAi: true,
      includeLinkedIn: true,
      descriptionType: 'html',
    });
    
    console.log(`📋 Run ID: ${run.id}`);
    console.log(`   Status: ${run.status}`);
    console.log(`   Dataset ID: ${run.defaultDatasetId}\n`);
    
    if (run.status !== 'SUCCEEDED') {
      throw new Error(`Actor run failed with status: ${run.status}`);
    }
    
    // Fetch the results from the dataset
    console.log('📥 Fetching job data from dataset...');
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    console.log(`✅ Retrieved ${items.length} jobs from Apify Feed\n`);
    
    return items;
  } catch (error: any) {
    if (error.message?.includes('not found') || error.statusCode === 404) {
      console.error('\n❌ Actor not found or not accessible!');
      console.error('\n📋 Possible solutions:');
      console.error('   1. Subscribe to the actor at: https://apify.com/fantastic-jobs/career-site-job-listing-feed');
      console.error('   2. Click "Try for free" or choose a pricing plan');
      console.error('   3. Verify your API token is correct');
      console.error('   4. Check that your Apify account is active\n');
      throw error;
    }
    throw error;
  }
}

/**
 * Transform Apify job data to our database format
 */
function transformJobForDatabase(apifyJob: any) {
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
    remote_derived: apifyJob.remote_derived || false,
    
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
    data_source: 'feed',
    status: 'active',
    first_seen_date: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Insert jobs into Supabase database
 */
async function insertJobsToDatabase(jobs: any[]): Promise<void> {
  console.log('💾 Inserting jobs into Supabase database...\n');
  
  const batchSize = 100;
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const transformedBatch = batch.map(transformJobForDatabase);
    
    console.log(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)} (${batch.length} jobs)...`);
    
    const { data, error } = await supabase
      .from('jobmarket_jobs')
      .upsert(transformedBatch, { 
        onConflict: 'external_id',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      console.error(`   ❌ Error in batch: ${error.message}`);
      errors += batch.length;
    } else {
      const count = data?.length || 0;
      inserted += count;
      console.log(`   ✅ Batch complete (${count} jobs processed)`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully processed: ${inserted} jobs`);
  if (errors > 0) console.log(`   ❌ Errors: ${errors} jobs`);
  console.log('');
}

/**
 * Display sample job data
 */
function displaySampleJobs(jobs: any[], count = 5): void {
  console.log(`\n📋 Sample of ${Math.min(count, jobs.length)} jobs:\n`);
  
  jobs.slice(0, count).forEach((job, index) => {
    console.log(`${index + 1}. ${job.title}`);
    console.log(`   Company: ${job.organization}`);
    console.log(`   Location: ${JSON.stringify(job.cities_derived || 'N/A')}`);
    console.log(`   Posted: ${job.date_posted || 'N/A'}`);
    console.log(`   Type: ${job.employment_type?.join(', ') || 'N/A'}`);
    console.log(`   Experience: ${job.ai_experience_level || 'N/A'}`);
    console.log(`   Remote: ${job.remote_derived ? 'Yes' : 'No'}`);
    console.log(`   Source: ${job.source} (${job.source_domain})`);
    console.log('');
  });
}

/**
 * Log usage to database
 */
async function logApifyUsage(jobCount: number, cost: number): Promise<void> {
  const { error } = await supabase
    .from('jobmarket_apify_usage_logs')
    .insert({
      actor: 'career-site-job-listing-feed',
      job_count: jobCount,
      cost: cost,
      notes: 'Initial population from Feed (2000 jobs)',
      run_status: 'success',
    });
  
  if (error) {
    console.error('⚠️  Warning: Could not log usage to database:', error.message);
  } else {
    console.log('✅ Usage logged to database');
  }
}

/**
 * Display statistics
 */
function displayStatistics(jobs: any[]): void {
  console.log('📊 Job Statistics:\n');
  
  // By city
  const cityCount: Record<string, number> = {};
  jobs.forEach(job => {
    if (Array.isArray(job.cities_derived)) {
      job.cities_derived.forEach((cityObj: any) => {
        const city = typeof cityObj === 'string' ? cityObj : cityObj?.city;
        if (city) {
          cityCount[city] = (cityCount[city] || 0) + 1;
        }
      });
    }
  });
  
  console.log('Top 10 Cities:');
  Object.entries(cityCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([city, count], index) => {
      console.log(`   ${index + 1}. ${city}: ${count} jobs`);
    });
  
  // By experience level
  console.log('\nBy Experience Level:');
  const expCount: Record<string, number> = {};
  jobs.forEach(job => {
    const exp = job.ai_experience_level || 'Not specified';
    expCount[exp] = (expCount[exp] || 0) + 1;
  });
  Object.entries(expCount)
    .sort(([, a], [, b]) => b - a)
    .forEach(([exp, count]) => {
      console.log(`   ${exp}: ${count} jobs`);
    });
  
  // By employment type
  console.log('\nBy Employment Type:');
  const typeCount: Record<string, number> = {};
  jobs.forEach(job => {
    const types = job.employment_type || ['Not specified'];
    types.forEach((type: string) => {
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
  });
  Object.entries(typeCount)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count} jobs`);
    });
  
  // Remote jobs
  const remoteCount = jobs.filter(job => job.remote_derived).length;
  console.log(`\nRemote Jobs: ${remoteCount} (${((remoteCount / jobs.length) * 100).toFixed(1)}%)`);
  
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Netherlands Job Board - Feed Population Script');
  console.log('  Get 2000 Latest Jobs (~$4 cost)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Validate environment
    validateEnvironment();
    
    // Step 2: Fetch jobs from Feed
    const jobs = await fetchJobsFromFeed();
    
    if (jobs.length === 0) {
      console.log('⚠️  No jobs found in Netherlands.');
      console.log('   Check Apify dashboard or try different filters.');
      return;
    }
    
    // Step 3: Display sample data
    displaySampleJobs(jobs);
    
    // Step 4: Display statistics
    displayStatistics(jobs);
    
    // Step 5: Insert into database
    await insertJobsToDatabase(jobs);
    
    // Step 6: Log usage
    const cost = (jobs.length / 1000) * COST_PER_1000_JOBS;
    await logApifyUsage(jobs.length, cost);
    
    // Step 7: Verify data in database
    console.log('🔍 Verifying data in database...');
    const { count, error } = await supabase
      .from('jobmarket_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    if (error) {
      console.error('❌ Error verifying data:', error.message);
    } else {
      console.log(`✅ Total active jobs in database: ${count}\n`);
    }
    
    // Step 8: Display cost
    console.log('💰 Cost Summary:');
    console.log(`   Jobs fetched: ${jobs.length.toLocaleString()}`);
    console.log(`   Cost: $${cost.toFixed(2)}`);
    console.log(`   Remaining credit: ~$${(4.5 - cost).toFixed(2)}`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Population complete! Visit your app to see the jobs.');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during population:');
    console.error('   ', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
main();

