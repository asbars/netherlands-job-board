# Apify Schema Mapping Guide

This document explains how Apify's output fields map to our database schema.

## Overview

The database schema has been designed to capture **all 90+ fields** from Apify's Career Site Job Listing API/Feed, including:
- Core job data (title, organization, description)
- Rich location data with geocoding
- AI-enhanced fields (salary parsing, skills extraction, work arrangements)
- LinkedIn company enrichment data

## Field Mapping

### Core Job Fields

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `id` | `external_id` | TEXT | Apify's unique job ID (used for expiration tracking) |
| `title` | `title` | TEXT | Job title |
| `organization` | `organization` | TEXT | Company name |
| `organization_url` | `organization_url` | TEXT | Company website |
| `organization_logo` | `organization_logo` | TEXT | Logo URL |
| `url` | `url` | TEXT | Job application URL |

### Dates

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `date_posted` | `date_posted` | TIMESTAMPTZ | When job was posted by employer |
| `date_created` | `date_created` | TIMESTAMPTZ | When indexed in Apify's system |
| `date_validthrough` | `date_validthrough` | TIMESTAMPTZ | Expiration date (if provided) |
| `date_modified` | `date_modified` | TIMESTAMPTZ | Last modification detected |

### Descriptions

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `description_text` | `description_text` | TEXT | Plain text version |
| `description_html` | `description_html` | TEXT | HTML formatted version |

### Location Data (Rich Structure)

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `locations_raw` | `locations_raw` | JSONB | Raw location per Google Jobs spec |
| `locations_alt_raw` | `locations_alt_raw` | TEXT[] | Alternative location data (Workday) |
| `locations_derived` | `locations_derived` | TEXT[] | Parsed: [{city, admin, country}] |
| `location_type` | `location_type` | TEXT | 'TELECOMMUTE' for remote jobs |
| `location_requirements_raw` | `location_requirements_raw` | JSONB | Remote job requirements |
| `cities_derived` | `cities_derived` | JSONB | All cities extracted |
| `regions_derived` | `regions_derived` | JSONB | All states/provinces |
| `countries_derived` | `countries_derived` | JSONB | All countries |
| `timezones_derived` | `timezones_derived` | JSONB | Derived timezones |
| `lats_derived` | `lats_derived` | JSONB | Latitude coordinates |
| `lngs_derived` | `lngs_derived` | JSONB | Longitude coordinates |
| `remote_derived` | `remote_derived` | BOOLEAN | AI-detected remote flag |

### Employment & Salary

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `employment_type` | `employment_type` | TEXT[] | ['Full-time', 'Contract', etc.] |
| `salary_raw` | `salary_raw` | JSONB | Raw salary per Google Jobs spec |

### Source Information

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `source` | `source` | TEXT | ATS name (workday, greenhouse, etc.) |
| `source_type` | `source_type` | TEXT | 'ats' or 'career-site' |
| `source_domain` | `source_domain` | TEXT | Domain of career site |
| `domain_derived` | `domain_derived` | TEXT | AI-discovered employer domain (~98% accuracy) |
| `modified_fields` | `modified_fields` | TEXT[] | Fields that changed during updates |

## AI-Enhanced Fields (Beta)

Enable with `include_ai: true` in Apify run config.

### AI Salary Parsing

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `ai_salary_currency` | `ai_salary_currency` | TEXT | EUR, USD, etc. |
| `ai_salary_value` | `ai_salary_value` | NUMERIC | Single salary value |
| `ai_salary_minvalue` | `ai_salary_minvalue` | NUMERIC | Minimum in range |
| `ai_salary_maxvalue` | `ai_salary_maxvalue` | NUMERIC | Maximum in range |
| `ai_salary_unittext` | `ai_salary_unittext` | TEXT | HOUR/DAY/WEEK/MONTH/YEAR |
| `ai_benefits` | `ai_benefits` | TEXT[] | Non-salary benefits |

