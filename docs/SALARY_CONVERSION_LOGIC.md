# Salary Conversion Logic

## Overview

The salary filtering system allows users to filter jobs by salary in their preferred unit (per hour, per month, or per year), while the database stores salaries in various units. The system automatically converts all salaries to the user's chosen unit for accurate comparison.

## Conversion Constants

- **Hours per week**: 40 (default) or use `ai_working_hours` from job if available
- **Weeks per year**: 52
- **Weeks per month**: 4.33 (52 weeks / 12 months)
- **Work days per week**: 5
- **Hours per day**: 8

## Conversion Matrix

### From Per Year
- **To Per Month**: `yearly / 12`
- **To Per Hour**: `yearly / (52 × hours_per_week)`

### From Per Month
- **To Per Year**: `monthly × 12`
- **To Per Hour**: `monthly / (4.33 × hours_per_week)`

### From Per Hour
- **To Per Month**: `hourly × hours_per_week × 4.33`
- **To Per Year**: `hourly × hours_per_week × 52`

### From Per Day
- **To Per Hour**: `daily / 8`
- **To Per Month**: `daily × 5 × 4.33`
- **To Per Year**: `daily × 5 × 52`

### From Per Week
- **To Per Hour**: `weekly / hours_per_week`
- **To Per Month**: `weekly × 4.33`
- **To Per Year**: `weekly × 52`

## Example Calculations

### Example 1: User filters "Minimum Salary > 50,000 per year"
- **Job A**: Has monthly salary of 4,000
  - Convert: 4,000 × 12 = 48,000 per year
  - Result: **EXCLUDE** (48,000 < 50,000)

- **Job B**: Has hourly salary of 30 (40 hours/week)
  - Convert: 30 × 40 × 52 = 62,400 per year
  - Result: **INCLUDE** (62,400 > 50,000)

- **Job C**: Has daily salary of 250
  - Convert: 250 × 5 × 52 = 65,000 per year
  - Result: **INCLUDE** (65,000 > 50,000)

### Example 2: User filters "Minimum Salary > 3,000 per month"
- **Job A**: Has yearly salary of 40,000
  - Convert: 40,000 / 12 = 3,333 per month
  - Result: **INCLUDE** (3,333 > 3,000)

- **Job B**: Has hourly salary of 18 (40 hours/week)
  - Convert: 18 × 40 × 4.33 = 3,117 per month
  - Result: **INCLUDE** (3,117 > 3,000)

- **Job C**: Has monthly salary of 2,800
  - Result: **EXCLUDE** (2,800 < 3,000)

### Example 3: User filters "Minimum Salary > 25 per hour"
- **Job A**: Has yearly salary of 60,000 (40 hours/week)
  - Convert: 60,000 / (52 × 40) = 28.85 per hour
  - Result: **INCLUDE** (28.85 > 25)

- **Job B**: Has monthly salary of 4,000 (40 hours/week)
  - Convert: 4,000 / (4.33 × 40) = 23.10 per hour
  - Result: **EXCLUDE** (23.10 < 25)

- **Job C**: Has daily salary of 200
  - Convert: 200 / 8 = 25 per hour
  - Result: **INCLUDE** (25 >= 25)

## Implementation

### Database Layer (PostgreSQL)

1. **`convert_salary_to_unit()` function**: Handles all unit conversions
   - Located in: `sql/salary_conversion_functions.sql`
   - Takes: value, from_unit, to_unit, working_hours (optional)
   - Returns: converted numeric value

2. **Updated `search_jobs_with_filters()` RPC**: Integrates conversion
   - Located in: `sql/array_text_search_v10_with_salary.sql`
   - Detects salary fields and applies conversion before comparison
   - Uses job's `ai_working_hours` if available, defaults to 40

### Application Layer (TypeScript/React)

1. **Updated Types** (`types/filters.ts`):
   - Added `SalaryUnit` type
   - Added `salary_unit` field to `FilterCondition`
   - Added `isSalaryField` flag to `FilterField`

2. **Updated Filter Config** (`lib/filterConfig.ts`):
   - Marked salary fields with `isSalaryField: true`
   - Added to descriptions that unit selection is required

3. **Updated Add Filter Modal** (`components/AddFilterModal.tsx`):
   - Added salary unit selector step (Step 2.5)
   - Shows unit dropdown before value input for salary fields
   - Validates that unit is selected for salary filters
   - Includes salary_unit in filter condition

4. **Updated Supabase Client** (`lib/supabase.ts`):
   - Passes `salary_unit` to RPC function
   - Added salary fields to `SPECIAL_HANDLING_FIELDS`
   - Ensures salary filters use RPC function

## User Flow

1. User clicks "Add Filter"
2. User selects a salary field (e.g., "Minimum Salary")
3. User selects an operator (e.g., "is greater than")
4. **User selects a salary unit** (Per Hour / Per Month / Per Year)
5. User enters the value (e.g., 50000)
6. System converts all database salaries to chosen unit
7. System applies comparison and returns filtered results

## Edge Cases Handled

- **NULL salary unit in database**: Conversion function returns NULL
- **Unknown salary units**: Normalizes common variations (e.g., "annual" → "year")
- **Jobs with ai_working_hours**: Uses job-specific hours instead of default 40
- **Empty/Not empty operators**: Skip conversion, check for NULL directly
- **Mixed units in database**: All converted to common unit for accurate comparison

## Testing SQL Queries

Run these queries in Supabase to verify conversions:

```sql
-- Test: 50000 per year to per month (should be ~4167)
SELECT public.convert_salary_to_unit(50000, 'per year', 'per month', 40);

-- Test: 4000 per month to per year (should be 48000)
SELECT public.convert_salary_to_unit(4000, 'per month', 'per year', 40);

-- Test: 25 per hour to per year (should be 52000 for 40 hours/week)
SELECT public.convert_salary_to_unit(25, 'per hour', 'per year', 40);

-- Test: 200 per day to per month (should be ~4330)
SELECT public.convert_salary_to_unit(200, 'per day', 'per month', 40);
```

## Deployment Steps

1. Run `sql/salary_conversion_functions.sql` in Supabase SQL Editor
2. Run `sql/array_text_search_v10_with_salary.sql` in Supabase SQL Editor
3. Deploy frontend code with updated filter logic
4. Test salary filtering with different units

## Performance Considerations

- Conversion is done in SQL, not in application code (more efficient)
- Uses `IMMUTABLE` functions for potential query optimization
- Indexed salary fields benefit from converted comparisons
- No impact on non-salary filters
