# Task 25: Test Execution Checklist

Use this checklist to ensure all tests are executed and validated.

## Pre-Execution Checklist

- [ ] Sandbox environment is running (`npx ampx sandbox`)
- [ ] AWS CLI is configured
- [ ] Environment variables are set
- [ ] S3 bucket is accessible
- [ ] All lifecycle components are deployed

## Automated Test Execution

### 1. Run TypeScript Test Suite
```bash
npx jest tests/e2e-test-complete-lifecycle-workflows.ts --verbose
```

**Expected Results:**
- [ ] All tests pass
- [ ] No errors in console
- [ ] Test coverage > 80%

**Test Results:**
- Total Tests: _____
- Passed: _____
- Failed: _____
- Pass Rate: _____%

### 2. Run Deployment Script
```bash
./tests/deploy-and-test-complete-workflows.sh
```

**Expected Results:**
- [ ] Sandbox status verified
- [ ] Environment variables checked
- [ ] Components validated
- [ ] Script completes successfully

**Notes:**
_________________________________
_________________________________

### 3. Run Runtime Validation
```bash
node tests/validate-complete-workflows.js
```

**Expected Results:**
- [ ] Orchestrator Lambda found
- [ ] Workflow 1 tests pass
- [ ] Workflow 2 tests pass
- [ ] Error scenario tests pass
- [ ] Overall pass rate 100%

**Test Results:**
- Workflow 1: _____ passed, _____ failed
- Workflow 2: _____ passed, _____ failed
- Error Scenarios: _____ passed, _____ failed

## Manual Test Execution

Follow: `tests/TASK_25_E2E_WORKFLOW_TESTING_GUIDE.md`

### Workflow 1: Duplicate → Delete → Rename

#### Step 1: Create First Project
- [ ] Command executed: `Analyze terrain at coordinates 35.067482, -101.395466 in Amarillo`
- [ ] Project created successfully
- [ ] Project name noted: _____________________

#### Step 2: Attempt Duplicate
- [ ] Command executed: `Analyze terrain at coordinates 35.067482, -101.395466`
- [ ] Duplicate detection triggered
- [ ] Three options presented
- [ ] Distance shown (~0 km)

#### Step 3: Create New Project
- [ ] Command executed: `Create new project`
- [ ] New project created with suffix
- [ ] Both projects exist

#### Step 4: Delete Old Project
- [ ] Command executed: `Delete project [name]`
- [ ] Confirmation prompt appeared
- [ ] Project NOT deleted yet

#### Step 5: Confirm Deletion
- [ ] Command executed: `yes`
- [ ] Project deleted
- [ ] Confirmation message shown
- [ ] Old project gone from list

#### Step 6: Rename New Project
- [ ] Command executed: `Rename project [old] to [new]`
- [ ] Project renamed
- [ ] New name appears in list
- [ ] Old name gone
- [ ] Data preserved

**Workflow 1 Status:** ☐ PASS ☐ FAIL

**Notes:**
_________________________________
_________________________________

### Workflow 2: Search → Find → Merge

#### Step 1: Create Multiple Projects
- [ ] Created Amarillo project 1
- [ ] Created Amarillo project 2
- [ ] Created Lubbock project
- [ ] All three projects exist

#### Step 2: Search Projects
- [ ] Command executed: `List projects in Amarillo`
- [ ] Found 2 Amarillo projects
- [ ] Lubbock project not shown

#### Step 3: Find Duplicates
- [ ] Command executed: `Show duplicate projects`
- [ ] Duplicate group shown
- [ ] Both Amarillo projects grouped
- [ ] Distance shown (~50m)

#### Step 4: Merge Projects
- [ ] Command executed: `Merge projects [name1] and [name2]`
- [ ] Name choice prompt appeared
- [ ] Both names shown as options

#### Step 5: Choose Name
- [ ] Command executed: `Keep [name]`
- [ ] Projects merged
- [ ] Merged project has combined data
- [ ] Duplicate deleted

**Workflow 2 Status:** ☐ PASS ☐ FAIL

**Notes:**
_________________________________
_________________________________

### Workflow 3: Natural Language Variations

#### Deletion Variations
- [ ] `delete project [name]` - recognized
- [ ] `remove project [name]` - recognized
- [ ] `get rid of [name]` - recognized
- [ ] `trash [name]` - recognized

#### Rename Variations
- [ ] `rename project [old] to [new]` - recognized
- [ ] `change name of [old] to [new]` - recognized
- [ ] `call [old] [new] instead` - recognized