### AI Job Classification

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `ai_experience_level` | `ai_experience_level` | TEXT | 0-2, 2-5, 5-10, 10+ |
| `ai_work_arrangement` | `ai_work_arrangement` | TEXT | Remote Solely/Remote OK/Hybrid/On-site |
| `ai_work_arrangement_office_days` | `ai_work_arrangement_office_days` | INTEGER | Days/week in office for hybrid |
| `ai_remote_location` | `ai_remote_location` | TEXT[] | Remote location restrictions |
| `ai_remote_location_derived` | `ai_remote_location_derived` | TEXT[] | Parsed remote locations |

### AI Skills & Requirements

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `ai_key_skills` | `ai_key_skills` | TEXT[] | Key skills mentioned |
| `ai_education_requirements` | `ai_education_requirements` | TEXT[] | Education requirements |
| `ai_keywords` | `ai_keywords` | TEXT[] | Extracted keywords |
| `ai_taxonomies_a` | `ai_taxonomies_a` | TEXT[] | AI-assigned taxonomies |

### AI Job Details

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `ai_core_responsibilities` | `ai_core_responsibilities` | TEXT | 2-sentence summary |
| `ai_requirements_summary` | `ai_requirements_summary` | TEXT | 2-sentence summary |
| `ai_working_hours` | `ai_working_hours` | INTEGER | Hours/week (default 40) |
| `ai_employment_type` | `ai_employment_type` | TEXT[] | FULL_TIME, PART_TIME, etc. |
| `ai_job_language` | `ai_job_language` | TEXT | Language of description |
| `ai_visa_sponsorship` | `ai_visa_sponsorship` | BOOLEAN | Visa sponsorship mentioned |

### AI Hiring Manager

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `ai_hiring_manager_name` | `ai_hiring_manager_name` | TEXT | If available |
| `ai_hiring_manager_email_address` | `ai_hiring_manager_email_address` | TEXT | If available |

## LinkedIn Company Data (Beta)

Enable with `include_li: true` in Apify run config.

| Apify Field | DB Column | Type | Notes |
|------------|-----------|------|-------|
| `linkedin_org_employees` | `linkedin_org_employees` | INTEGER | Employee count from LI |
| `linkedin_org_url` | `linkedin_org_url` | TEXT | Company page URL |
| `linkedin_org_size` | `linkedin_org_size` | TEXT | Company-reported size |
| `linkedin_org_slogan` | `linkedin_org_slogan` | TEXT | Company slogan |
| `linkedin_org_industry` | `linkedin_org_industry` | TEXT | Industry category |
| `linkedin_org_followers` | `linkedin_org_followers` | INTEGER | LI followers count |
| `linkedin_org_headquarters` | `linkedin_org_headquarters` | TEXT | HQ location |
| `linkedin_org_type` | `linkedin_org_type` | TEXT | privately held, public, etc. |
| `linkedin_org_foundeddate` | `linkedin_org_foundeddate` | TEXT | Founded date |
| `linkedin_org_specialties` | `linkedin_org_specialties` | TEXT[] | Company specialties |
| `linkedin_org_locations` | `linkedin_org_locations` | TEXT[] | All office locations |
| `linkedin_org_description` | `linkedin_org_description` | TEXT | Company description |
| `linkedin_org_recruitment_agency_derived` | `linkedin_org_recruitment_agency_derived` | BOOLEAN | Is recruitment agency (LLM-detected) |
| `linkedin_org_slug` | `linkedin_org_slug` | TEXT | LI slug (e.g., 'tesla-motors') |

## Internal Tracking Fields

These are our own fields, not from Apify:

