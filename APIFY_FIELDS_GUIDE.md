# Apify Job Data Fields Guide

Complete reference for all fields returned by the Apify Career Site Job Listing API.

---

## Table of Contents

1. [Basic Job Information](#basic-job-information)
2. [Location Data](#location-data)
3. [Employment & Salary](#employment--salary)
4. [Job Descriptions](#job-descriptions)
5. [Source Information](#source-information)
6. [AI-Enhanced Fields](#ai-enhanced-fields-beta)
7. [LinkedIn Company Data](#linkedin-company-data-beta)
8. [Tracking & Metadata](#tracking--metadata)

---

## Basic Job Information

### `id` (text)
**Description**: The job's internal ID in Apify's system. Used for tracking and expiration.

**Example**: `"1930576456"`

**Usage**: Store as `external_id` in our database to track job updates and prevent duplicates.

---

### `title` (text)
**Description**: The job title as posted by the employer.

**Example**: `"Senior Software Engineer"`, `"Head of AI Enablement"`

**Usage**: Primary field for job searches and filtering.

---

### `organization` (text)
**Description**: Name of the hiring organization/company.

**Example**: `"KPN"`, `"Systemiq"`, `"Google"`

**Usage**: Display company name, enable company-based filtering.

---

### `organization_url` (text)
**Description**: URL to the organization's main website or career page.

**Example**: `"https://www.kpn.com/careers"`

**Usage**: Optional link to company information.

---

### `organization_logo` (text)
**Description**: URL to the organization's logo image.

**Example**: `"https://logo.clearbit.com/kpn.com"`

**Usage**: Display company branding in job cards.

---

### `url` (text)
**Description**: Direct URL to the job posting where candidates can apply.

**Example**: `"https://jobs.kpn.com/job/12345/senior-engineer"`

**Usage**: Primary call-to-action link for applications.

---

## Location Data

### `locations_raw` (json[])
**Description**: Raw location data as provided by the employer, following Google for Jobs requirements.

**Example**: 
```json
[
  {
    "streetAddress": "123 Main St",
    "addressLocality": "Amsterdam",
    "addressRegion": "North Holland",
    "postalCode": "1012 AB",
    "addressCountry": "NL"
  }
]
```

**Usage**: Full address details when available.

---

### `locations_alt_raw` (text[])
**Description**: Complementary raw location field for ATS systems with limited location data (currently only used for Workday).

**Example**: `["Amsterdam, Netherlands", "Remote"]`

**Usage**: Fallback location information.

---

### `locations_derived` (text[])
**Description**: **⭐ PRIMARY LOCATION FIELD** - Parsed and standardized location data matched against Apify's location database.

**Format**: Array of objects with structure `{city, admin, country}`

**Example**: 
```json
[
  {
    "city": "Amsterdam",
    "admin": "North Holland",
    "country": "Netherlands"
  }
]
```

**Usage**: Use this for location-based searches and filters. Most reliable location data.

---

### `location_type` (text)
**Description**: Identifies remote jobs using the value `"TELECOMMUTE"` per Google for Jobs requirements.

**Example**: `"TELECOMMUTE"` or `null`

**Usage**: Flag for remote positions.

---

### `location_requirements_raw` (json[])
**Description**: Additional location requirements for remote jobs (e.g., "Must be located in EU").

**Example**: `[{"@type": "Country", "name": "Netherlands"}]`

**Usage**: Geographic restrictions for remote positions.

---

### `cities_derived` (json[])
**Description**: All cities extracted from `locations_derived`.

**Example**: `["Amsterdam", "Rotterdam", "Utrecht"]`

**Usage**: City-level filtering and display.

---

### `regions_derived` (json[])
**Description**: All regions/states/provinces extracted from `locations_derived`.

**Example**: `["North Holland", "South Holland"]`

**Usage**: Regional filtering.

---

### `countries_derived` (json[])
**Description**: All countries extracted from `locations_derived`.

**Example**: `["Netherlands", "Belgium"]`

**Usage**: Country-level filtering and analytics.

---

### `timezones_derived` (json[])
**Description**: Timezones derived from the locations.

**Example**: `["Europe/Amsterdam"]`

**Usage**: Time zone information for remote work scheduling.

---

### `lats_derived` (json[])
**Description**: Latitude coordinates derived from locations.

**Example**: `[52.3676, 51.9225]`

**Usage**: Map visualization, geographic searches.

---

### `lngs_derived` (json[])
**Description**: Longitude coordinates derived from locations.

**Example**: `[4.9041, 4.4792]`

**Usage**: Map visualization, geographic searches.

---

### `remote_derived` (boolean)
**Description**: Job is flagged as remote based on:
- The word "remote" appearing in title or description
- Location type being "TELECOMMUTE"
- Location data indicating remote work

**Example**: `true` or `false`

**Usage**: Quick remote job filtering.

---

## Employment & Salary

### `employment_type` (text[])
**Description**: Array of employment types like "Full Time", "Part Time", "Contract", "Internship".

**Example**: `["Full Time"]`, `["Part Time", "Contract"]`

**Usage**: Filter jobs by employment type. Usually a single value but can have multiple.

---

### `salary_raw` (json)
**Description**: Raw salary data per Google for Jobs requirements.

**Example**: 
```json
{
  "@type": "MonetaryAmount",
  "currency": "EUR",
  "value": {
    "@type": "QuantitativeValue",
    "minValue": 50000,
    "maxValue": 70000,
    "unitText": "YEAR"
  }
}
```

**Usage**: Structured salary information when provided by employer.

---

## Job Descriptions

### `description_text` (text)
**Description**: Plain text version of the job description (if included in API settings).

**Example**: `"We are looking for a Senior Software Engineer to join our team..."`

**Usage**: Full-text search, display without HTML parsing.

---

### `description_html` (text)
**Description**: Raw HTML version of the job description (if included in API settings).

**Example**: `"<p>We are looking for a <strong>Senior Software Engineer</strong>...</p>"`

**Usage**: Rich text display with formatting preserved.

**⚠️ Note**: These fields are large and may increase costs. Enable only when needed.

---

## Source Information

### `source` (text)
**Description**: The name of the ATS (Applicant Tracking System) or career site.

**Example**: `"greenhouse"`, `"lever"`, `"smartrecruiters"`, `"workday"`, `"adp"`

**Usage**: Track which platforms jobs come from, identify recruitment patterns.

---

### `source_type` (text)
**Description**: Either `"ats"` (Applicant Tracking System) or `"career-site"`.

**Example**: `"ats"`

**Usage**: Categorize job sources.

---

### `source_domain` (text)
**Description**: The domain of the career site where the job was found.

**Example**: `"jobs.smartrecruiters.com"`, `"careers.google.com"`

**Usage**: Track specific career portals.

---

### `domain_derived` (text)
**Description**: **AI-enhanced** - The employer's main website domain discovered using AI.

**Accuracy**: ~98%

**Example**: `"kpn.com"`, `"google.com"`

**Usage**: Link to company website, fetch company logos.

---

## Tracking & Metadata

### `date_posted` (timestamp)
**Description**: Date and time when the job was originally posted.

**Example**: `"2026-01-05T10:30:00Z"`

**Usage**: Sort by newest, calculate job age.

---

### `date_created` (timestamp)
**Description**: Date and time when the job was indexed in Apify's system.

**Example**: `"2026-01-05T11:00:00Z"`

**Usage**: Track when jobs entered the system.

---

### `date_validthrough` (timestamp)
**Description**: Expiration date of the job posting (often `null` as employers rarely specify).

**Example**: `"2026-02-05T23:59:59Z"` or `null`

**Usage**: Job expiration tracking (rarely available).

---

### `date_modified` (timestamp)
**Description**: Date and time when Apify discovered a modification to the job posting.

**Example**: `"2026-01-10T14:20:00Z"`

**Usage**: Track job updates.

---

### `modified_fields` (text[])
**Description**: Array of field names that were modified during Apify's job modification checks.

**Example**: `["description", "salary"]`

**Usage**: Track what changed in a job posting.

---

## AI-Enhanced Fields (BETA)

**⚠️ Important**: Set `include_ai: true` in API call to receive these fields.

**Note**: These fields are derived using an LLM and may contain mistakes. Use with appropriate validation.

---

### `ai_salary_currency` (text)
**Description**: Salary currency extracted from job description.

**Example**: `"EUR"`, `"USD"`, `"GBP"`

**Usage**: Display salary with correct currency symbol.

---

### `ai_salary_value` (numeric)
**Description**: Single salary value when no range is specified.

**Example**: `65000`

**Usage**: Jobs with fixed salary amounts.

---

### `ai_salary_minvalue` (numeric)
**Description**: Minimum salary in a range.

**Example**: `50000`

**Usage**: Salary range filtering (lower bound).

---

### `ai_salary_maxvalue` (numeric)
**Description**: Maximum salary in a range.

**Example**: `70000`

**Usage**: Salary range filtering (upper bound).

---

### `ai_salary_unittext` (text)
**Description**: Salary payment frequency.

**Values**: `"HOUR"`, `"DAY"`, `"WEEK"`, `"MONTH"`, `"YEAR"`

**Example**: `"YEAR"`

**Usage**: Display salary with correct time unit.

---

### `ai_benefits` (text[])
**Description**: Array of non-salary benefits mentioned in the job listing.

**Example**: `["Health Insurance", "Remote Work", "Stock Options", "Professional Development"]`

**Usage**: Display perks, enable benefits-based filtering.

---

### `ai_experience_level` (text)
**Description**: Required years of experience.

**Values**: `"0-2"`, `"2-5"`, `"5-10"`, `"10+"`

**Example**: `"5-10"`

**Usage**: Experience-level filtering, career stage matching.

---

### `ai_work_arrangement` (text)
**Description**: Work location arrangement.

**Values**:
- `"Remote Solely"` - Remote only, no office available
- `"Remote OK"` - Remote with optional office
- `"Hybrid"` - Mix of office and remote
- `"On-site"` - Office-based only

**Example**: `"Hybrid"`, `"Remote OK"`

**Usage**: Work arrangement filtering, remote job discovery.

---

### `ai_work_arrangement_office_days` (bigint)
**Description**: For hybrid roles, the number of required office days per week.

**Example**: `2` (means 2 days in office, 3 remote)

**Usage**: Hybrid work requirement details.

---

### `ai_remote_location` (text[])
**Description**: When remote but limited to specific location(s).

**Example**: `["Netherlands", "EU countries"]`

**Usage**: Geographic restrictions for remote positions.

---

### `ai_remote_location_derived` (text[])
**Description**: Standardized version of `ai_remote_location` matched against Apify's location database.

**Format**: Same as `locations_derived`: `{city, admin, country}`

**Example**: 
```json
[
  {
    "city": null,
    "admin": null,
    "country": "Netherlands"
  }
]
```

**Usage**: Consistent geographic filtering for remote roles.

---

### `ai_key_skills` (text[])
**Description**: Key skills mentioned in the job listing.

**Example**: `["Python", "Machine Learning", "AWS", "Team Leadership"]`

**Usage**: Skill-based filtering, skills matching.

---

### `ai_education_requirements` (text[])
**Description**: Education requirements extracted from job description.

**Example**: `["Bachelor's degree in Computer Science", "Master's preferred"]`

**Usage**: Education-level filtering.

---

### `ai_keywords` (text[])
**Description**: AI-extracted keywords from the job description.

**Example**: `["machine learning", "python", "remote", "senior"]`

**Usage**: Enhanced search, job categorization.

---

### `ai_taxonomies_a` (text[])
**Description**: AI-assigned taxonomy categories for the job.

**Example**: `["Software Development", "Artificial Intelligence", "Backend Engineering"]`

**Usage**: Job categorization, related job discovery.

---

### `ai_core_responsibilities` (text)
**Description**: 2-sentence AI-generated summary of the job's core responsibilities.

**Example**: `"Lead the development of machine learning models for production systems. Mentor junior engineers and collaborate with cross-functional teams."`

**Usage**: Quick job overview, search snippets.

---

### `ai_requirements_summary` (text)
**Description**: 2-sentence AI-generated summary of the job's requirements.

**Example**: `"5+ years of experience in Python and ML frameworks required. Strong communication skills and proven track record of delivering ML projects."`

**Usage**: Quick requirements overview.

---

### `ai_working_hours` (bigint)
**Description**: Required working hours per week. Defaults to 40 if not mentioned.

**Example**: `40`, `32` (part-time)

**Usage**: Work-life balance filtering, part-time job identification.

---

### `ai_employment_type` (text[])
**Description**: Employment types derived from the job description.

**Values**: `"FULL_TIME"`, `"PART_TIME"`, `"CONTRACTOR"`, `"TEMPORARY"`, `"INTERN"`, `"VOLUNTEER"`, `"PER_DIEM"`, `"OTHER"`

**Example**: `["FULL_TIME"]`, `["FULL_TIME", "CONTRACTOR"]`

**Usage**: Alternative to `employment_type` with AI enhancement.

---

### `ai_job_language` (text)
**Description**: The language of the job description.

**Example**: `"English"`, `"Dutch"`, `"German"`

**Usage**: Language-based filtering for international job boards.

---

### `ai_visa_sponsorship` (boolean)
**Description**: Returns `true` if the job description mentions visa sponsorship opportunities.

**Example**: `true` or `false` or `null`

**Usage**: Critical filter for international job seekers.

---

### `ai_hiring_manager_name` (text)
**Description**: Hiring manager's name if mentioned in the job posting.

**Example**: `"John Smith"` or `null`

**Usage**: Personalized applications, networking opportunities.

---

### `ai_hiring_manager_email_address` (text)
**Description**: Hiring manager's email if present in the job posting.

**Example**: `"john.smith@company.com"` or `null`

**Usage**: Direct contact for applications.

---

## LinkedIn Company Data (BETA)

**⚠️ Important**: Set `include_li: true` in API call to receive these fields.

**Note**: These fields are matched to the job company using AI and may contain mistakes.

---

### `linkedin_org_employees` (int)
**Description**: Number of employees at the company according to LinkedIn.

**Example**: `5000`

**Usage**: Company size filtering, startup vs enterprise identification.

---

### `linkedin_org_url` (text)
**Description**: URL to the company's LinkedIn page.

**Example**: `"https://www.linkedin.com/company/kpn/"`

**Usage**: Link to company LinkedIn for research.

---

### `linkedin_org_size` (text)
**Description**: Company size range as stated by the company on LinkedIn.

**Example**: `"1,001-5,000 employees"`, `"51-200 employees"`

**Usage**: Company size categorization.

---

### `linkedin_org_slogan` (text)
**Description**: Company's slogan or tagline from LinkedIn.

**Example**: `"Connecting people and businesses"`

**Usage**: Company branding, culture insights.

---

### `linkedin_org_industry` (text)
**Description**: Company's industry from a fixed LinkedIn list.

**Note**: In the language of the company's HQ.

**Example**: `"Telecommunications"`, `"Software Development"`

**Usage**: Industry-based filtering and categorization.

---

### `linkedin_org_followers` (int)
**Description**: Number of followers the company has on LinkedIn.

**Example**: `125000`

**Usage**: Company popularity indicator.

---

### `linkedin_org_headquarters` (text)
**Description**: Company's headquarters location.

**Example**: `"Amsterdam, North Holland, Netherlands"`

**Usage**: Company location information.

---

### `linkedin_org_type` (text)
**Description**: Company type/structure.

**Example**: `"Public Company"`, `"Privately Held"`, `"Non-profit"`, `"Government"`

**Usage**: Company category, funding status insights.

---

### `linkedin_org_foundeddate` (text)
**Description**: Year the company was founded.

**Example**: `"1989"`, `"2015"`

**Usage**: Company age, startup vs established company.

---

### `linkedin_org_specialties` (text[])
**Description**: Comma-delimited list of company specialties from LinkedIn.

**Example**: `["Mobile Networks", "Cloud Services", "IoT", "5G"]`

**Usage**: Company expertise areas, tech stack hints.

---

### `linkedin_org_locations` (text[])
**Description**: Full addresses of the company's office locations.

**Example**: 
```json
[
  "Maanplein 55, The Hague, 2516 CK, NL",
  "Reguliersgracht 22, Amsterdam, 1017 CV, NL"
]
```

**Usage**: Multi-location companies, office locations.

---

### `linkedin_org_description` (text)
**Description**: Company description from LinkedIn page.

**Example**: `"KPN is the leading telecommunications and IT provider in the Netherlands..."`

**Usage**: Company overview, "About" sections.

---

### `linkedin_org_recruitment_agency_derived` (boolean)
**Description**: AI-determined flag indicating if the company is a recruitment agency.

**Accuracy**: May vary; job boards might be incorrectly flagged.

**Example**: `true` or `false`

**Usage**: Filter out recruitment agencies to show direct employer postings only.

---

### `linkedin_org_slug` (text)
**Description**: Company-specific part of the LinkedIn URL.

**Example**: `"kpn"` (from `https://www.linkedin.com/company/kpn/`)

**Usage**: Construct LinkedIn URLs, company identification.

---

## Field Usage Recommendations

### Essential Fields (Always Include)
- `id` - Tracking and deduplication
- `title` - Primary display
- `organization` - Company name
- `url` - Apply link
- `locations_derived` - Location filtering
- `employment_type` - Job type
- `date_posted` - Sorting and freshness

### Highly Recommended Fields
- `organization_logo` - Visual appeal
- `cities_derived` / `countries_derived` - Location filtering
- `remote_derived` - Remote job flag
- `source` / `source_domain` - Source tracking
- `ai_experience_level` - Experience filtering
- `ai_work_arrangement` - Work arrangement
- `ai_key_skills` - Skills matching
- `ai_salary_*` - Salary information

### Optional Fields (Increase Costs)
- `description_text` / `description_html` - Large text fields
- All `linkedin_org_*` fields - Set `include_li: true`
- All `ai_*` fields - Set `include_ai: true`

### For Advanced Features
- `lats_derived` / `lngs_derived` - Map visualization
- `ai_visa_sponsorship` - International candidates
- `linkedin_org_recruitment_agency_derived` - Filter agencies
- `ai_benefits` - Benefits comparison
- `modified_fields` - Change tracking

---

## API Configuration Example

```typescript
// Minimal configuration (lowest cost)
{
  timeframe: '24hours',
  locationSearch: ['Netherlands'],
  maxItems: 1000,
  include_ai: false,  // Skip AI fields
  include_li: false,  // Skip LinkedIn data
}

// Recommended configuration
{
  timeframe: '24hours',
  locationSearch: ['Netherlands'],
  maxItems: 1000,
  include_ai: true,   // Include AI enhancements
  include_li: true,   // Include company data
}

// With search filters
{
  timeframe: '24hours',
  locationSearch: ['Amsterdam', 'Rotterdam'],
  titleSearch: ['Software Engineer', 'Developer'],
  organizationExclusionSearch: ['Recruitment', 'Staffing'],
  maxItems: 1000,
  include_ai: true,
  include_li: true,
}
```

---

## Cost Considerations

- **Base cost**: $0.012 per job (Career Site Job Listing API)
- **Feed cost**: $0.002 per job (Career Site Job Listing Feed)
- **AI fields** (`include_ai: true`): Included in base cost
- **LinkedIn fields** (`include_li: true`): Included in base cost
- **Description fields**: Included but increase data transfer

**Budget Planning**:
- 1,000 jobs/day with API = $12/day = $360/month
- 500 jobs/day with API = $6/day = $180/month
- Initial feed load (15,000 jobs) = $30 one-time

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.sql) - How we store these fields
- [Type Definitions](./types/job.ts) - TypeScript interfaces
- [Apify Official Docs](https://apify.com/fantastic-jobs/career-site-job-listing-api) - Source documentation

---

**Last Updated**: January 2026  
**Apify Schema Version**: v3.x

