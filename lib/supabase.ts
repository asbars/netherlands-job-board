import { createClient } from '@supabase/supabase-js';
import { Job } from '@/types/job';
import { FilterCondition } from '@/types/filters';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Apply filters to a Supabase query
 */
function applyFiltersToQuery(
  query: any,
  filters: FilterCondition[]
): any {
  for (const filter of filters) {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'contains':
        query = query.ilike(field, `%${value}%`);
        break;

      case 'not_contains':
        query = query.not(field, 'ilike', `%${value}%`);
        break;

      case 'equals':
        query = query.eq(field, value);
        break;

      case 'not_equals':
        query = query.neq(field, value);
        break;

      case 'is_any_of':
        if (Array.isArray(value) && value.length > 0) {
          query = query.in(field, value);
        }
        break;

      case 'is_not_any_of':
        if (Array.isArray(value) && value.length > 0) {
          query = query.not(field, 'in', `(${value.map((v: string) => `"${v}"`).join(',')})`);
        }
        break;

      case 'greater_than':
        query = query.gt(field, value);
        break;

      case 'less_than':
        query = query.lt(field, value);
        break;

      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          query = query.gte(field, value[0]).lte(field, value[1]);
        }
        break;

      case 'is_empty':
        query = query.is(field, null);
        break;

      case 'is_not_empty':
        query = query.not(field, 'is', null);
        break;
    }
  }

  return query;
}

/**
 * Fetch total count of active jobs in database (with optional filters)
 */
export async function fetchJobsCount(filters: FilterCondition[] = []): Promise<number> {
  let query = supabase
    .from('jobmarket_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  query = applyFiltersToQuery(query, filters);

  const { count, error } = await query;

  if (error) {
    console.error('Error fetching job count:', error);
    throw error;
  }

  return count || 0;
}

/**
 * Fetch paginated jobs from database (with optional filters)
 */
export async function fetchJobsPaginated(
  page: number = 1,
  pageSize: number = 20,
  filters: FilterCondition[] = []
): Promise<{ jobs: Job[]; totalCount: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('jobmarket_jobs')
    .select('*', { count: 'exact' })
    .eq('status', 'active');

  query = applyFiltersToQuery(query, filters);

  const { data, error, count } = await query
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
