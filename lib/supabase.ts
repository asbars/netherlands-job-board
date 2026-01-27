import { createClient } from '@supabase/supabase-js';
import { Job } from '@/types/job';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch total count of active jobs in database
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
 * Fetch paginated jobs from database
 */
export async function fetchJobsPaginated(page: number = 1, pageSize: number = 20): Promise<{ jobs: Job[]; totalCount: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('jobmarket_jobs')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('first_seen_date', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching paginated jobs:', error);
    throw error;
  }

  return {
    jobs: data || [],
    totalCount: count || 0,
  };
}

/**
 * Fetch a sample of jobs for generating filter options
 */
export async function fetchJobsSample(limit: number = 1000): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobmarket_jobs')
    .select('*')
    .eq('status', 'active')
    .order('first_seen_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching job sample:', error);
    throw error;
  }

  return data || [];
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
