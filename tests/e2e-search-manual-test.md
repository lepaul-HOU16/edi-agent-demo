# E2E Manual Test Guide: Project Search Functionality

**Task 21: Deploy and test search functionality**  
**Requirements: 5.1, 5.2, 5.3, 5.4, 5.5**

## Prerequisites

- Sandbox is running (`npx ampx sandbox`)
- Chat interface is accessible
- Test projects exist in the system

## Test Scenarios

### Test 1: Location Name Filtering (Requirement 5.1)

**Objective:** Verify projects can be filtered by location name

**Test Cases:**

1. **Search for Texas projects**
   - Query: `list projects in texas`
   - Expected: Shows only projects with "texas" in the name
   - Verify: All results contain "texas" (case-insensitive)

2. **Search for California projects**
   - Query: `list projects in california`
   - Expected: Shows only projects with "california" in the name
   - Verify: All results contain "california"

3. **Partial match search**
   - Query: `list projects in wind`
   - Expected: Shows all projects with "wind" in the name
   - Verify: All results contain "wind"

4. **No matches**
   - Query: `list projects in nonexistent`
   - Expected: "No projects found matching: nonexistent"
   - Verify: Helpful message with suggestions

**Pass Criteria:**
- ✅ Location filtering works case-insensitively
- ✅ Partial matches are found
- ✅ No false positives
- ✅ Helpful error messages for no matches

---

### Test 2: Date Range Filtering (Requirement 5.2)

**Objective:** Verify projects can be filtered by creation date

**Test Cases:**

1. **Filter by dateFrom**
   - Query: `list projects created today`
   - Expected: Shows only projects created today
   - Verify: All results have today's date

2. **Filter by dateTo**
   - Query: `list projects created before yesterday`
   - Expected: Shows only projects created before yesterday
   - Verify: All results are older than yesterday

3. **Filter by date range**
   - Query: `list projects created this week`
   - Expected: Shows only projects from the last 7 days
   - Verify: All results are within the date range

4. **No matches in date range**
   - Query: `list projects created in 2099`
   - Expected: "No projects found matching: created in 2099"
   - Verify: Helpful message

**Pass Criteria:**
- ✅ dateFrom filtering works correctly
- ✅ dateTo filtering works correctly
- ✅ Date range filtering works correctly
- ✅ Date parsing handles various formats

---

### Test 3: Incomplete Project Filtering (Requirement 5.3)

**Objective:** Verify projects can be filtered by completion status

**Test Cases:**

1. **Filter incomplete projects**
   - Query: `list incomplete projects`
   - Expected: Shows only projects missing terrain, layout, simulation, or report
   - Verify: All results are missing at least one analysis step

2. **Verify incomplete criteria**
   - For each result, check:
     - Missing terrain analysis? ✗
     - Missing layout optimization? ✗
     - Missing wake simulation? ✗
     - Missing final report? ✗
   - At least one should be ✗

3. **No incomplete projects**
   - Query: `list incomplete projects` (when all are complete)
   - Expected: "No incomplete projects found. All projects have completed analysis."
   - Verify: Helpful message

**Pass Criteria:**
- ✅ Incomplete filtering identifies projects missing any step
- ✅ Complete projects are excluded
- ✅ Completion status is accurately determined

---

### Test 4: Coordinate Proximity Filtering (Requirement 5.4)

**Objective:** Verify projects can be filtered by geographic proximity

**Test Cases:**

1. **Search within 5km**
   - Query: `list projects at coordinates 35.067482, -101.395466`
   - Expected: Shows projects within 5km of coordinates
   - Verify: All results are geographically close

2. **Search within custom radius**
   - Query: `list projects within 50km of 35.067482, -101.395466`
   - Expected: Shows projects within 50km
   - Verify: More results than 5km search

3. **No projects in area**
   - Query: `list projects at coordinates 0, 0` (middle of ocean)
   - Expected: "No projects found matching: coordinates 0, 0"
   - Verify: Helpful message

4. **Very small radius**
   - Query: `list projects within 1km of 35.067482, -101.395466`
   - Expected: Shows only very close projects
   - Verify: Fewer results than larger radius

**Pass Criteria:**
- ✅ Proximity filtering uses correct distance calculation
- ✅ Radius parameter works correctly
- ✅ Projects without coordinates are handled gracefully
- ✅ Distance calculations are accurate

---

### Test 5: Archived Status Filtering (Requirement 5.5)

**Objective:** Verify projects can be filtered by archived status

**Test Cases:**

1. **List archived projects**
   - Query: `list archived projects`
   - Expected: Shows only archived projects
   - Verify: All results have archived=true

2. **List active (non-archived) projects**
   - Query: `list projects` (default should exclude archived)
   - Expected: Shows only non-archived projects
   - Verify: No archived projects in results