| DB Column | Type | Purpose |
|-----------|------|---------|
| `id` | BIGSERIAL | Our internal auto-increment ID |
| `data_source` | TEXT | 'feed' or 'api' (how we got this job) |
| `first_seen_date` | TIMESTAMPTZ | When we first saw this job |
| `last_updated` | TIMESTAMPTZ | Last time we updated this record |
| `status` | TEXT | 'active' or 'expired' |
| `expired_date` | TIMESTAMPTZ | When marked expired |
| `view_count` | INTEGER | User engagement metric |
| `bookmark_count` | INTEGER | User engagement metric |
| `application_count` | INTEGER | User engagement metric |
| `created_at` | TIMESTAMPTZ | Record creation time |

## Example Queries

### Find Remote Jobs in Amsterdam with Python skills
```sql
SELECT 
  title, 
  organization, 
  ai_work_arrangement,
  ai_key_skills
FROM jobs
WHERE status = 'active'
  AND remote_derived = true
  AND 'Amsterdam' = ANY(SELECT jsonb_array_elements_text(cities_derived))
  AND ai_key_skills && ARRAY['Python']
ORDER BY date_posted DESC;
```

### Find Jobs with Visa Sponsorship
```sql
SELECT title, organization, ai_visa_sponsorship
FROM jobs
WHERE status = 'active'
  AND ai_visa_sponsorship = true
ORDER BY date_posted DESC;
```

### Jobs by Salary Range
```sql
SELECT 
  title,
  organization,
  ai_salary_minvalue,
  ai_salary_maxvalue,
  ai_salary_currency
FROM jobs
WHERE status = 'active'
  AND ai_salary_minvalue >= 50000
  AND ai_salary_currency = 'EUR'
ORDER BY ai_salary_minvalue DESC;
```

### Find Companies Hiring Multiple Roles
```sql
SELECT 
  organization,
  linkedin_org_size,
  linkedin_org_industry,
  COUNT(*) as open_positions
FROM jobs
WHERE status = 'active'
GROUP BY organization, linkedin_org_size, linkedin_org_industry
HAVING COUNT(*) > 5
ORDER BY open_positions DESC;
```

## Best Practices

### 1. Always Enable AI & LinkedIn Data
```typescript
const jobs = await fetchNewJobsFromAPI({
  timeframe: '24hours',
  country: 'Netherlands',
  include_ai: true,   // ✅ Enable for rich data
  include_li: true,   // ✅ Enable for company context
});
```

### 2. Use Derived Fields for Filtering
- Use `cities_derived`, `regions_derived`, `countries_derived` for location searches
- Use `remote_derived` as primary remote indicator (combines multiple signals)
- Use `ai_key_skills` for skill-based filtering

### 3. Fallback Logic
```typescript
// Use AI fields with fallbacks
const workType = job.ai_work_arrangement 
  || (job.remote_derived ? 'Remote' : 'On-site');

const experience = job.ai_experience_level 
  || 'Not specified';
```

### 4. Index Strategy
Key indexes are already created for:
- Location search (GIN indexes on JSON arrays)
- Skills search (GIN indexes on arrays)
- Date-based queries
- Full-text search on title and description

## Cost Implications

- **Base job data**: No extra cost
- **AI fields** (`include_ai: true`): No extra cost per Apify documentation
- **LinkedIn data** (`include_li: true`): No extra cost per Apify documentation

The cost is purely based on number of jobs returned:
- API: $0.012 per job
- Feed: $0.002 per job
- Expired: $20/month flat rate

## Migration Notes

If you have existing data with the old schema:

```sql
-- Add new columns (run in Supabase SQL Editor)
-- The full updated schema in DATABASE_SCHEMA.sql handles this
-- Or drop and recreate the table if no important data yet

DROP TABLE IF EXISTS jobs CASCADE;
-- Then run the full DATABASE_SCHEMA.sql
```

## Support

For questions about:
- **Apify fields**: Check [Apify documentation](https://apify.com/fantastic-jobs/career-site-job-listing-api)
- **Database schema**: See `DATABASE_SCHEMA.sql`
- **Type definitions**: See `types/job.ts`
- **API integration**: See `lib/apify.ts`

