# 🧪 Testing Guide: Logbook Bug Fixes

## ⚠️ CRITICAL: Run Database Cleanup FIRST

**Before testing, execute this SQL in production Supabase:**

```sql
-- Step 1: Check how many entries have anomalies
SELECT COUNT(*) as anomaly_count
FROM logbook_entries
WHERE updated_at < created_at;

-- Step 2: Fix the anomalies
UPDATE logbook_entries
SET updated_at = created_at
WHERE updated_at < created_at;

-- Step 3: Verify fix (should return 0)
SELECT COUNT(*) FROM logbook_entries WHERE updated_at < created_at;
```

---

## 🔍 Test Scenario 1: User with SQL-Injected Data

### Test User Info:
- **User ID**: `83b4ae36-9450-4b2a-bf23-03e4481f1b79`
- **Issue**: Has entries with `updated_at < created_at`
- **Expected**: All draft entries should now appear

### Steps:
1. **Login** as this user
2. **Navigate** to: Logbook → Tab "Daily Log"
3. **Check** if draft entries appear in the table
4. **Open Browser Console** (F12)
5. **Look for logs**:
   ```
   [LogbookDaily] Fetched X entries for date YYYY-MM-DD
   [LogbookDaily] Filtered to X draft entries
   ```

### Expected Results:
✅ All draft entries visible in table  
✅ Console shows correct entry count  
✅ No errors in console  
✅ Entries match database count  

### If Issues Persist:
1. Check console for: `Timestamp anomaly detected for entry {id}, normalizing...`
2. Verify SQL cleanup was run successfully
3. Check database directly:
   ```sql
   SELECT id, entry_date, category, updated_at, created_at
   FROM logbook_entries
   WHERE user_id = '83b4ae36-9450-4b2a-bf23-03e4481f1b79'
     AND category = 'draft'
   ORDER BY entry_date DESC;
   ```

---

## 🔍 Test Scenario 2: Week Calculation (Sunday-Based)

### Test User Info:
- **Any user** with `start_date` set to mid-week
- **Example**: User starting on Wednesday, Nov 6, 2025

### Steps:
1. **Login** as user
2. **Navigate** to: Logbook → Tab "Weekly Compilation"
3. **Check Week Selector** buttons
4. **Open Browser Console**
5. **Select Week 1**, look for logs:
   ```
   [LogbookWeekly] Loading Week 1 data
   [LogbookWeekly] Date range: 11/6/2025 - 11/10/2025
   ```

### Expected Results:
✅ Week 1 date range: Start Date → First Sunday  
✅ Week 2+ date ranges: Monday → Sunday  
✅ All week end dates are Sundays  

### Verification:
**For user starting Wednesday, Nov 6:**
- Week 1: Nov 6 (Wed) → Nov 10 (Sun) ✅
- Week 2: Nov 11 (Mon) → Nov 17 (Sun) ✅
- Week 3: Nov 18 (Mon) → Nov 24 (Sun) ✅

**For user starting Monday, Nov 4:**
- Week 1: Nov 4 (Mon) → Nov 10 (Sun) ✅
- Week 2: Nov 11 (Mon) → Nov 17 (Sun) ✅

**For user starting Sunday, Nov 10:**
- Week 1: Nov 10 (Sun) → Nov 10 (Sun) ✅ (same day)
- Week 2: Nov 11 (Mon) → Nov 17 (Sun) ✅

---

## 🔍 Test Scenario 3: Dynamic Week Selector

### Test Setup:
1. **Create/Use** a user with entries in non-consecutive weeks
   - Example: Has entries in Week 1, Week 2, and Week 5 only

### Steps:
1. **Navigate** to: Logbook → Tab "Weekly Compilation"
2. **Check Week Selector** buttons
3. **Count visible weeks**

### Expected Results:
✅ Only shows weeks with data + current week  
✅ Week buttons display date ranges  
✅ Format: "Week 1" + "6 Nov - 10 Nov"  
✅ No hardcoded Week 1-24  

### Example Display:
```
[Week 1]          [Week 2]          [Week 5]
6 Nov - 10 Nov    11 Nov - 17 Nov   2 Dec - 8 Dec
```

---

## 🔍 Test Scenario 4: Empty State (New User)

