-- ========================================
-- Detect and set Dutch language from job titles
-- ========================================
-- This migration retroactively updates existing jobs to set ai_job_language = 'Dutch'
-- when the job title contains Dutch language keywords but ai_job_language is NULL.
--
-- This works in conjunction with the code in lib/apify.ts that detects Dutch
-- for all new incoming jobs.

-- First, let's see how many jobs this will affect
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO affected_count
  FROM jobmarket_jobs
  WHERE ai_job_language IS NULL
    AND status = 'active'
    AND (
      LOWER(title) LIKE '%dutch-speaking%'
      OR LOWER(title) LIKE '%dutch speaking%'
      OR LOWER(title) LIKE '%dutch language%'
      OR LOWER(title) LIKE '%dutch speaker%'
      OR LOWER(title) LIKE '%dutch required%'
      OR LOWER(title) LIKE '%fluent dutch%'
      OR LOWER(title) LIKE '%native dutch%'
    );

  RAISE NOTICE 'Will update % jobs to set ai_job_language = Dutch', affected_count;
END $$;

-- Now perform the update
UPDATE jobmarket_jobs
SET
  ai_job_language = 'Dutch',
  last_updated = NOW()
WHERE ai_job_language IS NULL
  AND status = 'active'
  AND (
    LOWER(title) LIKE '%dutch-speaking%'
    OR LOWER(title) LIKE '%dutch speaking%'
    OR LOWER(title) LIKE '%dutch language%'
    OR LOWER(title) LIKE '%dutch speaker%'
    OR LOWER(title) LIKE '%dutch required%'
    OR LOWER(title) LIKE '%fluent dutch%'
    OR LOWER(title) LIKE '%native dutch%'
  );

-- Show a summary of the results
DO $$
DECLARE
  total_dutch INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO total_dutch
  FROM jobmarket_jobs
  WHERE ai_job_language = 'Dutch'
    AND status = 'active';

  RAISE NOTICE 'Total active jobs with Dutch language: %', total_dutch;
END $$;
