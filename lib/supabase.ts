import { createClient } from '@supabase/supabase-js';
import { Job } from '@/types/job';
import { FilterCondition } from '@/types/filters';
import { getExchangeRates } from './currencyConverter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase; // Fallback to anon client if service key not available

// Fields that are stored as arrays in the database (verified 2026-02-02)
const ARRAY_FIELDS = [
  'cities_derived',
  'regions_derived',
  'employment_type',
  'ai_employment_type',
  'ai_benefits',
  'ai_key_skills',
  'ai_keywords',
  'ai_taxonomies_a',
  'ai_education_requirements',
];

// Fields that require RPC function due to special handling (e.g., NULL = Hybrid/On-site, salary conversion)
const SPECIAL_HANDLING_FIELDS = [
  'ai_work_arrangement', // NULL values treated as Hybrid/On-site
  'ai_salary_minvalue', // Salary conversion
  'ai_salary_maxvalue', // Salary conversion
];

/**
 * Check if any filter requires the RPC function (array fields or special handling)
 */
function requiresRpcSearch(filters: FilterCondition[]): boolean {
  return filters.some((f) =>
    ARRAY_FIELDS.includes(f.field) || SPECIAL_HANDLING_FIELDS.includes(f.field)
  );
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
 * Get exchange rates for salary filtering with 1-hour caching
 * Returns rates to convert FROM source currencies TO target currency
 */
async function getExchangeRatesForFilters(filters: FilterCondition[]): Promise<Record<string, number>> {
  // Find salary filters with currency
  const salaryFilters = filters.filter(f =>
    ['ai_salary_minvalue', 'ai_salary_maxvalue'].includes(f.field) &&
    f.salary_currency
  );

  if (salaryFilters.length === 0) {
    return {};
  }

  // Get target currency (should be same for all salary filters)
  const targetCurrency = salaryFilters[0].salary_currency!;

  try {
    // Get unique currencies from database
    const { data: currencies, error } = await supabase
      .from('jobmarket_jobs')
      .select('ai_salary_currency')
      .eq('status', 'active')
      .not('ai_salary_currency', 'is', null);

    if (error) {
      console.error('Error fetching currencies:', error);
      return {};
    }

    const uniqueCurrencies = Array.from(
      new Set(currencies.map(c => c.ai_salary_currency).filter(Boolean))
    ) as string[];

    // For each source currency, we need the rate FROM that currency TO target currency
    const ratesObject: Record<string, number> = {};

    // Add target currency with rate 1 (no conversion needed)
    ratesObject[targetCurrency] = 1;

    // Fetch rates for other currencies (with caching)
    for (const sourceCurrency of uniqueCurrencies) {
      if (sourceCurrency === targetCurrency) {
        ratesObject[sourceCurrency] = 1;
        continue;
      }

      try {
        // First, try to get cached rate (less than 1 hour old)
        const { data: cachedRate, error: cacheError } = await supabase.rpc(
          'get_cached_exchange_rate',
          {
            p_from_currency: sourceCurrency,
            p_to_currency: targetCurrency,
          }
        );

        if (!cacheError && cachedRate !== null) {
          // Use cached rate
          console.log(`Using cached rate for ${sourceCurrency} → ${targetCurrency}: ${cachedRate}`);
          ratesObject[sourceCurrency] = cachedRate;
          continue;
        }

        // Cache miss or expired - fetch from API
        console.log(`Fetching fresh rate for ${sourceCurrency} → ${targetCurrency}`);
        const response = await fetch(
          `https://api.frankfurter.app/latest?from=${sourceCurrency}&to=${targetCurrency}`
        );

        if (response.ok) {
          const data = await response.json();
          const rate = data.rates[targetCurrency] || 1;
          ratesObject[sourceCurrency] = rate;

          // Save to cache
          await supabase.rpc('set_cached_exchange_rate', {
            p_from_currency: sourceCurrency,
            p_to_currency: targetCurrency,
            p_rate: rate,
          });
        } else {
          console.warn(`Failed to fetch rate for ${sourceCurrency} to ${targetCurrency}`);
          ratesObject[sourceCurrency] = 1; // Fallback to 1
        }
      } catch (err) {
        console.warn(`Error fetching rate for ${sourceCurrency}:`, err);
        ratesObject[sourceCurrency] = 1; // Fallback to 1
      }
    }

    return ratesObject;
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    return {};
  }
}

/**
 * Fetch total count of active jobs in database (with optional filters)
 */
export async function fetchJobsCount(filters: FilterCondition[] = []): Promise<number> {
  // Use RPC function if we have any array field or special handling filters
  if (requiresRpcSearch(filters)) {
    const filtersJson = filters.map((f) => ({
      field: f.field,
      operator: f.operator,
      value: f.value,
      is_array_value: Array.isArray(f.value),
      ...(f.salary_period && { salary_period: f.salary_period }),
      ...(f.salary_currency && { salary_currency: f.salary_currency }),
    }));

    // Get exchange rates if we have salary filters
    const exchangeRates = await getExchangeRatesForFilters(filters);

    const { data, error } = await supabase.rpc('search_jobs_with_filters', {
      p_filters: filtersJson,
      p_page: 1,
      p_page_size: 1,
      p_exchange_rates: exchangeRates,
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
  // Use RPC function if we have any array field or special handling filters
  if (requiresRpcSearch(filters)) {
    const filtersJson = filters.map((f) => ({
      field: f.field,
      operator: f.operator,
      value: f.value,
      is_array_value: Array.isArray(f.value),
      ...(f.salary_period && { salary_period: f.salary_period }),
      ...(f.salary_currency && { salary_currency: f.salary_currency }),
    }));

    console.log('RPC filters:', JSON.stringify(filtersJson, null, 2));

    // Get exchange rates if we have salary filters
    const exchangeRates = await getExchangeRatesForFilters(filters);
    console.log('Exchange rates:', exchangeRates);

    const { data, error } = await supabase.rpc('search_jobs_with_filters', {
      p_filters: filtersJson,
      p_page: page,
      p_page_size: pageSize,
      p_exchange_rates: exchangeRates,
    });

    if (error) {
      console.error('Error fetching jobs via RPC:', error);
      console.error('Filter data sent:', JSON.stringify(filtersJson));
      console.error('Full error object:', JSON.stringify(error, null, 2));
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
    .order('first_seen_date', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
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

/**
 * Count jobs with office days information and total hybrid jobs
 */
export async function countJobsWithOfficeDays(): Promise<{ withOfficeDays: number; totalHybrid: number }> {
  // Count jobs with office days information
  const { count: withDaysCount, error: daysError } = await supabase
    .from('jobmarket_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('ai_work_arrangement_office_days', 'is', null);

  if (daysError) {
    console.error('Error counting jobs with office days:', daysError);
  }

  // Count hybrid jobs (including NULL as per v6 logic)
  const { count: hybridCount, error: hybridError } = await supabase
    .from('jobmarket_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .or('ai_work_arrangement.eq.Hybrid,ai_work_arrangement.is.null');

  if (hybridError) {
    console.error('Error counting hybrid jobs:', hybridError);
  }

  return {
    withOfficeDays: withDaysCount || 0,
    totalHybrid: hybridCount || 0,
  };
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

/**
 * Count new jobs matching filter criteria since a given date
 * Used for saved filter notifications
 */
export async function countNewJobsForFilter(
  filters: FilterCondition[],
  sinceDate: string
): Promise<number> {
  // Add date filter: first_seen_date > sinceDate
  const dateFilter: FilterCondition = {
    id: 'new_jobs_date_filter',
    field: 'first_seen_date',
    fieldLabel: 'First Seen Date',
    operator: 'greater_than',
    value: sinceDate,
  };
  const filtersWithDate: FilterCondition[] = [...filters, dateFilter];

  // Use RPC function if we have any array field or special handling filters
  if (requiresRpcSearch(filters)) {
    const filtersJson = filtersWithDate.map((f) => ({
      field: f.field,
      operator: f.operator,
      value: f.value,
      is_array_value: Array.isArray(f.value),
      ...(f.salary_period && { salary_period: f.salary_period }),
      ...(f.salary_currency && { salary_currency: f.salary_currency }),
    }));

    // Get exchange rates if we have salary filters
    const exchangeRates = await getExchangeRatesForFilters(filters);

    const { data, error } = await supabase.rpc('search_jobs_with_filters', {
      p_filters: filtersJson,
      p_page: 1,
      p_page_size: 1,
      p_exchange_rates: exchangeRates,
    });

    if (error) {
      console.error('Error counting new jobs via RPC:', error);
      return 0;
    }

    return Number(data?.[0]?.total_count) || 0;
  }

  // Use regular query for non-array text filters
  let query = supabase
    .from('jobmarket_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gt('first_seen_date', sinceDate);

  query = applyFiltersToQuery(query, filters);

  const { count, error } = await query;

  if (error) {
    console.error('Error counting new jobs:', error);
    return 0;
  }

  return count || 0;
}
