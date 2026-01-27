import { createClient } from '@supabase/supabase-js';
import { Job } from '@/types/job';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PaginatedResult {
  jobs: Job[];
  totalCount: number;
}

export interface FetchJobsOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Fetch paginated jobs from Supabase
 */
export async function fetchJobs(options: FetchJobsOptions = {}): Promise<PaginatedResult> {
  const { page = 1, pageSize = 20 } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  console.log(`Fetching jobs from Supabase (page: ${page}, pageSize: ${pageSize}, range: ${from}-${to})...`);

  // Fetch paginated data with count
  const { data, error, count } = await supabase
    .from('jobmarket_jobs')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('first_seen_date', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }

  console.log(`Fetched ${data?.length || 0} jobs (total: ${count})`);
  return {
    jobs: data || [],
    totalCount: count || 0,
  };
}

/**
 * Fetch total count of active jobs (for filters sidebar)
 */
export async function fetchJobsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('jobmarket_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching job count:', error);
    throw error;
  }

  return count || 0;
}

/**
 * Fetch a sample of jobs for generating filter options
 * Returns up to 1000 jobs to extract unique values for dropdowns
 */
export async function fetchJobsSample(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobmarket_jobs')
    .select('cities_derived, regions_derived, employment_type, ai_experience_level, ai_work_arrangement, source, linkedin_org_industry, domain_derived, ai_salary_currency, ai_salary_unittext, ai_job_language, ai_key_skills, ai_keywords, ai_taxonomies_a, ai_benefits, ai_employment_type')
    .eq('status', 'active')
    .range(0, 999);

  if (error) {
    console.error('Error fetching jobs sample:', error);
    throw error;
  }

  return (data || []) as Job[];
}

export async function fetchJobById(id: number): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobmarket_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    throw error;
  }

  return data;
}

export async function incrementJobViewCount(id: number): Promise<void> {
  const { error } = await supabase.rpc('jobmarket_increment_view_count', { job_id: id });
  
  if (error) {
    console.error('Error incrementing view count:', error);
  }
}

