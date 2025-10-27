# Manual Testing Guide for Project Rename Operations

## Task 20: Deploy and Test Rename Operations

This guide provides step-by-step instructions for manually testing the project rename functionality in the deployed environment.

## Prerequisites

- Sandbox is running (`npx ampx sandbox`)
- Chat interface is accessible
- You have access to the renewable energy features

## Test Scenarios

### Test 1: Basic Rename with Valid Names (Requirements 3.1, 3.2, 3.3, 3.5)

**Objective**: Verify that a project can be renamed successfully and all data is preserved.

**Steps**:
1. Create a new project:
   ```
   analyze terrain at 35.067482, -101.395466
   ```
   
2. Wait for terrain analysis to complete

3. Note the project name (e.g., "amarillo-tx-wind-farm")

4. Rename the project:
   ```
   rename project amarillo-tx-wind-farm to test-renamed-project
   ```

5. Verify the response:
   - Should see success message: "Project renamed from 'amarillo-tx-wind-farm' to 'test-renamed-project'"

6. List projects to verify:
   ```
   list projects
   ```
   - Should see "test-renamed-project" in the list
   - Should NOT see "amarillo-tx-wind-farm" in the list

7. View the renamed project:
   ```
   show project test-renamed-project
   ```
   - Should see all terrain analysis data intact
   - Coordinates should match original (35.067482, -101.395466)

**Expected Results**:
- ✓ Rename succeeds with success message
- ✓ Old project name no longer exists
- ✓ New project name exists with all data
- ✓ Terrain analysis data is preserved
- ✓ Coordinates are preserved

---

### Test 2: Rename to Existing Name (Requirement 3.4)

**Objective**: Verify that renaming to an existing project name is prevented.

**Steps**:
1. Create two projects at different locations:
   ```
   analyze terrain at 35.0, -101.0
   ```
   Wait for completion, note the name (e.g., "project-1")
   
   ```
   analyze terrain at 36.0, -102.0
   ```
   Wait for completion, note the name (e.g., "project-2")

2. Try to rename the first project to the second project's name:
   ```
   rename project project-1 to project-2
   ```

3. Verify the response:
   - Should see error message: "Project name 'project-2' already exists. Please choose a different name."

4. Verify both projects still exist:
   ```
   list projects
   ```
   - Should see both "project-1" and "project-2"

**Expected Results**:
- ✓ Rename fails with appropriate error message
- ✓ Both projects remain unchanged
- ✓ Error message suggests choosing a different name

---

### Test 3: S3 Path Updates (Requirement 3.3)

**Objective**: Verify that S3 paths are updated correctly and data remains accessible.

**Steps**:
1. Create a project with complete analysis:
   ```
   analyze terrain at 35.067482, -101.395466
   ```
   Wait for terrain analysis to complete

2. Continue with layout optimization:
   ```
   optimize layout for [project-name]
   ```
   Wait for layout optimization to complete

3. Note the project name (e.g., "amarillo-wind-farm")

4. Rename the project:
   ```
   rename project amarillo-wind-farm to renamed-complete-project
   ```

5. Verify terrain data is still accessible:
   ```
   show terrain analysis for renamed-complete-project
   ```
   - Should see terrain visualization
   - Should see all features (roads, buildings, etc.)

6. Verify layout data is still accessible:
   ```
   show layout for renamed-complete-project
   ```
   - Should see turbine layout
   - Should see optimization results

**Expected Results**:
- ✓ Rename succeeds
- ✓ Terrain data accessible after rename
- ✓ Layout data accessible after rename
- ✓ All S3 artifacts accessible with new project name
- ✓ Old S3 paths no longer accessible

---

### Test 4: Session Context Updates (Requirement 3.6)

**Objective**: Verify that the active project and session context are updated correctly.

**Steps**:
1. Create a project and make it active:
   ```
   analyze terrain at 35.0, -101.0
   ```
   Wait for completion, note the name (e.g., "active-project")

2. Verify it's the active project:
   ```
   what is my current project?
   ```
   - Should show "active-project"

3. Rename the active project:
   ```
   rename project active-project to renamed-active-project
   ```

4. Check the active project again:
   ```
   what is my current project?
   ```
   - Should show "renamed-active-project" (not "active-project")

5. Continue working with the project:
   ```
   optimize layout for current project
   ```
   - Should work with "renamed-active-project"
   - Should not ask which project to use

