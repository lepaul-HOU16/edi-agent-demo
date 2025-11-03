# Manual Testing Guide: Project Merge Operations

**Task 22: Deploy and test merge operations**  
**Requirements: 4.2, 4.3, 4.4**

## Overview

This guide provides step-by-step instructions for manually testing project merge functionality in the deployed environment.

## Prerequisites

- Deployed renewable energy system with project lifecycle management
- Access to chat interface
- At least 2 test projects created at similar locations

## Test Scenarios

### Test 1: Merge Two Projects with Complementary Data

**Objective:** Verify that merging combines data from both projects (Requirement 4.2, 4.3)

**Steps:**

1. **Create first project with terrain analysis:**
   ```
   Analyze terrain at 35.067482, -101.395466
   ```
   - Wait for terrain analysis to complete
   - Note the project name (e.g., "texas-wind-farm-1")

2. **Create second project at nearby location:**
   ```
   Analyze terrain at 35.067500, -101.395500
   ```
   - Wait for terrain analysis to complete
   - Note the project name (e.g., "texas-wind-farm-2")

3. **Add layout to first project:**
   ```
   Optimize layout for texas-wind-farm-1
   ```
   - Wait for layout optimization to complete

4. **Add simulation to second project:**
   ```
   Run wake simulation for texas-wind-farm-2
   ```
   - Wait for simulation to complete

5. **Merge the projects:**
   ```
   Merge projects texas-wind-farm-1 and texas-wind-farm-2
   ```

6. **When prompted for which name to keep, respond:**
   ```
   Keep texas-wind-farm-2
   ```

**Expected Results:**
- ✓ System confirms merge successful
- ✓ Message indicates which project was kept and which was deleted
- ✓ Merged project contains terrain, layout, and simulation data
- ✓ Source project (texas-wind-farm-1) no longer exists

**Verification:**
```
Show project texas-wind-farm-2
```
- Should show terrain data (from project 1)
- Should show layout data (from project 1)
- Should show simulation data (from project 2)

```
Show project texas-wind-farm-1
```
- Should return "Project not found"

---

### Test 2: Merge with Name Selection

**Objective:** Verify that user can choose which project name to keep (Requirement 4.4)

**Steps:**

1. **Create two test projects:**
   ```
   Analyze terrain at 35.1, -101.4
   ```
   Note name as PROJECT_A
   
   ```
   Analyze terrain at 35.1001, -101.4001
   ```
   Note name as PROJECT_B

2. **Merge projects keeping source name:**
   ```
   Merge projects PROJECT_A and PROJECT_B, keep PROJECT_A
   ```

**Expected Results:**
- ✓ System confirms merge
- ✓ PROJECT_A still exists
- ✓ PROJECT_B is deleted
- ✓ PROJECT_A contains data from both projects

**Verification:**
```
List projects
```
- PROJECT_A should be in the list
- PROJECT_B should NOT be in the list

---

### Test 3: Merge Projects with Different Completion Levels

**Objective:** Verify merge works with projects at different stages (Requirement 4.3)

**Steps:**

1. **Create project with only terrain (25% complete):**
   ```
   Analyze terrain at 35.2, -101.5
   ```
   Note name as INCOMPLETE_PROJECT

2. **Create project with full analysis (100% complete):**
   ```
   Analyze terrain at 35.2001, -101.5001
   ```
   Wait for terrain to complete
   
   ```
   Optimize layout for [project-name]
   ```
   Wait for layout to complete
   
   ```
   Run wake simulation for [project-name]
   ```
   Wait for simulation to complete
   
   ```
   Generate report for [project-name]
   ```
   Wait for report to complete
   
   Note name as COMPLETE_PROJECT

3. **Merge the projects:**
   ```
   Merge projects INCOMPLETE_PROJECT and COMPLETE_PROJECT
   ```

**Expected Results:**
- ✓ Merge succeeds despite different completion levels
- ✓ Merged project has all data from complete project
- ✓ No data is lost from either project

**Verification:**
```
Show project COMPLETE_PROJECT
```
- Should show 100% completion
- Should have terrain, layout, simulation, and report

---

### Test 4: Error Handling - Non-Existent Projects

**Objective:** Verify proper error handling for invalid merge attempts

**Steps:**

1. **Attempt to merge non-existent projects:**
   ```
   Merge projects fake-project-1 and fake-project-2
   ```

**Expected Results:**
- ✓ System returns error message
- ✓ Error indicates project not found
- ✓ Suggests using "list projects" to see available projects

---

### Test 5: Error Handling - Invalid Name Selection

**Objective:** Verify validation of keepName parameter (Requirement 4.4)

**Steps:**

