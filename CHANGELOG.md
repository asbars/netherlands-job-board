# Changelog

All notable changes to the Netherlands Job Board project.

## [2024-01-05] - Migration to Railway.app

### Changed - Deployment Platform

**Migrated from Vercel to Railway.app** for hosting and deployment.

#### Added

- **Railway Configuration**
  - `railway.json` - Railway-specific configuration
  - `Procfile` - Process definition for Railway
  - `RAILWAY_DEPLOYMENT.md` - Complete deployment guide for Railway
  
- **External Cron Setup**
  - `.github/workflows/daily-cron.yml` - GitHub Actions cron workflow
  - `.github/workflows/README.md` - Cron setup instructions
  - Documentation for cron-job.org integration

#### Updated

- **README.md** - Updated deployment instructions for Railway
- **QUICK_START.md** - Railway deployment steps
- **IMPLEMENTATION_GUIDE.md** - Railway-specific cron configuration
- All references to Vercel replaced with Railway

#### Why Railway?

- ✅ Excellent Next.js support
- ✅ Simpler pricing model (pay-as-you-go)
- ✅ Great developer experience
- ✅ Custom domain support with free SSL
- ✅ Easy rollbacks and environment management

#### Cron Job Strategy

Since Railway doesn't have built-in cron jobs, we support two free options:

1. **GitHub Actions** (recommended for public repos)
   - Configured in `.github/workflows/daily-cron.yml`
   - Free for public repositories
   - Runs daily at 5am UTC
   
2. **cron-job.org** (recommended for private repos)
   - Free external cron service
   - Setup instructions in `RAILWAY_DEPLOYMENT.md`

#### Cost Comparison

| Item | Vercel | Railway |
|------|---------|---------|
| Hosting | Free tier → $20/mo | $10-20/mo (usage-based) |
| Cron Jobs | Built-in | External (free) |
| Total | $0-20/mo | $10-20/mo |

**Plus Apify**: $200/month (same on both platforms)

#### Migration Guide

For existing Vercel deployments:

1. Code is fully compatible (no changes needed)
2. Push to GitHub
3. Connect Railway to your repository
4. Add environment variables (same as Vercel)
5. Set up external cron service
6. Deploy!

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

---

## [2024-01-05] - Schema Update to Match Full Apify Output

### 🎉 Major Enhancement - Complete Apify Integration

Updated the entire database schema and TypeScript types to capture **all 90+ fields** from Apify's Career Site Job Listing API.

### Added

#### Database Schema
- **Rich Location Data** (10 new fields)
  - `locations_raw`, `locations_derived` - Structured location data
  - `cities_derived`, `regions_derived`, `countries_derived` - Parsed location arrays
  - `timezones_derived`, `lats_derived`, `lngs_derived` - Geocoding data
  - `location_type` - TELECOMMUTE indicator
  - `remote_derived` - AI-detected remote flag

- **AI-Enhanced Fields** (20+ new fields from Apify Beta feature)
  - **Salary Parsing**: `ai_salary_currency`, `ai_salary_minvalue`, `ai_salary_maxvalue`, `ai_salary_unittext`
  - **Work Classification**: `ai_experience_level`, `ai_work_arrangement`, `ai_work_arrangement_office_days`
  - **Skills & Keywords**: `ai_key_skills`, `ai_keywords`, `ai_taxonomies_a`, `ai_education_requirements`
  - **Job Details**: `ai_core_responsibilities`, `ai_requirements_summary`, `ai_working_hours`
  - **Special Features**: `ai_visa_sponsorship`, `ai_job_language`, `ai_benefits`
  - **Hiring Manager**: `ai_hiring_manager_name`, `ai_hiring_manager_email_address`

- **LinkedIn Company Enrichment** (14 new fields)
  - Company metrics: `linkedin_org_employees`, `linkedin_org_followers`, `linkedin_org_size`
  - Company info: `linkedin_org_industry`, `linkedin_org_type`, `linkedin_org_slogan`
  - Company details: `linkedin_org_headquarters`, `linkedin_org_locations[]`, `linkedin_org_specialties[]`
  - AI-derived: `linkedin_org_recruitment_agency_derived`

- **Enhanced Core Fields**
  - `organization_url`, `organization_logo` - Company branding
  - `date_posted`, `date_created`, `date_validthrough`, `date_modified` - Rich date tracking
  - `description_text` - Plain text version of descriptions
  - `employment_type[]` - Array instead of single string
  - `salary_raw` - Structured salary data (JSONB)
  - `source_type`, `source_domain`, `domain_derived` - Enhanced source tracking

#### Indexes
- **GIN indexes** for array and JSONB searches
  - `countries_derived`, `cities_derived` for location filtering
  - `employment_type`, `ai_key_skills`, `ai_keywords` for skill-based search
- **Full-text search** on `description_text`
- **Date indexes** on `date_posted` and `date_created`

#### Views
- `active_jobs_with_metrics` - Jobs with calculated engagement metrics
- `jobs_expiring_soon` - Jobs with upcoming expiration dates
- `monthly_cost_summary` - Apify usage cost tracking

#### Documentation
- **APIFY_SCHEMA_MAPPING.md** - Complete field mapping guide
  - All 90+ field mappings explained
  - Example queries for common use cases
  - Best practices for using AI and LinkedIn fields
- **CHANGELOG.md** - This file

### Changed