**Expected Results**:
- ✓ Active project updated to new name
- ✓ Subsequent operations use new name
- ✓ No confusion about which project is active
- ✓ Session context correctly updated

---

### Test 5: Project History Updates (Requirement 3.6)

**Objective**: Verify that project history is updated with the new name.

**Steps**:
1. Create and work with a project:
   ```
   analyze terrain at 35.0, -101.0
   ```
   Wait for completion, note the name (e.g., "history-project")

2. Do some work with it:
   ```
   optimize layout for history-project
   ```

3. Create another project:
   ```
   analyze terrain at 36.0, -102.0
   ```

4. Rename the first project:
   ```
   rename project history-project to renamed-history-project
   ```

5. Check project history:
   ```
   show my project history
   ```
   - Should see "renamed-history-project" in history
   - Should NOT see "history-project" in history

6. Switch back to the renamed project:
   ```
   switch to renamed-history-project
   ```
   - Should work without errors
   - Should set as active project

**Expected Results**:
- ✓ Project history contains new name
- ✓ Project history does not contain old name
- ✓ Can switch to project using new name
- ✓ History tracking works correctly after rename

---

### Test 6: Name Normalization

**Objective**: Verify that project names are normalized correctly.

**Steps**:
1. Create a project:
   ```
   analyze terrain at 35.0, -101.0
   ```
   Note the name (e.g., "test-project")

2. Rename with spaces and capitals:
   ```
   rename project test-project to My New Project Name
   ```

3. Verify the normalized name:
   - Should see success message with normalized name (e.g., "my-new-project-name")
   - Name should be lowercase with hyphens

4. List projects:
   ```
   list projects
   ```
   - Should see normalized name in list

5. Access project with normalized name:
   ```
   show project my-new-project-name
   ```
   - Should work correctly

**Expected Results**:
- ✓ Name normalized to kebab-case
- ✓ Spaces converted to hyphens
- ✓ Uppercase converted to lowercase
- ✓ Project accessible with normalized name

---

### Test 7: Error Handling - Non-existent Project

**Objective**: Verify error handling for non-existent projects.

**Steps**:
1. Try to rename a project that doesn't exist:
   ```
   rename project non-existent-project to new-name
   ```

2. Verify the response:
   - Should see error message: "Project 'non-existent-project' not found"
   - Should suggest using 'list projects' to see available projects

3. List projects to verify:
   ```
   list projects
   ```
   - Should see available projects
   - Should NOT see "non-existent-project" or "new-name"

**Expected Results**:
- ✓ Error message displayed
- ✓ Helpful suggestion provided
- ✓ No projects created or modified

---

### Test 8: Multiple Sequential Renames

**Objective**: Verify that a project can be renamed multiple times.

**Steps**:
1. Create a project:
   ```
   analyze terrain at 35.0, -101.0
   ```
   Note the name (e.g., "original-name")

2. Rename it:
   ```
   rename project original-name to version-2
   ```

3. Rename it again:
   ```
   rename project version-2 to version-3
   ```

4. Rename it one more time:
   ```
   rename project version-3 to final-name
   ```

5. List projects:
   ```
   list projects
   ```
   - Should see only "final-name"
   - Should NOT see "original-name", "version-2", or "version-3"

6. Verify data integrity:
   ```
   show project final-name
   ```
   - Should see all original terrain data
   - Coordinates should match original

**Expected Results**:
- ✓ All renames succeed
- ✓ Only final name exists
- ✓ Intermediate names cleaned up
- ✓ Original data preserved through all renames

---

## Test Completion Checklist

After completing all tests, verify:

- [ ] Test 1: Basic rename works correctly
- [ ] Test 2: Duplicate names prevented
- [ ] Test 3: S3 paths updated correctly
- [ ] Test 4: Session context updated
- [ ] Test 5: Project history updated
- [ ] Test 6: Name normalization works
- [ ] Test 7: Error handling works
- [ ] Test 8: Sequential renames work

## Reporting Issues

If any test fails, document:
1. Which test failed
2. Expected behavior
3. Actual behavior
4. Error messages (if any)
5. Steps to reproduce

## Success Criteria

All tests should pass with:
- ✓ Correct success/error messages
- ✓ Data preservation
- ✓ S3 path updates
- ✓ Session context updates
- ✓ Project history updates
- ✓ Proper error handling

## Next Steps

After all tests pass:
1. Mark Task 20 as complete in tasks.md
2. Document any issues found
3. Proceed to Task 21 (Search functionality testing)
