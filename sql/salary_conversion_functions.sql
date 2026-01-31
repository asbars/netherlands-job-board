-- ========================================
-- Salary Conversion Functions
-- Normalize salary values to a common unit for filtering
-- ========================================

-- Function to convert salary value to a target unit
CREATE OR REPLACE FUNCTION public.convert_salary_to_unit(
  p_value numeric,
  p_from_unit text,
  p_to_unit text,
  p_working_hours numeric DEFAULT 40
)
RETURNS numeric AS $$
DECLARE
  v_hours_per_week numeric := COALESCE(p_working_hours, 40);
  v_weeks_per_year numeric := 52;
  v_weeks_per_month numeric := 4.33; -- 52/12
  v_hours_per_day numeric := 8;
  v_days_per_week numeric := 5;
  v_normalized_value numeric;
  v_from_unit_upper text := UPPER(COALESCE(p_from_unit, ''));
  v_to_unit_upper text := UPPER(COALESCE(p_to_unit, ''));
BEGIN
  -- Handle NULL values
  IF p_value IS NULL OR p_from_unit IS NULL OR p_to_unit IS NULL THEN
    RETURN NULL;
  END IF;

  -- Normalize unit names (remove 'per ', handle variations)
  v_from_unit_upper := CASE
    WHEN v_from_unit_upper IN ('YEAR', 'PER YEAR', 'ANNUAL', 'YEARLY', 'ANNUALLY') THEN 'YEAR'
    WHEN v_from_unit_upper IN ('MONTH', 'PER MONTH', 'MONTHLY') THEN 'MONTH'
    WHEN v_from_unit_upper IN ('HOUR', 'PER HOUR', 'HOURLY') THEN 'HOUR'
    WHEN v_from_unit_upper IN ('DAY', 'PER DAY', 'DAILY') THEN 'DAY'
    WHEN v_from_unit_upper IN ('WEEK', 'PER WEEK', 'WEEKLY') THEN 'WEEK'
    ELSE v_from_unit_upper
  END;

  v_to_unit_upper := CASE
    WHEN v_to_unit_upper IN ('YEAR', 'PER YEAR', 'ANNUAL', 'YEARLY', 'ANNUALLY') THEN 'YEAR'
    WHEN v_to_unit_upper IN ('MONTH', 'PER MONTH', 'MONTHLY') THEN 'MONTH'
    WHEN v_to_unit_upper IN ('HOUR', 'PER HOUR', 'HOURLY') THEN 'HOUR'
    WHEN v_to_unit_upper IN ('DAY', 'PER DAY', 'DAILY') THEN 'DAY'
    WHEN v_to_unit_upper IN ('WEEK', 'PER WEEK', 'WEEKLY') THEN 'WEEK'
    ELSE v_to_unit_upper
  END;

  -- If units are the same, no conversion needed
  IF v_from_unit_upper = v_to_unit_upper THEN
    RETURN p_value;
  END IF;

  -- First, convert to hourly rate (common denominator)
  v_normalized_value := CASE v_from_unit_upper
    WHEN 'HOUR' THEN p_value
    WHEN 'DAY' THEN p_value / v_hours_per_day
    WHEN 'WEEK' THEN p_value / v_hours_per_week
    WHEN 'MONTH' THEN p_value / (v_weeks_per_month * v_hours_per_week)
    WHEN 'YEAR' THEN p_value / (v_weeks_per_year * v_hours_per_week)
    ELSE NULL -- Unknown unit, return NULL
  END;

  -- If conversion to hourly failed, return NULL
  IF v_normalized_value IS NULL THEN
    RETURN NULL;
  END IF;

  -- Then convert from hourly to target unit
  RETURN CASE v_to_unit_upper
    WHEN 'HOUR' THEN v_normalized_value
    WHEN 'DAY' THEN v_normalized_value * v_hours_per_day
    WHEN 'WEEK' THEN v_normalized_value * v_hours_per_week
    WHEN 'MONTH' THEN v_normalized_value * v_hours_per_week * v_weeks_per_month
    WHEN 'YEAR' THEN v_normalized_value * v_hours_per_week * v_weeks_per_year
    ELSE NULL -- Unknown unit, return NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant access
GRANT EXECUTE ON FUNCTION public.convert_salary_to_unit(numeric, text, text, numeric) TO anon, authenticated;

-- ========================================
-- Test conversions
-- ========================================

-- Test: 50000 per year to per month (should be ~4167)
SELECT public.convert_salary_to_unit(50000, 'per year', 'per month', 40) as year_to_month;

-- Test: 4000 per month to per year (should be 48000)
SELECT public.convert_salary_to_unit(4000, 'per month', 'per year', 40) as month_to_year;

-- Test: 25 per hour to per year (should be 52000 for 40 hours/week)
SELECT public.convert_salary_to_unit(25, 'per hour', 'per year', 40) as hour_to_year;

-- Test: 50000 per year to per hour (should be ~24.04 for 40 hours/week)
SELECT public.convert_salary_to_unit(50000, 'per year', 'per hour', 40) as year_to_hour;

-- Test: 200 per day to per month (should be ~4330)
SELECT public.convert_salary_to_unit(200, 'per day', 'per month', 40) as day_to_month;
