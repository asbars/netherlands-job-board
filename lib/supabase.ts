import { createClient } from '@supabase/supabase-js';
import { Job } from '@/types/job';
import { FilterCondition } from '@/types/filters';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fields that are stored as arrays in the database
const ARRAY_FIELDS = [
  'cities_derived',
  'regions_derived',
  'employment_type',
  'ai_benefits',
  'ai_key_skills',
  'ai_keywords',
  'ai_taxonomies_a',
  'ai_job_language',
];

/**
 * Check if any filter requires the RPC function (any array field filter)
 */
function requiresRpcSearch(filters: FilterCondition[]): boolean {
  return filters.some((f) => ARRAY_FIELDS.includes(f.field));
}

/**
 * Apply filters to a Supabase query
 */
function applyFiltersToQuery(
  query: any,
  filters: FilterCondition[]
): any {
  for (const filter of filters) {
    const { field, operator, value } = filter;
    const isArrayField = ARRAY_FIELDS.includes(field);

    switch (operator) {
      case 'contains':
        if (isArrayField) {
          // For array fields, cast to text and use ilike for partial matching
          // This allows "Amster" to match "Amsterdam"
          query = query.filter(`${field}::text`, 'ilike', `%${value}%`);
        } else {
          query = query.ilike(field, `%${value}%`);
        }
        break;

      case 'not_contains':
        if (isArrayField) {
          // For array fields, cast to text and use not ilike
          query = query.not(`${field}::text`, 'ilike', `%${value}%`);
        } else {
          query = query.not(field, 'ilike', `%${value}%`);
        }
        break;

      case 'equals':
        query = query.eq(field, value);
        break;

      case 'not_equals':
        query = query.neq(field, value);
        break;

      case 'is_any_of':
        if (Array.isArray(value) && value.length > 0) {
          if (isArrayField) {
            // For array fields, check if array overlaps with any of the values
            query = query.overlaps(field, value);
          } else {
            query = query.in(field, value);
          }
        }
        break;

      case 'is_not_any_of':
        if (Array.isArray(value) && value.length > 0) {
          if (isArrayField) {
            // For array fields, check that array doesn't overlap with any values
            query = query.not(field, 'ov', `{${value.join(',')}}`);
          } else {
            query = query.not(field, 'in', `(${value.map((v: string) => `"${v}"`).join(',')})`);
          }
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
  // Use RPC function if we have any array field filters
  if (requiresRpcSearch(filters)) {
    const filtersJson = filters.map((f) => ({
      field: f.field,
      operator: f.operator,
      value: f.value,
      is_array_value: Array.isArray(f.value),
    }));

    const { data, error } = await supabase.rpc('search_jobs_with_filters', {
      p_filters: filtersJson,
      p_page: 1,
      p_page_size: 1,
    });

    if (error) {
      console.error('Error fetching job count via RPC:', error);
      throw error;
    }

    return Number(data?.[0]?.total_count) || 0;
  }

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
  // Use RPC function if we have any array field filters
  if (requiresRpcSearch(filters)) {
    const filtersJson = filters.map((f) => ({
      field: f.field,
      operator: f.operator,
      value: f.value,
      is_array_value: Array.isArray(f.value),
    }));

    const { data, error } = await supabase.rpc('search_jobs_with_filters', {
      p_filters: filtersJson,
      p_page: page,
      p_page_size: pageSize,
    });

    if (error) {
      console.error('Error fetching jobs via RPC:', error);
      throw error;
    }

    const result = data?.[0];
    return {
      jobs: result?.jobs || [],
      totalCount: Number(result?.total_count) || 0,
    };
  }

  // Use regular query for non-array text filters
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