#### Database Schema
- `job_type` → `employment_type TEXT[]` - Now supports multiple types
- `location` → `locations_derived TEXT[]` - Structured location data
- `salary_range` → `salary_raw JSONB` + AI parsed fields
- `remote_allowed` → `remote_derived` + `ai_work_arrangement`
- `experience_level` → `ai_experience_level` with standardized values
- `source` field now references ATS name (workday, greenhouse, etc.)
- Added `data_source` field to distinguish 'feed' vs 'api' origin

#### TypeScript Types
- Updated `Job` interface with all 90+ fields
- Created detailed `ApifyJobData` interface matching API output
- Added helper types: `LocationDerived`, `SalaryRaw`, `ExperienceLevel`, `WorkArrangement`
- Enhanced `FilterState` with new filter options
- Updated `UserJobAlert` with skills and salary filters

#### Apify Integration (`lib/apify.ts`)
- Added `transformApifyJobToDb()` function for clean data mapping
- Implemented proper API polling with `waitForRunCompletion()`
- Added support for `include_ai` and `include_li` parameters
- Enhanced error handling and logging
- Full field mapping from Apify output to database schema

### Migration Guide

For existing installations:

1. **Backup your data** (if you have important jobs already)
   ```sql
   -- Export existing jobs
   COPY jobs TO '/path/to/backup.csv' CSV HEADER;
   ```

2. **Drop and recreate tables**
   ```sql
   DROP TABLE IF EXISTS jobs CASCADE;
   DROP TABLE IF EXISTS user_job_alerts CASCADE;
   DROP TABLE IF EXISTS apify_usage_logs CASCADE;
   ```

3. **Run new schema**
   - Execute complete `DATABASE_SCHEMA.sql` in Supabase SQL Editor

4. **Update environment variables**
   - No changes needed, same variables as before

5. **Enable AI and LinkedIn in Apify calls**
   ```typescript
   const jobs = await fetchNewJobsFromAPI({
     timeframe: '24hours',
     country: 'Netherlands',
     include_ai: true,  // ← Add this
     include_li: true,  // ← Add this
   });
   ```

### Benefits

1. **Richer Job Data**
   - Structured salary information (min/max/currency)
   - Parsed skills and keywords for better matching
   - Work arrangement details (remote/hybrid/on-site)
   - Education requirements and visa sponsorship info

2. **Better Filtering**
   - Filter by specific cities, regions, or countries
   - Search by skills array
   - Filter by experience level (standardized)
   - Salary range filtering
   - Visa sponsorship filter

3. **Company Intelligence**
   - Company size and employee count
   - Industry classification
   - Office locations
   - LinkedIn presence and followers
   - Recruitment agency detection

4. **Enhanced Search**
   - GIN indexes enable fast array searches
   - Full-text search on plain text descriptions
   - Location-based search with geocoding
   - Skills-based matching

5. **Future-Proof**
   - Schema supports all current Apify fields
   - Ready for additional AI features as Apify adds them
   - Flexible JSONB fields for evolving data structures

### Example New Queries

```sql
-- Find remote Python jobs in Amsterdam offering visa sponsorship
SELECT title, organization, ai_salary_minvalue, ai_salary_maxvalue
FROM jobs
WHERE status = 'active'
  AND 'Amsterdam' = ANY(SELECT jsonb_array_elements_text(cities_derived))
  AND 'Python' = ANY(ai_key_skills)
  AND ai_visa_sponsorship = true
  AND remote_derived = true
ORDER BY date_posted DESC;

-- Find entry-level jobs with salary info
SELECT title, organization, 
       ai_salary_minvalue, ai_salary_maxvalue, ai_salary_currency
FROM jobs
WHERE status = 'active'
  AND ai_experience_level = '0-2'
  AND ai_salary_minvalue IS NOT NULL
ORDER BY ai_salary_minvalue DESC;

-- Find companies hiring multiple roles
SELECT 
  organization,
  linkedin_org_size,
  linkedin_org_industry,
  COUNT(*) as open_positions
FROM jobs
WHERE status = 'active'
GROUP BY organization, linkedin_org_size, linkedin_org_industry
HAVING COUNT(*) > 3
ORDER BY open_positions DESC;
```

### Breaking Changes

⚠️ **Database Schema** - Requires recreation of `jobs` table
⚠️ **TypeScript Types** - Some field names changed (e.g., `job_type` → `employment_type`)

### Backward Compatibility

The UI components are backward compatible - they gracefully handle missing fields. However, for best results:
- Re-populate your database with the new schema
- Enable AI and LinkedIn features in Apify calls

---

## [2024-01-05] - Initial Project Setup

### Added
- Next.js 14 with TypeScript
- Tailwind CSS styling
- Supabase database integration
- Basic job listing functionality
- Filter panel component
- Job card component
- Environment configuration
- Git repository initialization
- Comprehensive documentation
  - README.md
  - IMPLEMENTATION_GUIDE.md
  - QUICK_START.md

### Features
- Client-side filtering
- Responsive design
- Job search by title, company, location
- Remote work filter
- Experience level filter
- Job type filter

---

## Future Roadmap

### Planned Features
- [ ] User authentication (Supabase Auth)
- [ ] Job alerts and notifications
- [ ] Saved searches
- [ ] Job bookmarking
- [ ] Company profiles
- [ ] Advanced analytics dashboard
- [ ] Admin panel for cost monitoring
- [ ] Email notification system
- [ ] RSS/API feeds for jobs
- [ ] Salary insights and trends
- [ ] Mobile app (React Native)

### Under Consideration
- [ ] Application tracking
- [ ] Resume parser integration
- [ ] Company reviews
- [ ] Interview preparation resources
- [ ] Expat resources (visa info, housing, etc.)
- [ ] Language filtering
- [ ] Commute calculator
- [ ] Slack/Discord integration

