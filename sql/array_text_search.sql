-- Function to check if any element in an array contains the search text (case-insensitive)
CREATE OR REPLACE FUNCTION array_contains_text(arr text[], search_text text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM unnest(arr) AS element
    WHERE element ILIKE '%' || search_text || '%'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RPC function to search jobs with array text filter support
-- This is needed because PostgREST doesn't support custom function calls in filters
CREATE OR REPLACE FUNCTION search_jobs_with_filters(
  p_filters jsonb DEFAULT '[]'::jsonb,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
)
RETURNS TABLE (
  jobs jsonb,
  total_count bigint
) AS $$
DECLARE
  v_offset integer;
  v_filter jsonb;
  v_field text;
  v_operator text;
  v_value text;
  v_query text;
  v_count_query text;
  v_where_clauses text[] := ARRAY['status = ''active'''];
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Build WHERE clauses from filters
  FOR v_filter IN SELECT * FROM jsonb_array_elements(p_filters)
  LOOP
    v_field := v_filter->>'field';
    v_operator := v_filter->>'operator';
    v_value := v_filter->>'value';

    -- Handle different operators
    CASE v_operator
      WHEN 'contains' THEN
        -- Check if field is an array type
        IF v_field IN ('cities_derived', 'regions_derived', 'employment_type', 'ai_benefits',
                       'ai_key_skills', 'ai_keywords', 'ai_taxonomies_a', 'ai_job_language') THEN
          v_where_clauses := array_append(v_where_clauses,
            format('array_contains_text(%I, %L)', v_field, v_value));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I ILIKE %L', v_field, '%' || v_value || '%'));
        END IF;

      WHEN 'not_contains' THEN
        IF v_field IN ('cities_derived', 'regions_derived', 'employment_type', 'ai_benefits',
                       'ai_key_skills', 'ai_keywords', 'ai_taxonomies_a', 'ai_job_language') THEN
          v_where_clauses := array_append(v_where_clauses,
            format('NOT array_contains_text(%I, %L)', v_field, v_value));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I NOT ILIKE %L', v_field, '%' || v_value || '%'));
        END IF;

      WHEN 'equals' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I = %L', v_field, v_value));

      WHEN 'not_equals' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I != %L', v_field, v_value));

      WHEN 'is_any_of' THEN
        IF v_field IN ('cities_derived', 'regions_derived', 'employment_type', 'ai_benefits',
                       'ai_key_skills', 'ai_keywords', 'ai_taxonomies_a', 'ai_job_language') THEN
          v_where_clauses := array_append(v_where_clauses,
            format('%I && %L::text[]', v_field, v_value));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I = ANY(%L::text[])', v_field, v_value));
        END IF;

      WHEN 'is_not_any_of' THEN
        IF v_field IN ('cities_derived', 'regions_derived', 'employment_type', 'ai_benefits',
                       'ai_key_skills', 'ai_keywords', 'ai_taxonomies_a', 'ai_job_language') THEN
          v_where_clauses := array_append(v_where_clauses,
            format('NOT (%I && %L::text[])', v_field, v_value));
        ELSE
          v_where_clauses := array_append(v_where_clauses,
            format('%I != ALL(%L::text[])', v_field, v_value));
        END IF;

      WHEN 'greater_than' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I > %L', v_field, v_value));

      WHEN 'less_than' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I < %L', v_field, v_value));

      WHEN 'is_empty' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I IS NULL', v_field));

      WHEN 'is_not_empty' THEN
        v_where_clauses := array_append(v_where_clauses,
          format('%I IS NOT NULL', v_field));

      ELSE
        -- Unknown operator, skip
        NULL;
    END CASE;
  END LOOP;

  -- Build and execute query
  v_query := format(
    'SELECT jsonb_agg(row_to_json(j.*)) FROM (
      SELECT * FROM jobmarket_jobs
      WHERE %s
      ORDER BY first_seen_date DESC
      LIMIT %s OFFSET %s
    ) j',
    array_to_string(v_where_clauses, ' AND '),
    p_page_size,
    v_offset
  );

  v_count_query := format(
    'SELECT COUNT(*) FROM jobmarket_jobs WHERE %s',
    array_to_string(v_where_clauses, ' AND ')
  );

  -- Return results
  RETURN QUERY EXECUTE format(
    'SELECT (%s) as jobs, (%s) as total_count',
    v_query,
    v_count_query
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION array_contains_text(text[], text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_jobs_with_filters(jsonb, integer, integer) TO anon, authenticated;
