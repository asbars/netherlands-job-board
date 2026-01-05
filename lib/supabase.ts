import { createClient } from '@supabase/supabase-js';
import { Job } from '@/types/job';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchJobs(): Promise<Job[]> {
  console.log('Fetching jobs from Supabase...');
  
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .order('first_seen_date', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }

  console.log('Fetched jobs count:', data?.length || 0);
  return data || [];
}

export async function fetchJobById(id: number): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
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
  const { error } = await supabase.rpc('increment_view_count', { job_id: id });
  
  if (error) {
    console.error('Error incrementing view count:', error);
  }
}