3. **Explicitly list non-archived**
   - Query: `list non-archived projects`
   - Expected: Shows only active projects
   - Verify: All results have archived=false or undefined

4. **No archived projects**
   - Query: `list archived projects` (when none exist)
   - Expected: "No archived projects found."
   - Verify: Helpful message

**Pass Criteria:**
- ✅ Archived filtering works correctly
- ✅ Default listings exclude archived projects
- ✅ Archived status is accurately determined
- ✅ Projects without metadata are handled as non-archived

---

### Test 6: Combined Filters

**Objective:** Verify multiple filters can be combined

**Test Cases:**

1. **Location + Date**
   - Query: `list texas projects created this week`
   - Expected: Shows Texas projects from last 7 days
   - Verify: All results match both criteria

2. **Location + Incomplete**
   - Query: `list incomplete projects in texas`
   - Expected: Shows incomplete Texas projects
   - Verify: All results are in Texas AND incomplete

3. **Location + Archived**
   - Query: `list archived projects in california`
   - Expected: Shows archived California projects
   - Verify: All results are in California AND archived

4. **Date + Incomplete + Archived**
   - Query: `list incomplete non-archived projects created this month`
   - Expected: Shows recent incomplete active projects
   - Verify: All three criteria are met

5. **Coordinates + Archived**
   - Query: `list non-archived projects near 35.067482, -101.395466`
   - Expected: Shows active projects near coordinates
   - Verify: Both criteria are met

6. **All filters combined**
   - Query: `list incomplete non-archived wind projects created this week within 50km of 35.067482, -101.395466`
   - Expected: Shows projects matching all criteria
   - Verify: All filters are applied correctly

**Pass Criteria:**
- ✅ Multiple filters work together correctly
- ✅ Filter order doesn't matter
- ✅ No filter conflicts or errors
- ✅ Results match all specified criteria

---

## Edge Cases

### Edge Case 1: Empty Project List
- Query: `list projects` (when no projects exist)
- Expected: "No projects exist yet. Get started: 'analyze terrain at [latitude], [longitude]'"
- Verify: Helpful onboarding message

### Edge Case 2: Invalid Date Format
- Query: `list projects created on not-a-date`
- Expected: Should handle gracefully, not crash
- Verify: Error message or ignore invalid date

### Edge Case 3: Invalid Coordinates
- Query: `list projects at coordinates 999, 999`
- Expected: Should handle gracefully
- Verify: No results or error message

### Edge Case 4: Projects Without Coordinates
- Query: `list projects near 35.0, -101.0`
- Expected: Only returns projects with coordinates
- Verify: Projects without coordinates are excluded

### Edge Case 5: Projects Without Metadata
- Query: `list archived projects`
- Expected: Projects without metadata treated as non-archived
- Verify: Missing metadata doesn't cause errors

---

## Performance Tests

### Performance Test 1: Large Result Set
- Query: `list projects` (with 100+ projects)
- Expected: Results returned within 2 seconds
- Verify: No timeout or performance issues

### Performance Test 2: Complex Filter Combination
- Query: `list incomplete non-archived wind projects created this year within 100km of 35.0, -101.0`
- Expected: Results returned within 3 seconds
- Verify: All filters applied efficiently

---

## User Experience Tests

### UX Test 1: Search Result Formatting
- Verify search results include:
  - ✅ Project name
  - ✅ Completion percentage
  - ✅ Creation date
  - ✅ Location/coordinates
  - ✅ Status (Complete, Incomplete, etc.)

### UX Test 2: Helpful Error Messages
- Verify error messages include:
  - ✅ Clear explanation of what went wrong
  - ✅ Suggestions for what to try next
  - ✅ Examples of valid queries

### UX Test 3: Filter Feedback
- Verify search results show:
  - ✅ Applied filters
  - ✅ Number of results found
  - ✅ Suggestions if no results

---

## Test Completion Checklist

After completing all tests, verify:

- [ ] All 6 main test scenarios passed
- [ ] All edge cases handled correctly
- [ ] Performance is acceptable
- [ ] User experience is good
- [ ] Error messages are helpful
- [ ] No crashes or errors
- [ ] Results are accurate
- [ ] Filters work in combination

---

## Reporting Results

### If All Tests Pass:
✅ Task 21 is complete!
- Mark task as complete in tasks.md
- Document any observations
- Proceed to task 22

### If Any Tests Fail:
❌ Task 21 needs fixes
- Document which tests failed
- Note expected vs actual behavior
- Report to development team
- Retest after fixes

---

## Notes

- Test with real data when possible
- Verify results manually for accuracy
- Check CloudWatch logs for errors
- Test in deployed environment
- Document any unexpected behavior

