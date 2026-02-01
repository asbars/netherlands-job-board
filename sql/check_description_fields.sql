-- Check job description field population
-- Run this to see which description fields are populated

SELECT
  -- Count of active jobs with each field populated
  COUNT(*) FILTER (WHERE description_text IS NOT NULL AND description_text != '') as has_text,
  COUNT(*) FILTER (WHERE description_html IS NOT NULL AND description_html != '') as has_html,
  COUNT(*) FILTER (WHERE (description_text IS NOT NULL AND description_text != '')
                   AND (description_html IS NOT NULL AND description_html != '')) as has_both,
  COUNT(*) FILTER (WHERE (description_text IS NULL OR description_text = '')
                   AND (description_html IS NULL OR description_html = '')) as has_neither,
  COUNT(*) as total_active_jobs,

  -- Percentages
  ROUND(100.0 * COUNT(*) FILTER (WHERE description_text IS NOT NULL AND description_text != '') / COUNT(*), 2) as text_percentage,
  ROUND(100.0 * COUNT(*) FILTER (WHERE description_html IS NOT NULL AND description_html != '') / COUNT(*), 2) as html_percentage
FROM jobmarket_jobs
WHERE status = 'active';

-- Sample jobs to see what the data looks like
SELECT
  id,
  title,
  organization,
  CASE
    WHEN description_text IS NOT NULL AND description_text != '' THEN 'YES'
    ELSE 'NO'
  END as has_text,
  CASE
    WHEN description_html IS NOT NULL AND description_html != '' THEN 'YES'
    ELSE 'NO'
  END as has_html,
  CASE
    WHEN description_text IS NOT NULL AND description_text != '' THEN LENGTH(description_text)
    ELSE 0
  END as text_length,
  CASE
    WHEN description_html IS NOT NULL AND description_html != '' THEN LENGTH(description_html)
    ELSE 0
  END as html_length
FROM jobmarket_jobs
WHERE status = 'active'
ORDER BY first_seen_date DESC
LIMIT 20;