1. **Create two test projects:**
   ```
   Analyze terrain at 35.3, -101.6
   ```
   Note name as PROJECT_X
   
   ```
   Analyze terrain at 35.3001, -101.6001
   ```
   Note name as PROJECT_Y

2. **Attempt merge with invalid name:**
   ```
   Merge projects PROJECT_X and PROJECT_Y, keep invalid-name
   ```

**Expected Results:**
- ✓ System returns error
- ✓ Error message indicates keepName must be one of the two project names
- ✓ No projects are modified or deleted

**Verification:**
```
List projects
```
- Both PROJECT_X and PROJECT_Y should still exist

---

### Test 6: Merge Duplicate Projects

**Objective:** Verify merge works in duplicate detection workflow

**Steps:**

1. **Create duplicate projects at same location:**
   ```
   Analyze terrain at 35.067482, -101.395466
   ```
   Note name as DUP_1
   
   ```
   Analyze terrain at 35.067482, -101.395466
   ```
   - System should detect duplicate
   - Choose "Create new project"
   Note name as DUP_2

2. **Find duplicates:**
   ```
   Show duplicate projects
   ```

3. **Merge the duplicates:**
   ```
   Merge projects DUP_1 and DUP_2
   ```

**Expected Results:**
- ✓ Duplicates are identified
- ✓ Merge succeeds
- ✓ Only one project remains
- ✓ Duplicate group no longer appears in duplicate list

**Verification:**
```
Show duplicate projects
```
- Should not show DUP_1 and DUP_2 as duplicates anymore

---

### Test 7: Verify Cache Invalidation

**Objective:** Verify that resolver cache is cleared after merge

**Steps:**

1. **Create and list projects:**
   ```
   List projects
   ```
   Note the project list

2. **Create two new projects:**
   ```
   Analyze terrain at 35.4, -101.7
   ```
   Note name as CACHE_A
   
   ```
   Analyze terrain at 35.4001, -101.7001
   ```
   Note name as CACHE_B

3. **List projects again (loads into cache):**
   ```
   List projects
   ```
   Should show CACHE_A and CACHE_B

4. **Merge projects:**
   ```
   Merge projects CACHE_A and CACHE_B
   ```

5. **List projects immediately after merge:**
   ```
   List projects
   ```

**Expected Results:**
- ✓ Project list is updated immediately
- ✓ Only merged project appears (CACHE_B)
- ✓ Deleted project (CACHE_A) does not appear
- ✓ No stale cache data

---

## Test Checklist

Use this checklist to track your testing progress:

- [ ] Test 1: Merge complementary projects
- [ ] Test 2: Merge with name selection
- [ ] Test 3: Merge different completion levels
- [ ] Test 4: Error - non-existent projects
- [ ] Test 5: Error - invalid name selection
- [ ] Test 6: Merge duplicate projects
- [ ] Test 7: Cache invalidation

## Success Criteria

All tests must pass with the following criteria:

✓ **Data Combination (Requirement 4.3):**
- Merged project contains all non-null data from both projects
- No data is lost during merge
- Metadata is properly combined

✓ **Name Selection (Requirement 4.4):**
- User can choose which project name to keep
- System validates keepName is one of the two project names
- Correct project is deleted based on name selection

✓ **Project Deletion (Requirement 4.2):**
- Source project is deleted after merge
- Only merged project remains
- Deleted project cannot be accessed

✓ **Error Handling:**
- Proper error messages for invalid operations
- No partial state changes on error
- System remains stable after errors

✓ **Cache Management:**
- Resolver cache is cleared after merge
- Subsequent operations use fresh data
- No stale project references

## Troubleshooting

### Issue: Merge fails with "Project not found"
**Solution:** Verify both project names are correct using `list projects`

### Issue: Merged project missing data
**Solution:** Check that both source projects had data before merge

### Issue: Deleted project still appears
**Solution:** Clear browser cache and refresh, or wait for cache TTL

### Issue: Cannot choose project name
**Solution:** Ensure keepName exactly matches one of the project names (case-sensitive)

## Reporting Results

After completing all tests, document:

1. **Test Environment:**
   - Deployment URL
   - Date and time of testing
   - Browser and version

2. **Test Results:**
   - Which tests passed
   - Which tests failed
   - Any unexpected behavior

3. **Issues Found:**
   - Description of issue
   - Steps to reproduce
   - Expected vs actual behavior

4. **Screenshots:**
   - Merge confirmation prompts
   - Success messages
   - Error messages
   - Project listings before and after merge

## Next Steps

After successful testing:

1. Mark task 22 as complete in tasks.md
2. Document any issues found
3. Proceed to task 23 (Archive functionality testing)
4. Update deployment status documentation
