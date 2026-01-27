/**
 * Feed Population Cron Endpoint
 *
 * This endpoint can be triggered externally (e.g., via cron-job.org) to:
 * 1. Fetch all active jobs from Apify Feed (5000 latest)
 * 2. Insert/update jobs in the database
 * 3. Log usage metrics
 *
 * Cost: ~$10 for 5000 jobs ($2 per 1000 jobs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllJobsFromFeed } from '@/lib/apify';

// Configuration
const MAX_JOBS = 350; // Reduced for testing, increase to 5000 for production
const COST_PER_1000_JOBS = 2;

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// Transform Apify job to database format
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

export async function GET(request: NextRequest) {
  console.log('🚀 Feed population cron job started');

  // Verify authorization
  if (!verifyCronSecret(request)) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Fetch jobs from Apify Feed (5000 latest, Netherlands only)
    console.log(`📥 Fetching ${MAX_JOBS} jobs from Apify Feed...`);
    const jobs = await fetchAllJobsFromFeed({
      locationSearch: ['Netherlands'],
      include_ai: true,
      include_li: true,
      limit: MAX_JOBS,
    });

    console.log(`✅ Retrieved ${jobs.length} jobs from Apify Feed`);

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs found',
        jobsProcessed: 0,
        cost: 0,
      });
    }

    // Initialize Supabase with service role key for backend operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Transform jobs
    const transformedJobs = jobs.map(transformJobForDatabase);

    // Insert in batches of 100
    console.log('💾 Inserting jobs into database...');
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < transformedJobs.length; i += batchSize) {
      const batch = transformedJobs.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('jobmarket_jobs')
        .upsert(batch, {
          onConflict: 'external_id',
          ignoreDuplicates: false,
        })
        .select('id');

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error);
      } else {
        totalInserted += data?.length || 0;
      }
    }

    console.log(`✅ Inserted/updated ${totalInserted} jobs`);

    // Log usage
    const cost = (jobs.length / 1000) * COST_PER_1000_JOBS;
    await supabase.from('jobmarket_apify_usage_logs').insert({
      actor: 'career-site-job-listing-feed',
      job_count: jobs.length,
      cost: cost,
      notes: 'Initial feed population via cron endpoint',
      run_status: 'success',
    });

    console.log(`💰 Cost: $${cost.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      message: 'Feed population completed successfully',
      jobsProcessed: totalInserted,
      jobsFetched: jobs.length,
      cost: cost,
    });

  } catch (error: any) {
    console.error('❌ Feed population error:', error);

    // Try to log the failure
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from('jobmarket_apify_usage_logs').insert({
        actor: 'career-site-job-listing-feed',
        job_count: 0,
        cost: 0,
        notes: `Feed population failed: ${error.message}`,
        run_status: 'failed',
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Feed population failed',
      },
      { status: 500 }
    );
  }
}
