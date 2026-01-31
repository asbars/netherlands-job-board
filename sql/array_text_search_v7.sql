-- ========================================
-- V7: Handle N/A for Employment Type
-- ========================================

-- Drop existing functions if they exist (to start fresh)
DROP FUNCTION IF EXISTS public.array_contains_text(text[], text);
DROP FUNCTION IF EXISTS public.array_contains_text_jsonb(jsonb, text);
DROP FUNCTION IF EXISTS public.search_jobs_with_filters(jsonb, integer, integer);

-- Function to check if any element in a TEXT[] array contains the search text
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

-- Function to check if any element in a JSONB array contains the search text
CREATE OR REPLACE FUNCTION public.array_contains_text_jsonb(arr jsonb, search_text text)
RETURNS boolean AS $$
BEGIN
  IF arr IS NULL OR jsonb_typeof(arr) != 'array' THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(arr) AS element
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
  v_array_fields text[] := ARRAY['cities_derived', 'regions_derived', 'employment_type', 'ai_benefits', 'ai_key_skills', 'ai_keywords', 'ai_taxonomies_a', 'ai_job_language', 'ai_employment_type'];
  v_array_literal text;
  v_includes_hybrid_or_onsite boolean;
  v_includes_na boolean;
  v_non_na_values text[];
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
          -- Use JSONB version of array_contains_text
          v_where_clauses := array_append(v_where_clauses,
            format('public.array_contains_text_jsonb(%I, %L)', v_field, v_value_text));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I ILIKE %L', v_field, '%' || v_value_text || '%'));
        END IF;

      WHEN 'not_contains' THEN
        IF v_is_array_field THEN
          v_where_clauses := array_append(v_where_clauses,
            format('NOT public.array_contains_text_jsonb(%I, %L)', v_field, v_value_text));
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
          -- Special handling for ai_work_arrangement field
          IF v_field = 'ai_work_arrangement' THEN
            -- Check if Hybrid or On-site is in the filter values
            v_includes_hybrid_or_onsite := EXISTS (
              SELECT 1 FROM unnest(v_value_array) AS val
              WHERE val IN ('Hybrid', 'On-site')
            );

            -- Build the filter condition
            v_array_literal := (
              SELECT string_agg(quote_literal(elem), ',')
              FROM unnest(v_value_array) AS elem
            );

            -- If filtering for Hybrid or On-site, also include NULL values
            IF v_includes_hybrid_or_onsite THEN
              v_where_clauses := array_append(v_where_clauses,
                format('(%I IN (%s) OR %I IS NULL)', v_field, v_array_literal, v_field));
            ELSE
              v_where_clauses := array_append(v_where_clauses,
                format('%I IN (%s)', v_field, v_array_literal));
            END IF;

          -- Special handling for ai_employment_type field
          ELSIF v_field = 'ai_employment_type' THEN
            -- Check if N/A is in the filter values
            v_includes_na := 'N/A' = ANY(v_value_array);

            -- Get non-N/A values
            SELECT array_agg(elem) INTO v_non_na_values
            FROM unnest(v_value_array) AS elem
            WHERE elem != 'N/A';

            -- Build condition based on whether N/A is included
            IF v_includes_na AND v_non_na_values IS NOT NULL AND array_length(v_non_na_values, 1) > 0 THEN
              -- Both N/A and real values: match NULL/empty OR any of the real values
              v_array_literal := 'ARRAY[' || (
                SELECT string_agg(quote_literal(elem), ',')
                FROM unnest(v_non_na_values) AS elem
              ) || ']';
              v_where_clauses := array_append(v_where_clauses,
                format('(%I IS NULL OR jsonb_array_length(%I) = 0 OR %I ?| %s)', v_field, v_field, v_field, v_array_literal));
            ELSIF v_includes_na THEN
              -- Only N/A selected: match NULL or empty array
              v_where_clauses := array_append(v_where_clauses,
                format('(%I IS NULL OR jsonb_array_length(%I) = 0)', v_field, v_field));
            ELSE
              -- No N/A: standard array matching
              v_array_literal := 'ARRAY[' || (
                SELECT string_agg(quote_literal(elem), ',')
                FROM unnest(v_value_array) AS elem
              ) || ']';
              v_where_clauses := array_append(v_where_clauses,
                format('%I ?| %s', v_field, v_array_literal));
            END IF;

          ELSIF v_is_array_field THEN
            -- For JSONB array fields, use ?| operator with proper text array literal
            v_array_literal := 'ARRAY[' || (
              SELECT string_agg(quote_literal(elem), ',')
              FROM unnest(v_value_array) AS elem
            ) || ']';
            v_where_clauses := array_append(v_where_clauses,
              format('%I ?| %s', v_field, v_array_literal));
          ELSE
            -- For scalar fields, use IN clause
            v_array_literal := (
              SELECT string_agg(quote_literal(elem), ',')
              FROM unnest(v_value_array) AS elem
            );
            v_where_clauses := array_append(v_where_clauses,
              format('%I IN (%s)', v_field, v_array_literal));
          END IF;
        END IF;

      WHEN 'is_not_any_of' THEN
        IF v_value_array IS NOT NULL AND array_length(v_value_array, 1) > 0 THEN
          IF v_is_array_field THEN
            -- For JSONB array fields, negate ?| operator
            v_array_literal := 'ARRAY[' || (
              SELECT string_agg(quote_literal(elem), ',')
              FROM unnest(v_value_array) AS elem
            ) || ']';
            v_where_clauses := array_append(v_where_clauses,
              format('NOT (%I ?| %s)', v_field, v_array_literal));
          ELSE
            -- For scalar fields, use NOT IN clause
            v_array_literal := (
              SELECT string_agg(quote_literal(elem), ',')
              FROM unnest(v_value_array) AS elem
            );
            v_where_clauses := array_append(v_where_clauses,
              format('%I NOT IN (%s)', v_field, v_array_literal));
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
            format('(%I IS NULL OR jsonb_array_length(%I) = 0)', v_field, v_field));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I IS NULL', v_field));
        END IF;

      WHEN 'is_not_empty' THEN
        IF v_is_array_field THEN
          v_where_clauses := array_append(v_where_clauses,
            format('(%I IS NOT NULL AND jsonb_array_length(%I) > 0)', v_field, v_field));
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
GRANT EXECUTE ON FUNCTION public.array_contains_text_jsonb(jsonb, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_jobs_with_filters(jsonb, integer, integer) TO anon, authenticated;

-- ========================================
-- VERIFICATION: Check the functions were created
-- ========================================
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('array_contains_text', 'array_contains_text_jsonb', 'search_jobs_with_filters')
  AND n.nspname = 'public'
ORDER BY p.proname;

-- ========================================
-- TEST: Test with N/A filter
-- ========================================
-- This should return jobs with NULL or empty ai_employment_type
SELECT * FROM public.search_jobs_with_filters(
  '[{"field":"ai_employment_type","operator":"is_any_of","value":["N/A"],"is_array_value":true}]'::jsonb,
  1,
  10
);

-- Test with N/A and Full-time
SELECT * FROM public.search_jobs_with_filters(
  '[{"field":"ai_employment_type","operator":"is_any_of","value":["N/A","FULL_TIME"],"is_array_value":true}]'::jsonb,
  1,
  10
);