#### List Variations
- [ ] `list projects` - recognized
- [ ] `show projects` - recognized
- [ ] `display projects` - recognized
- [ ] `what are my projects` - recognized

#### Archive Variations
- [ ] `archive project [name]` - recognized
- [ ] `archive [name]` - recognized
- [ ] `move [name] to archive` - recognized

**Workflow 3 Status:** ☐ PASS ☐ FAIL

**Notes:**
_________________________________
_________________________________

### Workflow 4: Confirmation Prompts

#### Single Deletion
- [ ] Deletion command issued
- [ ] Confirmation prompt appeared
- [ ] Clear instructions shown
- [ ] Project NOT deleted without confirmation

#### Bulk Deletion
- [ ] Bulk deletion command issued
- [ ] List of projects shown
- [ ] Count displayed
- [ ] Confirmation required
- [ ] Projects NOT deleted without confirmation

#### Merge Operation
- [ ] Merge command issued
- [ ] Name choice prompt appeared
- [ ] Both names shown
- [ ] Merge NOT performed without choice

**Workflow 4 Status:** ☐ PASS ☐ FAIL

**Notes:**
_________________________________
_________________________________

### Workflow 5: Error Scenarios

#### Project Not Found
- [ ] Command: `Delete project nonexistent-project`
- [ ] Error message: "Project 'nonexistent-project' not found"
- [ ] Helpful suggestion provided
- [ ] System remains functional

#### Name Already Exists
- [ ] Command: `Rename project [old] to [existing]`
- [ ] Error message: "Project name '[existing]' already exists"
- [ ] Suggestion to choose different name
- [ ] Original project unchanged

#### Project In Progress
- [ ] Command: `Delete project [in-progress]`
- [ ] Error message: "Cannot delete - currently being processed"
- [ ] Suggestion to wait
- [ ] Project protected

#### Invalid Coordinates
- [ ] Command: `Analyze terrain at coordinates 999, -999`
- [ ] Error message: "Invalid coordinates"
- [ ] Valid ranges explained
- [ ] No project created

#### Invalid Merge Name
- [ ] Command: `Merge projects [p1] and [p2], keep name [p3]`
- [ ] Error message: "Keep name must be either '[p1]' or '[p2]'"
- [ ] Valid options shown
- [ ] Merge not performed

**Workflow 5 Status:** ☐ PASS ☐ FAIL

**Notes:**
_________________________________
_________________________________

## Post-Execution Verification

### Data Integrity
- [ ] All projects in correct state
- [ ] No orphaned data in S3
- [ ] Session context correct
- [ ] Caches cleared properly

### System Stability
- [ ] No errors in CloudWatch logs
- [ ] No memory leaks
- [ ] No performance degradation
- [ ] System responsive

### User Experience
- [ ] All messages clear
- [ ] Confirmations intuitive
- [ ] Error messages helpful
- [ ] Workflow feels natural

## Overall Test Results

### Summary
- Total Workflows Tested: 5
- Workflows Passed: _____
- Workflows Failed: _____
- Pass Rate: _____%

### Automated Tests
- ☐ PASS ☐ FAIL

### Manual Tests
- ☐ PASS ☐ FAIL

### Runtime Validation
- ☐ PASS ☐ FAIL

## Issues Found

### Issue 1
**Description:** _________________________________
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low
**Status:** ☐ Open ☐ Fixed ☐ Deferred
**Notes:** _________________________________

### Issue 2
**Description:** _________________________________
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low
**Status:** ☐ Open ☐ Fixed ☐ Deferred
**Notes:** _________________________________

### Issue 3
**Description:** _________________________________
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low
**Status:** ☐ Open ☐ Fixed ☐ Deferred
**Notes:** _________________________________

## Sign-Off

### Developer
- Name: _____________________
- Date: _____________________
- Signature: ☐ Approved ☐ Rejected
- Comments: _________________________________

### QA/Tester
- Name: _____________________
- Date: _____________________
- Signature: ☐ Approved ☐ Rejected
- Comments: _________________________________

### Product Manager
- Name: _____________________
- Date: _____________________
- Signature: ☐ Approved ☐ Rejected
- Comments: _________________________________

## Final Status

- ☐ ALL TESTS PASSED - READY FOR PRODUCTION
- ☐ SOME TESTS FAILED - REQUIRES FIXES
- ☐ BLOCKED - CANNOT PROCEED

**Overall Status:** _____________________

**Next Steps:** _________________________________
_________________________________
_________________________________
