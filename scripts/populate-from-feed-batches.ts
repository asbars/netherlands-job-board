/**
 * Populate from Feed in Batches Script
 * 
 * For free Apify accounts with 200 job limit per run.
 * Runs multiple Feed calls with different city filters to get more jobs.
 * 
 * Usage:
 *   npm run populate:feed:batches
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
const COST_PER_1000_JOBS = 2; // $2 per 1000 jobs for Feed

// Major Dutch cities to use as location filters
const DUTCH_CITIES = [
  'Amsterdam',
  'Rotterdam', 
  'The Hague',
  'Utrecht',
  'Eindhoven',
  'Groningen',
  'Tilburg',
  'Almere',
  'Breda',
  'Nijmegen',
];

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
 * Fetch jobs for a specific city
 */
async function fetchJobsForCity(city: string): Promise<any[]> {
  console.log(`\n🔍 Fetching jobs for: ${city}`);
  console.log(`   Max items: 200 (free tier limit)`);
  
  try {
    const run = await apifyClient.actor(CAREER_SITE_FEED_ACTOR_ID).call({
      locationSearch: [city, 'Netherlands'], // Filter by city + country
      maxItems: 200, // Free tier limit
      include_ai: true,
      include_li: true,
    });
    
    console.log(`   Run ID: ${run.id}`);
    console.log(`   Status: ${run.status}`);
    
    if (run.status !== 'SUCCEEDED') {
      throw new Error(`Actor run failed with status: ${run.status}`);
    }
    
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    console.log(`   ✅ Retrieved ${items.length} jobs for ${city}`);
    
    return items;
  } catch (error: any) {
    console.error(`   ❌ Error fetching jobs for ${city}:`, error.message);
    return [];
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
    date_posted: apifyJob.date_posted,
    date_created: apifyJob.date_created,
    date_validthrough: apifyJob.date_validthrough,
    date_modified: apifyJob.date_modified,
    description_text: apifyJob.description_text,
    description_html: apifyJob.description_html,
    locations_raw: apifyJob.locations_raw,
    locations_alt_raw: apifyJob.locations_alt_raw,
    locations_derived: apifyJob.locations_derived,
    location_type: apifyJob.location_type,
    location_requirements_raw: apifyJob.location_requirements_raw,
    cities_derived: apifyJob.cities_derived,
    regions_derived: apifyJob.regions_derived,
    countries_derived: apifyJob.countries_derived,
    timezones_derived: apifyJob.timezones_derived,
    lats_derived: apifyJob.lats_derived,
    lngs_derived: apifyJob.lngs_derived,
    remote_derived: apifyJob.remote_derived || false,
    employment_type: apifyJob.employment_type,
    salary_raw: apifyJob.salary_raw,
    source: apifyJob.source,
    source_type: apifyJob.source_type,
    source_domain: apifyJob.source_domain,
    domain_derived: apifyJob.domain_derived,
    modified_fields: apifyJob.modified_fields,
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
    data_source: 'feed',
    status: 'active',
    first_seen_date: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Insert jobs into Supabase database
 */
async function insertJobsToDatabase(jobs: any[]): Promise<number> {
  if (jobs.length === 0) return 0;
  
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const transformedBatch = batch.map(transformJobForDatabase);
    
    const { data, error } = await supabase
      .from('jobmarket_jobs')
      .upsert(transformedBatch, { 
        onConflict: 'external_id',
        ignoreDuplicates: false 
      })
      .select();
    
    if (!error) {
      inserted += (data?.length || 0);
    }
  }
  
  return inserted;
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Netherlands Job Board - Batch Feed Population');
  console.log('  For Free Apify Accounts (200 job limit per run)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    validateEnvironment();
    
    console.log('📋 Will fetch jobs from 10 major Dutch cities:');
    console.log('   ' + DUTCH_CITIES.join(', '));
    console.log('\n⚠️  Each city fetch costs ~$0.40 (200 jobs × $2/1000)');
    console.log('   Total estimated cost: ~$4.00\n');
    
    const allJobs: any[] = [];
    let totalCost = 0;
    
    // Fetch jobs for each city
    for (let i = 0; i < DUTCH_CITIES.length; i++) {
      const city = DUTCH_CITIES[i];
      console.log(`\n[${i + 1}/${DUTCH_CITIES.length}] Processing ${city}...`);
      
      const jobs = await fetchJobsForCity(city);
      
      if (jobs.length > 0) {
        // Deduplicate based on external_id before adding
        const existingIds = new Set(allJobs.map(j => j.id));
        const newJobs = jobs.filter(j => !existingIds.has(j.id));
        
        allJobs.push(...newJobs);
        totalCost += (jobs.length / 1000) * COST_PER_1000_JOBS;
        
        console.log(`   ℹ️  New unique jobs: ${newJobs.length} (${jobs.length - newJobs.length} duplicates filtered)`);
        console.log(`   📊 Total unique jobs so far: ${allJobs.length}`);
      }
      
      // Add a delay between requests to be nice to Apify
      if (i < DUTCH_CITIES.length - 1) {
        console.log('   ⏳ Waiting 3 seconds before next city...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📊 Fetching Complete');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Total unique jobs fetched: ${allJobs.length}`);
    console.log(`   Total cost: $${totalCost.toFixed(2)}`);
    console.log('');
    
    if (allJobs.length === 0) {
      console.log('⚠️  No jobs found. Exiting.');
      return;
    }
    
    // Insert into database
    console.log('💾 Inserting jobs into database...\n');
    const inserted = await insertJobsToDatabase(allJobs);
    console.log(`✅ Successfully processed ${inserted} jobs\n`);
    
    // Log usage
    const { error } = await supabase
      .from('jobmarket_apify_usage_logs')
      .insert({
        actor: 'career-site-job-listing-feed',
        job_count: allJobs.length,
        cost: totalCost,
        notes: `Batch population from ${DUTCH_CITIES.length} cities (free tier workaround)`,
        run_status: 'success',
      });
    
    if (!error) {
      console.log('✅ Usage logged to database\n');
    }
    
    // Verify
    const { count } = await supabase
      .from('jobmarket_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    console.log(`🔍 Total active jobs in database: ${count}\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Batch population complete!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during population:', error.message);
    process.exit(1);
  }
}

main();

