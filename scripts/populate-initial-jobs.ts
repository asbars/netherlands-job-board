/**
 * Manual Initial Job Population Script
 * 
 * Fetches jobs from Apify Career Site Job Listing API (last 24 hours)
 * and inserts them into the Supabase database.
 * 
 * Usage:
 *   npx tsx scripts/populate-initial-jobs.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';

// Apify Actor ID for incremental API
const CAREER_SITE_API_ACTOR_ID = 'fantastic-jobs/career-site-job-listing-api';

// Validate environment variables
function validateEnvironment() {
  const missing: string[] = [];
  
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!APIFY_API_TOKEN) missing.push('APIFY_API_TOKEN');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nMake sure your .env.local file is set up correctly.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated\n');
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Wait for Apify actor run to complete
 */
async function waitForRunCompletion(runId: string, maxWaitTime = 600000): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 5000; // Poll every 5 seconds
  
  console.log(`⏳ Waiting for Apify run ${runId} to complete...`);
  
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
    
    process.stdout.write(`\r   Status: ${status}...`);
    
    if (status === 'SUCCEEDED') {
      console.log('\n✅ Apify run completed successfully\n');
      return;
    }
    
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Actor run ${status.toLowerCase()}`);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error(`Run did not complete within ${maxWaitTime / 1000} seconds`);
}

/**
 * Fetch jobs from Apify API (last 24 hours)
 */
async function fetchJobsFromApify(): Promise<any[]> {
  console.log('🚀 Starting Apify Career Site Job Listing API...');
  console.log('   Timeframe: Last 24 hours');
  console.log('   Country: Netherlands');
  console.log('   Include AI fields: Yes');
  console.log('   Include LinkedIn data: Yes\n');
  
  // Start the actor run
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/${CAREER_SITE_API_ACTOR_ID}/runs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
      body: JSON.stringify({
        timeframe: '24hours',
        country: 'Netherlands',
        maxItems: 1000, // Limit for initial test
        include_ai: true,
        include_li: true,
      }),
    }
  );

  if (!runResponse.ok) {
    const errorText = await runResponse.text();
    throw new Error(`Apify API error: ${runResponse.status} - ${errorText}`);
  }

  const runData = await runResponse.json();
  const runId = runData.data.id;
  const datasetId = runData.data.defaultDatasetId;
  
  console.log(`📋 Run ID: ${runId}`);
  console.log(`📦 Dataset ID: ${datasetId}\n`);
  
  // Wait for completion
  await waitForRunCompletion(runId);
  
  // Fetch the results
  console.log('📥 Fetching job data from dataset...');
  const dataResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items`,
    {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
    }
  );

  if (!dataResponse.ok) {
    throw new Error(`Failed to fetch dataset items: ${dataResponse.statusText}`);
  }

  const jobs = await dataResponse.json();
  console.log(`✅ Retrieved ${jobs.length} jobs from Apify\n`);
  
  return jobs;
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
    data_source: 'api',
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
  let skipped = 0;
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
      const newJobs = data?.length || 0;
      inserted += newJobs;
      if (newJobs < batch.length) {
        skipped += (batch.length - newJobs);
      }
      console.log(`   ✅ Batch complete (${newJobs} new, ${batch.length - newJobs} updated)`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully inserted/updated: ${inserted} jobs`);
  if (skipped > 0) console.log(`   ⏭️  Skipped (duplicates): ${skipped} jobs`);
  if (errors > 0) console.log(`   ❌ Errors: ${errors} jobs`);
  console.log('');
}

/**
 * Display sample job data
 */
function displaySampleJobs(jobs: any[], count = 3): void {
  console.log(`\n📋 Sample of ${Math.min(count, jobs.length)} jobs:\n`);
  
  jobs.slice(0, count).forEach((job, index) => {
    console.log(`${index + 1}. ${job.title}`);
    console.log(`   Company: ${job.organization}`);
    console.log(`   Location: ${JSON.stringify(job.cities_derived || 'N/A')}`);
    console.log(`   Type: ${job.employment_type?.join(', ') || 'N/A'}`);
    console.log(`   Experience: ${job.ai_experience_level || 'N/A'}`);
    console.log(`   Remote: ${job.remote_derived ? 'Yes' : 'No'}`);
    console.log(`   Skills: ${job.ai_key_skills?.slice(0, 3).join(', ') || 'N/A'}`);
    console.log(`   Source: ${job.source} (${job.source_domain})`);
    console.log(`   External ID: ${job.id}`);
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
      actor: 'career-site-job-listing-api',
      job_count: jobCount,
      cost: cost,
      notes: 'Manual initial population (24 hours)',
      run_status: 'success',
    });
  
  if (error) {
    console.error('⚠️  Warning: Could not log usage to database:', error.message);
  } else {
    console.log('✅ Usage logged to database');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Netherlands Job Board - Initial Population Script');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Validate environment
    validateEnvironment();
    
    // Step 2: Fetch jobs from Apify
    const jobs = await fetchJobsFromApify();
    
    if (jobs.length === 0) {
      console.log('⚠️  No jobs found for the last 24 hours in Netherlands.');
      console.log('   This might be normal if there were no new postings.');
      console.log('   Try expanding the timeframe or check Apify dashboard.');
      return;
    }
    
    // Step 3: Display sample data
    displaySampleJobs(jobs);
    
    // Step 4: Insert into database
    await insertJobsToDatabase(jobs);
    
    // Step 5: Log usage
    const cost = jobs.length * 0.012; // $0.012 per job for API
    await logApifyUsage(jobs.length, cost);
    
    // Step 6: Verify data in database
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
    
    // Step 7: Display cost
    console.log('💰 Cost Summary:');
    console.log(`   Jobs fetched: ${jobs.length}`);
    console.log(`   Cost: $${cost.toFixed(2)}`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Population complete! Visit your app to see the jobs.');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during population:');
    console.error('   ', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();

