-- Netherlands Job Board Database Schema
-- Optimized for Apify Career Site Job Listing API/Feed
-- Run this in your Supabase SQL Editor

-- Drop existing tables if recreating (uncomment if needed)
-- DROP TABLE IF EXISTS jobs CASCADE;
-- DROP TABLE IF EXISTS user_job_alerts CASCADE;
-- DROP TABLE IF EXISTS apify_usage_logs CASCADE;

-- ============================================
-- MAIN JOBS TABLE
-- ============================================

CREATE TABLE jobs (
  -- Internal ID
  id BIGSERIAL PRIMARY KEY,
  
  -- Core Apify Fields
  external_id TEXT UNIQUE NOT NULL,              -- Apify 'id' field (for expiration tracking)
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_url TEXT,
  organization_logo TEXT,
  url TEXT,                                       -- Job application URL
  
  -- Dates from Apify
  date_posted TIMESTAMPTZ,                        -- When job was posted by employer
  date_created TIMESTAMPTZ,                       -- When indexed in Apify
  date_validthrough TIMESTAMPTZ,                  -- Expiration date (if provided)
  date_modified TIMESTAMPTZ,                      -- Last modification detected
  
  -- Description Fields
  description_text TEXT,                          -- Plain text description
  description_html TEXT,                          -- HTML formatted description
  
  -- Location Data (Rich structure from Apify)
  locations_raw JSONB,                            -- Raw location per Google Jobs spec
  locations_alt_raw TEXT[],                       -- Alternative location data
  locations_derived TEXT[],                       -- [{city, admin (state), country}]
  location_type TEXT,                             -- 'TELECOMMUTE' for remote jobs
  location_requirements_raw JSONB,                -- Remote job location requirements
  
  -- Derived Location Fields
  cities_derived JSONB,                           -- All cities from locations_derived
  regions_derived JSONB,                          -- All states/provinces
  countries_derived JSONB,                        -- All countries
  timezones_derived JSONB,                        -- Derived timezones
  lats_derived JSONB,                             -- Latitudes
  lngs_derived JSONB,                             -- Longitudes
  remote_derived BOOLEAN DEFAULT false,           -- AI-detected remote flag
  
  -- Employment & Salary
  employment_type TEXT[],                         -- ['Full-time', 'Contract', etc.]
  salary_raw JSONB,                               -- Raw salary data (Google Jobs spec)
  
  -- Source Information
  source TEXT NOT NULL,                           -- ATS name (e.g., 'workday', 'greenhouse')
  source_type TEXT,                               -- 'ats' or 'career-site'
  source_domain TEXT,                             -- Domain of career site
  domain_derived TEXT,                            -- AI-discovered employer domain (~98% accuracy)
  modified_fields TEXT[],                         -- Fields modified during updates
  
  -- ============================================
  -- AI-ENHANCED FIELDS (Beta - include_ai=true)
  -- ============================================
  
  -- AI Salary Parsing
  ai_salary_currency TEXT,
  ai_salary_value NUMERIC(12, 2),
  ai_salary_minvalue NUMERIC(12, 2),
  ai_salary_maxvalue NUMERIC(12, 2),
  ai_salary_unittext TEXT,                        -- HOUR/DAY/WEEK/MONTH/YEAR
  ai_benefits TEXT[],
  
  -- AI Job Classification
  ai_experience_level TEXT,                       -- 0-2, 2-5, 5-10, 10+
  ai_work_arrangement TEXT,                       -- Remote Solely/Remote OK/Hybrid/On-site
  ai_work_arrangement_office_days INTEGER,
  ai_remote_location TEXT[],
  ai_remote_location_derived TEXT[],
  
  -- AI Skills & Requirements
  ai_key_skills TEXT[],
  ai_education_requirements TEXT[],
  ai_keywords TEXT[],
  ai_taxonomies_a TEXT[],
  
  -- AI Job Details
  ai_core_responsibilities TEXT,                  -- 2-sentence summary
  ai_requirements_summary TEXT,                   -- 2-sentence summary
  ai_working_hours INTEGER DEFAULT 40,
  ai_employment_type TEXT[],
  ai_job_language TEXT,
  ai_visa_sponsorship BOOLEAN,
  
  -- AI Hiring Manager (if available)
  ai_hiring_manager_name TEXT,
  ai_hiring_manager_email_address TEXT,
  
  -- ============================================
  -- LINKEDIN COMPANY DATA (include_li=true)
  -- ============================================
  
  linkedin_org_employees INTEGER,
  linkedin_org_url TEXT,
  linkedin_org_size TEXT,
  linkedin_org_slogan TEXT,
  linkedin_org_industry TEXT,
  linkedin_org_followers INTEGER,
  linkedin_org_headquarters TEXT,
  linkedin_org_type TEXT,                         -- 'privately held', 'public', etc.
  linkedin_org_foundeddate TEXT,
  linkedin_org_specialties TEXT[],
  linkedin_org_locations TEXT[],
  linkedin_org_description TEXT,
  linkedin_org_recruitment_agency_derived BOOLEAN,
  linkedin_org_slug TEXT,
  
  -- ============================================
  -- INTERNAL TRACKING & METADATA
  -- ============================================
  
  data_source TEXT NOT NULL CHECK (data_source IN ('feed', 'api')), -- How we got this job
  first_seen_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  expired_date TIMESTAMPTZ,
  
  -- User Engagement Metrics
  view_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Core indexes
CREATE INDEX idx_jobs_external_id ON jobs(external_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_date_posted ON jobs(date_posted DESC NULLS LAST);
CREATE INDEX idx_jobs_date_created ON jobs(date_created DESC NULLS LAST);
CREATE INDEX idx_jobs_first_seen_date ON jobs(first_seen_date DESC);

-- Search indexes
CREATE INDEX idx_jobs_organization ON jobs(organization);
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_source_domain ON jobs(source_domain);

-- Location indexes
CREATE INDEX idx_jobs_location_type ON jobs(location_type);
CREATE INDEX idx_jobs_remote_derived ON jobs(remote_derived);
CREATE INDEX idx_jobs_countries_derived ON jobs USING gin(countries_derived);
CREATE INDEX idx_jobs_cities_derived ON jobs USING gin(cities_derived);

-- Employment indexes
CREATE INDEX idx_jobs_employment_type ON jobs USING gin(employment_type);
CREATE INDEX idx_jobs_ai_experience_level ON jobs(ai_experience_level);
CREATE INDEX idx_jobs_ai_work_arrangement ON jobs(ai_work_arrangement);

-- Skills and keywords indexes
CREATE INDEX idx_jobs_ai_key_skills ON jobs USING gin(ai_key_skills);
CREATE INDEX idx_jobs_ai_keywords ON jobs USING gin(ai_keywords);

-- Full text search indexes
CREATE INDEX idx_jobs_title_search ON jobs USING gin(to_tsvector('english', title));
CREATE INDEX idx_jobs_description_text_search ON jobs USING gin(to_tsvector('english', COALESCE(description_text, '')));

-- Company indexes
CREATE INDEX idx_jobs_linkedin_org_slug ON jobs(linkedin_org_slug);
CREATE INDEX idx_jobs_linkedin_org_industry ON jobs(linkedin_org_industry);

-- ============================================
-- USER JOB ALERTS TABLE
-- ============================================

CREATE TABLE user_job_alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Filter preferences
  keywords TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  job_types TEXT[] DEFAULT '{}',
  experience_levels TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  min_salary NUMERIC(12, 2),
  max_salary NUMERIC(12, 2),
  remote_only BOOLEAN DEFAULT false,
  visa_sponsorship_required BOOLEAN DEFAULT false,
  
  -- Notification settings
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'immediate')),
  is_active BOOLEAN DEFAULT true,
  last_sent TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_job_alerts_user_id ON user_job_alerts(user_id);
