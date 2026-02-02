-- ========================================
-- V16: Fix ai_job_language - it's TEXT not TEXT[]
-- ========================================
-- BUG FIX: ai_job_language is stored as TEXT (singular), not TEXT[] (array)
--          but was incorrectly listed in v_text_array_fields, causing
--          "function public.array_contains_text_array(text, unknown) does not exist" error

-- Drop existing functions
DROP FUNCTION IF EXISTS public.search_jobs_with_filters(jsonb, integer, integer, jsonb);
DROP FUNCTION IF EXISTS public.array_contains_text_array(text[], text);

-- Helper function for JSONB array text search (already exists, but including for completeness)
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

-- Helper function for TEXT[] array text search
CREATE OR REPLACE FUNCTION public.array_contains_text_array(arr text[], search_text text)
RETURNS boolean AS $$
BEGIN
  IF arr IS NULL OR array_length(arr, 1) IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM unnest(arr) AS element
    WHERE element ILIKE '%' || search_text || '%'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RPC function to search jobs with full salary conversion (period + currency)
CREATE OR REPLACE FUNCTION public.search_jobs_with_filters(
  p_filters jsonb DEFAULT '[]'::jsonb,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_exchange_rates jsonb DEFAULT '{}'::jsonb
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
  v_is_jsonb_array boolean;
  v_is_text_array boolean;
  v_jsonb_array_fields text[] := ARRAY['cities_derived', 'regions_derived'];
  v_text_array_fields text[] := ARRAY['employment_type', 'ai_employment_type', 'ai_benefits', 'ai_key_skills', 'ai_keywords', 'ai_taxonomies_a', 'ai_education_requirements'];
  v_array_literal text;
  v_includes_hybrid_or_onsite boolean;
  v_includes_other boolean;
  v_non_other_values text[];
  v_salary_period text;
  v_salary_currency text;
  v_is_salary_field boolean;
  v_salary_fields text[] := ARRAY['ai_salary_minvalue', 'ai_salary_maxvalue'];
  v_converted_salary_expression text;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  FOR v_filter IN SELECT * FROM jsonb_array_elements(p_filters) LOOP
    v_field := v_filter->>'field';
    v_operator := v_filter->>'operator';
    v_value := v_filter->'value';
    v_is_array_value := COALESCE((v_filter->>'is_array_value')::boolean, false);
    v_is_jsonb_array := v_field = ANY(v_jsonb_array_fields);
    v_is_text_array := v_field = ANY(v_text_array_fields);
    v_is_array_field := v_is_jsonb_array OR v_is_text_array;
    v_is_salary_field := v_field = ANY(v_salary_fields);
    v_salary_period := v_filter->>'salary_period';
    v_salary_currency := v_filter->>'salary_currency';

    -- Convert value to appropriate type
    IF v_is_array_value AND jsonb_typeof(v_value) = 'array' THEN
      SELECT array_agg(elem::text) INTO v_value_array
      FROM jsonb_array_elements_text(v_value) AS elem;
      v_value_text := NULL;
    ELSE
      v_value_text := v_value #>> '{}';
      v_value_array := NULL;
    END IF;

    -- Special handling for salary fields with full conversion (period + currency)
    IF v_is_salary_field AND v_salary_period IS NOT NULL AND v_salary_currency IS NOT NULL THEN
      -- Build expression using the combined conversion function
      -- Pass exchange rates as JSONB parameter
      v_converted_salary_expression := format(
        'public.convert_salary_full(%I, ai_salary_unittext, %L, ai_salary_currency, %L, %L::jsonb, COALESCE(ai_working_hours, 40))',
        v_field,
        v_salary_period,
        v_salary_currency,
        p_exchange_rates
      );

      CASE v_operator
        WHEN 'greater_than' THEN
          v_where_clauses := array_append(v_where_clauses,
            format('%s > %L', v_converted_salary_expression, v_value_text::numeric));

        WHEN 'less_than' THEN
          v_where_clauses := array_append(v_where_clauses,
            format('%s < %L', v_converted_salary_expression, v_value_text::numeric));

        WHEN 'equals' THEN
          v_where_clauses := array_append(v_where_clauses,
            format('%s = %L', v_converted_salary_expression, v_value_text::numeric));

        WHEN 'between' THEN
          IF v_is_array_value AND array_length(v_value_array, 1) = 2 THEN
            v_where_clauses := array_append(v_where_clauses,
              format('%s BETWEEN %L AND %L',
                v_converted_salary_expression,
                v_value_array[1]::numeric,
                v_value_array[2]::numeric));
          END IF;

        WHEN 'is_empty' THEN
          v_where_clauses := array_append(v_where_clauses,
            format('%I IS NULL', v_field));

        WHEN 'is_not_empty' THEN
          v_where_clauses := array_append(v_where_clauses,
            format('%I IS NOT NULL', v_field));

        ELSE
          NULL;
      END CASE;

    -- Regular (non-salary) field handling
    ELSE
      CASE v_operator
        WHEN 'contains' THEN
          IF v_is_jsonb_array THEN
            -- JSONB arrays use array_contains_text_jsonb()
            v_where_clauses := array_append(v_where_clauses,
              format('public.array_contains_text_jsonb(%I, %L)', v_field, v_value_text));
          ELSIF v_is_text_array THEN
            -- TEXT[] arrays use array_contains_text_array()
            v_where_clauses := array_append(v_where_clauses,
              format('public.array_contains_text_array(%I, %L)', v_field, v_value_text));
          ELSE
            -- Regular text fields
            v_where_clauses := array_append(v_where_clauses,
              format('%I ILIKE %L', v_field, '%' || v_value_text || '%'));
          END IF;

        WHEN 'not_contains' THEN
          IF v_is_jsonb_array THEN
            -- JSONB arrays use array_contains_text_jsonb()
            v_where_clauses := array_append(v_where_clauses,
              format('NOT public.array_contains_text_jsonb(%I, %L)', v_field, v_value_text));
          ELSIF v_is_text_array THEN
            -- TEXT[] arrays use array_contains_text_array()
            v_where_clauses := array_append(v_where_clauses,
              format('NOT public.array_contains_text_array(%I, %L)', v_field, v_value_text));
          ELSE
            -- Regular text fields
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
            IF v_field = 'ai_work_arrangement' THEN
              v_includes_hybrid_or_onsite := EXISTS (
                SELECT 1 FROM unnest(v_value_array) AS val
                WHERE val IN ('Hybrid', 'On-site')
              );
              v_array_literal := (
                SELECT string_agg(quote_literal(elem), ',')
                FROM unnest(v_value_array) AS elem
              );
              IF v_includes_hybrid_or_onsite THEN
                v_where_clauses := array_append(v_where_clauses,
                  format('(%I IN (%s) OR %I IS NULL)', v_field, v_array_literal, v_field));
              ELSE
                v_where_clauses := array_append(v_where_clauses,
                  format('%I IN (%s)', v_field, v_array_literal));
              END IF;

            ELSIF v_field = 'ai_employment_type' THEN
              v_includes_other := 'Other' = ANY(v_value_array);
              SELECT array_agg(elem) INTO v_non_other_values
              FROM unnest(v_value_array) AS elem
              WHERE elem != 'Other';
              IF v_includes_other AND v_non_other_values IS NOT NULL AND array_length(v_non_other_values, 1) > 0 THEN
                v_array_literal := 'ARRAY[' || (
                  SELECT string_agg(quote_literal(elem), ',')
                  FROM unnest(v_non_other_values) AS elem
                ) || ',''OTHER'']::text[]';
                v_where_clauses := array_append(v_where_clauses,
                  format('(%I IS NULL OR array_length(%I, 1) IS NULL OR %I && %s)', v_field, v_field, v_field, v_array_literal));
              ELSIF v_includes_other THEN
                v_where_clauses := array_append(v_where_clauses,
                  format('(%I IS NULL OR array_length(%I, 1) IS NULL OR %I && ARRAY[''OTHER'']::text[])', v_field, v_field, v_field));
              ELSE
                v_array_literal := 'ARRAY[' || (
                  SELECT string_agg(quote_literal(elem), ',')
                  FROM unnest(v_value_array) AS elem
                ) || ']::text[]';
                v_where_clauses := array_append(v_where_clauses,
                  format('%I && %s', v_field, v_array_literal));
              END IF;

            ELSIF v_is_jsonb_array THEN
              -- JSONB arrays use ?| operator
              v_array_literal := 'ARRAY[' || (
                SELECT string_agg(quote_literal(elem), ',')
                FROM unnest(v_value_array) AS elem
              ) || ']';
              v_where_clauses := array_append(v_where_clauses,
                format('%I ?| %s', v_field, v_array_literal));

            ELSIF v_is_text_array THEN
              -- TEXT[] arrays use && operator
              v_array_literal := 'ARRAY[' || (
                SELECT string_agg(quote_literal(elem), ',')
                FROM unnest(v_value_array) AS elem
              ) || ']::text[]';
              v_where_clauses := array_append(v_where_clauses,
                format('%I && %s', v_field, v_array_literal));

            ELSE
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
            IF v_is_jsonb_array THEN
              -- JSONB arrays use ?| operator
              v_array_literal := 'ARRAY[' || (
                SELECT string_agg(quote_literal(elem), ',')
                FROM unnest(v_value_array) AS elem
              ) || ']';
              v_where_clauses := array_append(v_where_clauses,
                format('NOT (%I ?| %s)', v_field, v_array_literal));

            ELSIF v_is_text_array THEN
              -- TEXT[] arrays use && operator
              v_array_literal := 'ARRAY[' || (
                SELECT string_agg(quote_literal(elem), ',')
                FROM unnest(v_value_array) AS elem
              ) || ']::text[]';
              v_where_clauses := array_append(v_where_clauses,
                format('NOT (%I && %s)', v_field, v_array_literal));

            ELSE
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

        WHEN 'between' THEN
          IF v_is_array_value AND array_length(v_value_array, 1) = 2 THEN
            v_where_clauses := array_append(v_where_clauses,
              format('%I BETWEEN %L AND %L', v_field, v_value_array[1], v_value_array[2]));
          END IF;

        WHEN 'is_empty' THEN
          IF v_is_jsonb_array THEN
            -- JSONB arrays use jsonb_array_length()
            v_where_clauses := array_append(v_where_clauses,
              format('(%I IS NULL OR jsonb_array_length(%I) = 0)', v_field, v_field));
          ELSIF v_is_text_array THEN
            -- TEXT[] arrays use array_length()
            v_where_clauses := array_append(v_where_clauses,
              format('(%I IS NULL OR array_length(%I, 1) IS NULL)', v_field, v_field));
          ELSE
            v_where_clauses := array_append(v_where_clauses,
              format('%I IS NULL', v_field));
          END IF;

        WHEN 'is_not_empty' THEN
          IF v_is_jsonb_array THEN
            -- JSONB arrays use jsonb_array_length()
            v_where_clauses := array_append(v_where_clauses,
              format('(%I IS NOT NULL AND jsonb_array_length(%I) > 0)', v_field, v_field));
          ELSIF v_is_text_array THEN
            -- TEXT[] arrays use array_length()
            v_where_clauses := array_append(v_where_clauses,
              format('(%I IS NOT NULL AND array_length(%I, 1) IS NOT NULL AND array_length(%I, 1) > 0)', v_field, v_field, v_field));
          ELSE
            v_where_clauses := array_append(v_where_clauses,
              format('%I IS NOT NULL', v_field));
          END IF;

        ELSE
          NULL;
      END CASE;
    END IF;
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
GRANT EXECUTE ON FUNCTION public.search_jobs_with_filters(jsonb, integer, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.array_contains_text_jsonb(jsonb, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.array_contains_text_array(text[], text) TO anon, authenticated;