### Test Setup:
1. **Create** a new user
2. **Set** `start_date` but DON'T add any entries yet

### Steps:
1. **Login** as new user
2. **Navigate** to: Logbook → Tab "Weekly Compilation"
3. **Check empty state**

### Expected Results:
✅ Shows calendar icon  
✅ Message: "No weekly data yet. Add some daily log entries first."  
✅ Description: "No weeks with entries yet. Start by adding daily logs."  
✅ No week selector buttons visible  

---

## 🔍 Test Scenario 5: Performance Test

### Test Setup:
1. **Use** a user with 100+ entries

### Steps:
1. **Navigate** to: Logbook → Daily Log
2. **Measure** page load time
3. **Switch** between different dates
4. **Check** week selector rendering

### Expected Results:
✅ Initial page load < 2 seconds  
✅ Date switching < 500ms  
✅ Week selector renders smoothly  
✅ No UI lag or freezing  

---

## 🔍 Test Scenario 6: Regression Testing

### Ensure No Breaking Changes:

#### Test 1: Normal User (No Anomalies)
- **User ID**: `5e6f23b3-19aa-4b8f-81b9-f84ef2126cd7`
- **Test**: All existing functionality still works
- **Expected**: No changes in behavior, all entries visible

#### Test 2: Draft Entry Creation
1. Add new draft entry
2. Verify it appears in draft table
3. Check week badge calculation
4. Verify timestamps are normal

#### Test 3: Weekly Compilation
1. Select a week with draft entries
2. Compile weekly log
3. Submit for review
4. Verify workflow still works

#### Test 4: Dashboard Stats
1. Check Intern Dashboard
2. Verify draft count matches
3. Check Under Review count
4. Verify Total Hours calculation

---

## 📊 Acceptance Criteria

### ✅ All Tests Must Pass:
- [ ] SQL-injected entries appear correctly
- [ ] Week boundaries are Sunday-based
- [ ] Week selector shows only relevant weeks
- [ ] Date ranges display on week buttons
- [ ] Empty state works for new users
- [ ] Performance is acceptable (< 2s load)
- [ ] No regression in existing features
- [ ] Console logs provide useful debugging info

### ✅ Database Health:
- [ ] No entries with `updated_at < created_at`
- [ ] Draft count matches UI display
- [ ] Week categorization is correct

### ✅ User Experience:
- [ ] Clear visual feedback
- [ ] Helpful error messages
- [ ] Smooth interactions
- [ ] No confusing states

---

## 🐛 Known Issues / Limitations

### Non-Issues (By Design):
1. **project_id can be null**: This is intentional, entries don't require a project
2. **Week 1 different length**: By design, Week 1 can be 1-7 days depending on start day
3. **Console logs in production**: Intentional for debugging, can be removed later if needed

### Potential Edge Cases:
1. **User with no start_date**: Should default to current week, but test this
2. **Historical data migration**: Old entries may need week recalculation
3. **Timezone differences**: Verify Sunday calculation works across timezones

---

## 📞 Troubleshooting

### Issue: Draft entries still not showing

**Debug Steps:**
1. Open browser console
2. Check for errors
3. Look for log: `[LogbookDaily] Fetched X entries`
4. If X = 0, check database:
   ```sql
   SELECT * FROM logbook_entries 
   WHERE user_id = 'USER_ID' 
     AND entry_date = 'YYYY-MM-DD';
   ```
5. Verify `category` field is exactly 'draft' (no trailing spaces)

### Issue: Week calculation seems wrong

**Debug Steps:**
1. Check console log: `[LogbookWeekly] Date range: ...`
2. Verify start_date in profile table
3. Check day of week for start_date
4. Calculate manually:
   - Find first Sunday after (or on) start_date
   - Week 1 = start_date to first Sunday
   - Week N = Monday to Sunday

### Issue: Week selector empty

**Debug Steps:**
1. Check if user has any entries
2. Verify `start_date` is set in profile
3. Look for console errors
4. Check if `availableWeeks` state is populated

---

## ✅ Sign-Off

After completing all tests:

**Tested By**: _______________  
**Date**: _______________  
**Status**: ☐ Pass  ☐ Fail  
**Notes**: _______________

**Issues Found**:
1. _______________
2. _______________

**Approved for Production**: ☐ Yes  ☐ No  
**Approver**: _______________
