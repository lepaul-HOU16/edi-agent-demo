# Manual E2E Testing Guide - Deletion Operations (Task 19)

## Overview
This guide provides step-by-step manual testing procedures for validating deletion operations in the deployed environment.

**Requirements Tested:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7

---

## Prerequisites

1. ✅ Sandbox is running: `npx ampx sandbox`
2. ✅ Chat interface is accessible
3. ✅ You have at least 2-3 test projects created
4. ✅ AWS CLI is configured for S3 verification

---

## Test Scenario 1: Single Project Deletion with Confirmation (Req 2.1)

### Steps:
1. Open chat interface
2. Type: `delete project test-project-1`
3. **Expected:** System asks for confirmation:
   ```
   Are you sure you want to delete 'test-project-1'? 
   This will remove all analysis data. Type 'yes' to confirm.
   ```
4. Type: `no` or `cancel`
5. **Expected:** Deletion cancelled, project still exists
6. Type: `delete project test-project-1` again
7. Type: `yes`
8. **Expected:** 
   ```
   Project 'test-project-1' has been deleted.
   ```

### Verification:
- [ ] Confirmation prompt displayed correctly
- [ ] Cancellation works (project not deleted)
- [ ] Confirmation works (project deleted)
- [ ] Success message displayed

---

## Test Scenario 2: Delete Non-Existent Project (Req 2.2)

### Steps:
1. Type: `delete project nonexistent-project-xyz`
2. **Expected:**
   ```
   Project 'nonexistent-project-xyz' not found.
   ```

### Verification:
- [ ] Error message displayed
- [ ] No system errors or crashes
- [ ] Helpful error message

---

## Test Scenario 3: Delete Active Project (Req 2.4)

### Steps:
1. Create a new project: `analyze terrain at 35.0, -101.0`
2. Wait for project creation
3. Verify active project is set (should see project name in context)
4. Type: `delete project [project-name]` (use the name from step 2)
5. Confirm deletion: `yes`
6. **Expected:** Project deleted and active project cleared
7. Type: `what is my current project?`
8. **Expected:** No active project or "You don't have an active project"

### Verification:
- [ ] Active project deleted successfully
- [ ] Session context cleared
- [ ] No active project after deletion
- [ ] Can create new project after deletion

---

## Test Scenario 4: Delete In-Progress Project (Req 2.7)

### Steps:
1. Start a terrain analysis: `analyze terrain at 35.1, -101.1`
2. **Immediately** (while processing): `delete project [project-name]`
3. **Expected:**
   ```
   Cannot delete 'project-name' because it is currently being processed.
   Please wait for the operation to complete.
   ```
4. Wait for analysis to complete
5. Try deletion again: `delete project [project-name]`
6. Confirm: `yes`
7. **Expected:** Deletion succeeds now

### Verification:
- [ ] In-progress project deletion prevented
- [ ] Helpful error message
- [ ] Deletion works after completion
- [ ] No data corruption

---

## Test Scenario 5: Bulk Deletion with Pattern (Req 2.6)

### Setup:
Create multiple test projects:
- `test-bulk-1`
- `test-bulk-2`
- `test-bulk-3`
- `keep-this-one`

### Steps:
1. Type: `delete all projects matching test-bulk`
2. **Expected:** System lists matching projects:
   ```
   Found 3 projects matching 'test-bulk':
   - test-bulk-1
   - test-bulk-2
   - test-bulk-3
   
   Are you sure you want to delete these 3 projects? Type 'yes' to confirm.
   ```
3. Type: `yes`
4. **Expected:**
   ```
   Deleted 3 projects successfully.
   ```
5. Verify: `list all projects`
6. **Expected:** Only `keep-this-one` remains

### Verification:
- [ ] Pattern matching works correctly
- [ ] All matching projects listed before deletion
- [ ] Confirmation required
- [ ] All matching projects deleted
- [ ] Non-matching projects preserved

---

## Test Scenario 6: S3 Deletion Verification (Req 2.3)

### Steps:
1. Create a test project: `analyze terrain at 35.2, -101.2`
2. Wait for completion
3. Note the project name
4. Check S3 before deletion:
   ```bash
   aws s3 ls s3://[your-bucket]/renewable/projects/ --recursive | grep [project-name]
   ```