CREATE INDEX idx_user_job_alerts_email ON user_job_alerts(email);
CREATE INDEX idx_user_job_alerts_is_active ON user_job_alerts(is_active);
CREATE INDEX idx_user_job_alerts_frequency ON user_job_alerts(frequency);

-- ============================================
-- APIFY USAGE LOGS TABLE
-- ============================================

CREATE TABLE apify_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor TEXT NOT NULL,
  job_count INTEGER NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  run_status TEXT,                               -- 'success', 'failed', 'partial'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apify_usage_logs_date ON apify_usage_logs(date DESC);
CREATE INDEX idx_apify_usage_logs_actor ON apify_usage_logs(actor);
CREATE INDEX idx_apify_usage_logs_run_status ON apify_usage_logs(run_status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE apify_usage_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for jobs
CREATE POLICY "Allow public read access to active jobs" ON jobs
  FOR SELECT
  USING (status = 'active');

-- Users can only see their own alerts
CREATE POLICY "Users can view their own alerts" ON user_job_alerts
  FOR SELECT
  USING (user_id = current_user);

CREATE POLICY "Users can insert their own alerts" ON user_job_alerts
  FOR INSERT
  WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update their own alerts" ON user_job_alerts
  FOR UPDATE
  USING (user_id = current_user);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(job_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE jobs 
  SET view_count = view_count + 1
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for jobs table
CREATE TRIGGER update_jobs_modtime
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger for user_job_alerts table
CREATE TRIGGER update_alerts_modtime
BEFORE UPDATE ON user_job_alerts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Active jobs with calculated metrics
CREATE VIEW active_jobs_with_metrics AS
SELECT 
  j.*,
  EXTRACT(EPOCH FROM (NOW() - j.date_posted))/86400 AS days_since_posted,
  EXTRACT(EPOCH FROM (NOW() - j.first_seen_date))/86400 AS days_in_our_db,
  CASE 
    WHEN j.remote_derived = true OR j.location_type = 'TELECOMMUTE' THEN 'Remote'
    WHEN j.ai_work_arrangement IS NOT NULL THEN j.ai_work_arrangement
    ELSE 'On-site'
  END AS work_type
FROM jobs j
WHERE j.status = 'active'
ORDER BY j.date_posted DESC NULLS LAST;

-- Jobs expiring soon (if expiration date is set)
CREATE VIEW jobs_expiring_soon AS
SELECT 
  id,
  external_id,
  title,
  organization,
  date_validthrough,
  EXTRACT(EPOCH FROM (date_validthrough - NOW()))/86400 AS days_until_expiration
FROM jobs
WHERE status = 'active'
  AND date_validthrough IS NOT NULL
  AND date_validthrough > NOW()
  AND date_validthrough < NOW() + INTERVAL '7 days'
ORDER BY date_validthrough ASC;

-- Monthly cost summary
CREATE VIEW monthly_cost_summary AS
SELECT 
  DATE_TRUNC('month', date) as month,
  actor,
  COUNT(*) as run_count,
  SUM(job_count) as total_jobs,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost_per_run
FROM apify_usage_logs
WHERE date >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', date), actor
ORDER BY month DESC, actor;

-- ============================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================

-- Search remote jobs in Amsterdam with specific skills
-- SELECT * FROM jobs 
-- WHERE status = 'active'
--   AND remote_derived = true
--   AND 'Amsterdam' = ANY(cities_derived)
--   AND ai_key_skills && ARRAY['Python', 'React']
-- ORDER BY date_posted DESC;

-- Find jobs with salary information
-- SELECT title, organization, ai_salary_minvalue, ai_salary_maxvalue, ai_salary_currency
-- FROM jobs
-- WHERE status = 'active' 
--   AND ai_salary_minvalue IS NOT NULL
-- ORDER BY ai_salary_minvalue DESC;

-- Jobs by company size
-- SELECT linkedin_org_size, COUNT(*) as job_count
-- FROM jobs
-- WHERE status = 'active' AND linkedin_org_size IS NOT NULL
-- GROUP BY linkedin_org_size
-- ORDER BY job_count DESC;

-- ============================================
-- OPTIONAL: SAMPLE DATA FOR TESTING
-- ============================================

/*
INSERT INTO jobs (
  external_id, title, organization, url, description_html,
  employment_type, remote_derived, data_source, status,
  date_posted, locations_derived, cities_derived, countries_derived,
  ai_key_skills, ai_experience_level, source
) VALUES
  (
    'test-1', 
    'Senior Full Stack Engineer', 
    'TechCorp Netherlands', 
    'https://example.com/job1',
    '<p>Join our innovative team working on cutting-edge web applications...</p>',
    ARRAY['Full-time'],
    true,
    'feed',
    'active',
    NOW() - INTERVAL '2 days',
    ARRAY['{"city": "Amsterdam", "admin": "North Holland", "country": "Netherlands"}'],
    '["Amsterdam"]'::jsonb,
    '["Netherlands"]'::jsonb,
    ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    '5-10',
    'greenhouse'
  ),
  (
    'test-2',
    'Product Manager',
    'Innovation StartupX',
    'https://example.com/job2',
    '<p>Lead product development for our SaaS platform...</p>',
    ARRAY['Full-time'],
    false,
    'api',
    'active',
    NOW() - INTERVAL '5 days',
    ARRAY['{"city": "Rotterdam", "admin": "South Holland", "country": "Netherlands"}'],
    '["Rotterdam"]'::jsonb,
    '["Netherlands"]'::jsonb,
    ARRAY['Product Strategy', 'Agile', 'User Research'],
    '2-5',
    'workday'
  );
*/
