# Database Schema Type Analysis

**Date:** 2026-02-02
**Apify API Version:** Career Site Job Listing API v2

## Summary

Comparison of Apify output field types vs. our database schema types.

### ✅ All Fields Match Correctly (50/52)

All fields have correct type mappings between Apify and our database, with 2 minor exceptions noted below.

### ⚠️ Minor Type Mismatches (2/52)

These fields have minor type differences that **do not affect functionality**:

| Field | Apify Type | Our Type | Impact | Recommendation |
|-------|-----------|----------|--------|----------------|
| `ai_work_arrangement_office_days` | BIGINT | INTEGER | None - values are 0-7 | Optional: Change to BIGINT for strict correctness |
| `ai_working_hours` | BIGINT | INTEGER | None - values are 0-80 | Optional: Change to BIGINT for strict correctness |

**Why no impact:**
- PostgreSQL INTEGER supports values up to 2,147,483,647
- Office days range: 0-7
- Working hours range: 0-80 (typical max)
- No overflow risk

**Why not changed:**
- Database views depend on these columns
- Would require dropping and recreating views
- Zero functional benefit
- INTEGER is more memory efficient for small values

## Complete Field Mapping

### Core Fields

| Apify Field | Type | DB Column | Type | Status |
|-------------|------|-----------|------|--------|
| id | text | external_id | TEXT | ✅ |
| title | text | title | TEXT | ✅ |
| organization | text | organization | TEXT | ✅ |
| organization_url | text | organization_url | TEXT | ✅ |
| organization_logo | text | organization_logo | TEXT | ✅ |
| url | text | url | TEXT | ✅ |
| date_posted | timestamp | date_posted | TIMESTAMPTZ | ✅ |
| date_created | timestamp | date_created | TIMESTAMPTZ | ✅ |
| date_validthrough | timestamp | date_validthrough | TIMESTAMPTZ | ✅ |
| description_text | text | description_text | TEXT | ✅ |
| description_html | text | description_html | TEXT | ✅ |

### Location Fields

| Apify Field | Type | DB Column | Type | Status |
|-------------|------|-----------|------|--------|
| locations_raw | json[] | locations_raw | JSONB | ✅ |
| locations_alt_raw | text[] | locations_alt_raw | TEXT[] | ✅ |
| locations_derived | text[] | locations_derived | TEXT[] | ✅ |
| location_type | text | location_type | TEXT | ✅ |
| location_requirements_raw | json[] | location_requirements_raw | JSONB | ✅ |
| cities_derived | json[] | cities_derived | JSONB | ✅ |
| regions_derived | json[] | regions_derived | JSONB | ✅ |
| countries_derived | json[] | countries_derived | JSONB | ✅ |
| timezones_derived | json[] | timezones_derived | JSONB | ✅ |
| lats_derived | json[] | lats_derived | JSONB | ✅ |
| lngs_derived | json[] | lngs_derived | JSONB | ✅ |
| remote_derived | bool | remote_derived | BOOLEAN | ✅ |

### Employment & Source Fields

| Apify Field | Type | DB Column | Type | Status |
|-------------|------|-----------|------|--------|
| employment_type | text[] | employment_type | TEXT[] | ✅ |
| salary_raw | json | salary_raw | JSONB | ✅ |
| source | text | source | TEXT | ✅ |
| source_type | text | source_type | TEXT | ✅ |
| source_domain | text | source_domain | TEXT | ✅ |
| domain_derived | text | domain_derived | TEXT | ✅ |

### AI Salary Fields

| Apify Field | Type | DB Column | Type | Status |
|-------------|------|-----------|------|--------|
| ai_salary_currency | text | ai_salary_currency | TEXT | ✅ |
| ai_salary_value | numeric | ai_salary_value | NUMERIC(12,2) | ✅ |
| ai_salary_minvalue | numeric | ai_salary_minvalue | NUMERIC(12,2) | ✅ |
| ai_salary_maxvalue | numeric | ai_salary_maxvalue | NUMERIC(12,2) | ✅ |
| ai_salary_unittext | text | ai_salary_unittext | TEXT | ✅ |
| ai_benefits | text[] | ai_benefits | TEXT[] | ✅ |

### AI Classification Fields

| Apify Field | Type | DB Column | Type | Status |
|-------------|------|-----------|------|--------|
| ai_experience_level | text | ai_experience_level | TEXT | ✅ |
| ai_work_arrangement | text | ai_work_arrangement | TEXT | ✅ |
| ai_work_arrangement_office_days | bigint | ai_work_arrangement_office_days | INTEGER | ⚠️ Minor |
| ai_remote_location | text[] | ai_remote_location | TEXT[] | ✅ |
| ai_remote_location_derived | text[] | ai_remote_location_derived | TEXT[] | ✅ |

### AI Skills & Requirements

| Apify Field | Type | DB Column | Type | Status |
|-------------|------|-----------|------|--------|
| ai_key_skills | text[] | ai_key_skills | TEXT[] | ✅ |
| ai_education_requirements | text[] | ai_education_requirements | TEXT[] | ✅ |
| ai_keywords | text[] | ai_keywords | TEXT[] | ✅ |
| ai_taxonomies_a | text[] | ai_taxonomies_a | TEXT[] | ✅ |

### AI Job Details

| Apify Field | Type | DB Column | Type | Status |
|-------------|------|-----------|------|--------|
| ai_core_responsibilities | text | ai_core_responsibilities | TEXT | ✅ |
| ai_requirements_summary | text | ai_requirements_summary | TEXT | ✅ |
| ai_working_hours | bigint | ai_working_hours | INTEGER | ⚠️ Minor |
| ai_employment_type | text[] | ai_employment_type | TEXT[] | ✅ |
| ai_job_language | text | ai_job_language | TEXT | ✅ |
| ai_visa_sponsorship | boolean | ai_visa_sponsorship | BOOLEAN | ✅ |

### AI Hiring Manager

| Apify Field | Type | DB Column | Type | Status |
|-------------|------|-----------|------|--------|
| ai_hiring_manager_name | text | ai_hiring_manager_name | TEXT | ✅ |
| ai_hiring_manager_email_address | text | ai_hiring_manager_email_address | TEXT | ✅ |

## Type Mapping Reference

### PostgreSQL Type Equivalents

| Apify Type | PostgreSQL Type | Notes |
|------------|----------------|-------|
| text | TEXT | Direct mapping |
| timestamp | TIMESTAMPTZ | With timezone support |
| json | JSONB | Binary JSON, more efficient |
| json[] | JSONB | Arrays of JSON stored as JSONB |
| text[] | TEXT[] | Native array type |
| numeric | NUMERIC(12,2) | Precision for currency |
| bigint | BIGINT | 64-bit integer |
| bool/boolean | BOOLEAN | Direct mapping |

## Conclusion

**Schema Health: 96% Perfect Match (50/52 exact, 2 minor)**

The database schema correctly handles all Apify data types. The two INTEGER vs BIGINT differences are cosmetic and pose zero risk to data integrity or functionality.

**Action Required:** None. Schema is production-ready.

**Optional Enhancement:** If pursuing strict type correctness, update INTEGER → BIGINT for the two fields noted above. This requires dropping and recreating dependent views.
