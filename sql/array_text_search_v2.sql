-- ========================================
-- STEP 1: Verify and create functions in public schema
-- ========================================

-- Drop existing functions if they exist (to start fresh)
DROP FUNCTION IF EXISTS public.array_contains_text(text[], text);
DROP FUNCTION IF EXISTS public.search_jobs_with_filters(jsonb, integer, integer);

-- Function to check if any element in an array contains the search text (case-insensitive)
CREATE OR REPLACE FUNCTION public.array_contains_text(arr text[], search_text text)
RETURNS boolean AS $$
BEGIN
  IF arr IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM unnest(arr) AS element
    WHERE element ILIKE '%' || search_text || '%'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RPC function to search jobs with array text filter support
CREATE OR REPLACE FUNCTION public.search_jobs_with_filters(
  p_filters jsonb DEFAULT '[]'::jsonb,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
)
RETURNS TABLE (jobs jsonb, total_count bigint) AS $$
DECLARE
  v_offset integer;
  v_filter jsonb;
  v_field text;
  v_operator text;
  v_value jsonb;
  v_value_text text;
  v_value_array text[];
  v_is_array_value boolean;
  v_where_clauses text[] := ARRAY['status = ''active'''];
  v_is_array_field boolean;
  v_array_fields text[] := ARRAY['cities_derived', 'regions_derived', 'employment_type', 'ai_benefits', 'ai_key_skills', 'ai_keywords', 'ai_taxonomies_a', 'ai_job_language'];
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  FOR v_filter IN SELECT * FROM jsonb_array_elements(p_filters) LOOP
    v_field := v_filter->>'field';
    v_operator := v_filter->>'operator';
    v_value := v_filter->'value';
    v_is_array_value := COALESCE((v_filter->>'is_array_value')::boolean, false);
    v_is_array_field := v_field = ANY(v_array_fields);

    -- Convert value to appropriate type
    IF v_is_array_value AND jsonb_typeof(v_value) = 'array' THEN
      SELECT array_agg(elem::text) INTO v_value_array
      FROM jsonb_array_elements_text(v_value) AS elem;
      v_value_text := NULL;
    ELSE
      v_value_text := v_value #>> '{}';
      v_value_array := NULL;
    END IF;

    CASE v_operator
      WHEN 'contains' THEN
        IF v_is_array_field THEN
          v_where_clauses := array_append(v_where_clauses,
            format('public.array_contains_text(%I, %L)', v_field, v_value_text));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I ILIKE %L', v_field, '%' || v_value_text || '%'));
        END IF;

      WHEN 'not_contains' THEN
        IF v_is_array_field THEN
          v_where_clauses := array_append(v_where_clauses,
            format('NOT public.array_contains_text(%I, %L)', v_field, v_value_text));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I NOT ILIKE %L', v_field, '%' || v_value_text || '%'));
        END IF;

      WHEN 'equals' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I = %L', v_field, v_value_text));

      WHEN 'not_equals' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I != %L', v_field, v_value_text));

      WHEN 'is_any_of' THEN
        IF v_value_array IS NOT NULL AND array_length(v_value_array, 1) > 0 THEN
          IF v_is_array_field THEN
            -- For array fields, check if arrays overlap
            v_where_clauses := array_append(v_where_clauses,
              format('%I && %L::text[]', v_field, v_value_array));
          ELSE
            -- For scalar fields, check if value is in list
            v_where_clauses := array_append(v_where_clauses,
              format('%I = ANY(%L::text[])', v_field, v_value_array));
          END IF;
        END IF;

      WHEN 'is_not_any_of' THEN
        IF v_value_array IS NOT NULL AND array_length(v_value_array, 1) > 0 THEN
          IF v_is_array_field THEN
            v_where_clauses := array_append(v_where_clauses,
              format('NOT (%I && %L::text[])', v_field, v_value_array));
          ELSE
            v_where_clauses := array_append(v_where_clauses,
              format('NOT (%I = ANY(%L::text[]))', v_field, v_value_array));
          END IF;
        END IF;

      WHEN 'greater_than' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I > %L', v_field, v_value_text));

      WHEN 'less_than' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I < %L', v_field, v_value_text));

      WHEN 'is_empty' THEN
        IF v_is_array_field THEN
          v_where_clauses := array_append(v_where_clauses,
            format('(%I IS NULL OR array_length(%I, 1) IS NULL)', v_field, v_field));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I IS NULL', v_field));
        END IF;

      WHEN 'is_not_empty' THEN
        IF v_is_array_field THEN
          v_where_clauses := array_append(v_where_clauses,
            format('(%I IS NOT NULL AND array_length(%I, 1) > 0)', v_field, v_field));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I IS NOT NULL', v_field));
        END IF;

      ELSE
        -- Unknown operator, skip
        NULL;
    END CASE;
  END LOOP;

  RETURN QUERY EXECUTE format(
    'SELECT
      (SELECT COALESCE(jsonb_agg(row_to_json(j.*)), ''[]''::jsonb) FROM (
        SELECT * FROM jobmarket_jobs WHERE %s ORDER BY first_seen_date DESC LIMIT %s OFFSET %s
      ) j) as jobs,
      (SELECT COUNT(*) FROM jobmarket_jobs WHERE %s) as total_count',
    array_to_string(v_where_clauses, ' AND '),
    p_page_size,
    v_offset,
    array_to_string(v_where_clauses, ' AND ')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION public.array_contains_text(text[], text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_jobs_with_filters(jsonb, integer, integer) TO anon, authenticated;

-- ========================================
-- STEP 2: Verify the functions were created
-- Run this query after creating the functions above
-- ========================================

-- Check if functions exist
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('array_contains_text', 'search_jobs_with_filters')
  AND n.nspname = 'public'
ORDER BY p.proname;

-- ========================================
-- STEP 3: Test the function
-- Run this after verification to ensure it works
-- ========================================

-- Simple test (should return results)
SELECT * FROM public.search_jobs_with_filters(
  '[]'::jsonb,  -- no filters
  1,            -- page 1
  5             -- 5 results
);
