-- Netherlands Job Board Database Schema
-- Run this in your Supabase SQL Editor

-- Create jobs table
CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  url TEXT,
  description_html TEXT,
  
  -- Job details
  location TEXT,
  job_type TEXT,
  experience_level TEXT,
  salary_range TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  
  -- Company enrichment (from Apify/LinkedIn)
  company_size TEXT,
  industry TEXT,
  headquarters_location TEXT,
  linkedin_org_slug TEXT,
  linkedin_org_description TEXT,
  
  -- Tracking metadata
  source TEXT NOT NULL CHECK (source IN ('feed', 'api')),
  first_seen_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  expired_date TIMESTAMPTZ,
  
  -- User engagement
  view_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  
  -- Indexes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_first_seen_date ON jobs(first_seen_date DESC);
CREATE INDEX idx_jobs_external_id ON jobs(external_id);
CREATE INDEX idx_jobs_organization ON jobs(organization);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_remote_allowed ON jobs(remote_allowed);

-- Full text search index
CREATE INDEX idx_jobs_title_search ON jobs USING gin(to_tsvector('english', title));
CREATE INDEX idx_jobs_description_search ON jobs USING gin(to_tsvector('english', description_html));

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON jobs
  FOR SELECT
  USING (true);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(job_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE jobs 
  SET view_count = view_count + 1
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Create user_job_alerts table for notification system
CREATE TABLE user_job_alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  job_types TEXT[] DEFAULT '{}',
  experience_levels TEXT[] DEFAULT '{}',
  remote_only BOOLEAN DEFAULT false,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  is_active BOOLEAN DEFAULT true,
  last_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_job_alerts_user_id ON user_job_alerts(user_id);
CREATE INDEX idx_user_job_alerts_is_active ON user_job_alerts(is_active);
CREATE INDEX idx_user_job_alerts_frequency ON user_job_alerts(frequency);

-- Enable RLS for user_job_alerts
ALTER TABLE user_job_alerts ENABLE ROW LEVEL SECURITY;

-- Policy for user_job_alerts (users can only see their own alerts)
CREATE POLICY "Users can view their own alerts" ON user_job_alerts
  FOR SELECT
  USING (user_id = current_user);

-- Create apify_usage_logs table for cost tracking
CREATE TABLE apify_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor TEXT NOT NULL,
  job_count INTEGER NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apify_usage_logs_date ON apify_usage_logs(date DESC);
CREATE INDEX idx_apify_usage_logs_actor ON apify_usage_logs(actor);

-- Enable RLS for apify_usage_logs (admin only)
ALTER TABLE apify_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_updated
CREATE TRIGGER update_jobs_modtime
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create view for active jobs with engagement metrics
CREATE VIEW active_jobs_with_metrics AS
SELECT 
  j.*,
  EXTRACT(EPOCH FROM (NOW() - j.first_seen_date))/86400 AS days_since_posted
FROM jobs j
WHERE j.status = 'active'
ORDER BY j.first_seen_date DESC;

-- Sample data for testing (optional)
-- Uncomment to insert sample jobs
/*
INSERT INTO jobs (
  external_id, title, organization, url, description_html,
  location, job_type, experience_level, remote_allowed,
  source, status
) VALUES
  ('sample-1', 'Senior Software Engineer', 'Tech Company NL', 'https://example.com/job1', '<p>Exciting opportunity for a senior engineer...</p>', 'Amsterdam', 'Full-time', 'Senior', true, 'feed', 'active'),
  ('sample-2', 'Product Manager', 'StartupX', 'https://example.com/job2', '<p>Join our growing team...</p>', 'Rotterdam', 'Full-time', 'Mid', false, 'api', 'active'),
  ('sample-3', 'Data Scientist', 'AI Labs', 'https://example.com/job3', '<p>Work on cutting-edge ML projects...</p>', 'Utrecht', 'Full-time', 'Senior', true, 'feed', 'active');
*/

