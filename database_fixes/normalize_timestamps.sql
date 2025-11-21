-- =========================================
-- FIX: Normalize Timestamp Anomalies
-- Bug #1: Data Draft Tidak Muncul
-- =========================================

-- Problem: Some entries have updated_at < created_at from SQL injection
-- This causes inconsistency and potential filtering issues

-- Step 1: Check for anomalies
SELECT 
  id,
  user_id,
  entry_date,
  category,
  created_at,
  updated_at,
  (updated_at < created_at) as has_anomaly,
  EXTRACT(EPOCH FROM (created_at - updated_at))/3600 as hours_diff
FROM logbook_entries
WHERE updated_at < created_at
ORDER BY entry_date DESC;

-- Step 2: Fix anomalies by setting updated_at = created_at
-- BACKUP FIRST! Run this only after confirming the data above
UPDATE logbook_entries
SET updated_at = created_at
WHERE updated_at < created_at;

-- Step 3: Verify fix
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN updated_at < created_at THEN 1 END) as anomaly_count,
  COUNT(CASE WHEN category = 'draft' THEN 1 END) as draft_count
FROM logbook_entries;

-- Step 4: Check specific user's data (replace with actual user_id)
SELECT 
  id,
  entry_date,
  category,
  project_id,
  created_at,
  updated_at,
  content
FROM logbook_entries
WHERE user_id = '83b4ae36-9450-4b2a-bf23-03e4481f1b79'  -- Replace with problem user ID
  AND category = 'draft'
ORDER BY entry_date DESC
LIMIT 10;

-- =========================================
-- VERIFICATION: Week Calculation
-- =========================================

-- Check if week numbers are calculated correctly with Sunday-based weeks
-- This helps verify Bug #2 fix

WITH user_weeks AS (
  SELECT 
    e.id,
    e.user_id,
    e.entry_date,
    e.category,
    p.start_date as internship_start,
    -- Calculate days since start
    EXTRACT(DAY FROM (e.entry_date - p.start_date::date)) as days_since_start,
    -- Extract week number from category
    CASE 
      WHEN e.category LIKE 'weekly_%_log_%' THEN
        CAST(SUBSTRING(e.category FROM 'weekly_(\d+)_log_') AS INTEGER)
      ELSE NULL
    END as week_number_in_category
  FROM logbook_entries e
  JOIN profiles p ON e.user_id = p.id
  WHERE e.category LIKE 'weekly_%'
    AND p.start_date IS NOT NULL
)
SELECT 
  user_id,
  entry_date,
  category,
  internship_start,
  EXTRACT(DOW FROM internship_start) as start_day_of_week,  -- 0=Sunday
  days_since_start,
  week_number_in_category
FROM user_weeks
ORDER BY entry_date
LIMIT 20;

-- =========================================
-- MONITORING: Check Draft Entries by User
-- =========================================

-- Use this to monitor if all draft entries are being fetched correctly
SELECT 
  user_id,
  COUNT(*) as draft_count,
  MIN(entry_date) as earliest_entry,
  MAX(entry_date) as latest_entry,
  COUNT(CASE WHEN updated_at < created_at THEN 1 END) as anomaly_count
FROM logbook_entries
WHERE category = 'draft'
GROUP BY user_id
ORDER BY draft_count DESC;