5. Delete the project: `delete project [project-name]`
6. Confirm: `yes`
7. Check S3 after deletion:
   ```bash
   aws s3 ls s3://[your-bucket]/renewable/projects/ --recursive | grep [project-name]
   ```
8. **Expected:** No files found for deleted project

### Verification:
- [ ] Project files exist in S3 before deletion
- [ ] Project files removed from S3 after deletion
- [ ] No orphaned files left behind
- [ ] S3 deletion completes successfully

---

## Test Scenario 7: Bulk Deletion with Partial Failures (Req 2.6)

### Setup:
Create projects:
- `test-fail-1` (normal)
- `test-fail-2` (set to in_progress manually if possible)
- `test-fail-3` (normal)

### Steps:
1. Type: `delete all projects matching test-fail`
2. Confirm: `yes`
3. **Expected:** Partial success message:
   ```
   Deleted 2 of 3 projects.
   Failed to delete:
   - test-fail-2: Cannot delete project currently being processed
   ```

### Verification:
- [ ] Partial deletion succeeds
- [ ] Failed deletions reported
- [ ] Reasons for failures provided
- [ ] Successfully deleted projects are gone
- [ ] Failed projects remain

---

## Test Scenario 8: Delete and Recreate (Cache Invalidation - Req 2.5)

### Steps:
1. Create project: `analyze terrain at 35.3, -101.3`
2. Note the project name
3. Delete it: `delete project [project-name]`
4. Confirm: `yes`
5. Immediately create new project at same location: `analyze terrain at 35.3, -101.3`
6. **Expected:** New project created (not reusing deleted one)
7. **Expected:** No errors about duplicate or existing project

### Verification:
- [ ] Deleted project not found in cache
- [ ] New project created successfully
- [ ] No confusion between old and new project
- [ ] Cache properly invalidated

---

## Test Scenario 9: Natural Language Variations (Req 10.1)

### Steps:
Test these variations:
1. `remove project test-project`
2. `get rid of test-project`
3. `trash test-project`
4. `delete test-project`

### Expected:
All variations should trigger deletion flow with confirmation

### Verification:
- [ ] "remove" works
- [ ] "get rid of" works
- [ ] "trash" works
- [ ] "delete" works
- [ ] All show same confirmation prompt

---

## Test Scenario 10: Error Recovery

### Steps:
1. Type: `delete project`  (missing project name)
2. **Expected:** Error asking for project name
3. Type: `delete project test-1 test-2` (multiple names)
4. **Expected:** Error or clarification request
5. Type: `delete project test-1` (correct format)
6. **Expected:** Normal deletion flow

### Verification:
- [ ] Missing parameter handled gracefully
- [ ] Invalid format handled gracefully
- [ ] Helpful error messages
- [ ] Can recover and complete deletion

---

## Completion Checklist

### All Requirements Tested:
- [ ] 2.1: Confirmation prompt before deletion
- [ ] 2.2: Project existence validation
- [ ] 2.3: S3 deletion via ProjectStore
- [ ] 2.4: Session context update when active project deleted
- [ ] 2.5: Resolver cache clearing
- [ ] 2.6: Bulk deletion with pattern matching
- [ ] 2.7: In-progress project check

### All Scenarios Passed:
- [ ] Scenario 1: Single deletion with confirmation
- [ ] Scenario 2: Non-existent project
- [ ] Scenario 3: Delete active project
- [ ] Scenario 4: In-progress project
- [ ] Scenario 5: Bulk deletion
- [ ] Scenario 6: S3 verification
- [ ] Scenario 7: Partial failures
- [ ] Scenario 8: Cache invalidation
- [ ] Scenario 9: Natural language
- [ ] Scenario 10: Error recovery

### Issues Found:
```
[Document any issues discovered during testing]
```

### Notes:
```
[Add any additional observations or recommendations]
```

---

## Sign-Off

**Tester:** ___________________  
**Date:** ___________________  
**Status:** ⬜ PASS  ⬜ FAIL  ⬜ PASS WITH ISSUES

**Task 19 Status:** ⬜ COMPLETE  ⬜ NEEDS FIXES
