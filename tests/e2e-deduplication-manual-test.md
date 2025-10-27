# Task 18: End-to-End Deduplication Flow Manual Test Guide

## Overview
This guide provides step-by-step instructions for manually testing the deduplication flow in the deployed environment.

**Requirements Tested:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6

## Prerequisites
- Sandbox deployed and running: `npx ampx sandbox`
- Chat interface accessible
- Browser developer console open (F12)

## Test Scenario 1: Duplicate Detection on First Analysis

### Step 1: Create Initial Project
1. Open the chat interface
2. Enter query: `Analyze terrain at 35.067482, -101.395466`
3. Wait for response

**Expected Result:**
- ✅ Terrain analysis completes successfully
- ✅ Project is created (check response for project name)
- ✅ No duplicate prompt shown (first time at this location)

**Verification:**
```javascript
// In browser console:
console.log('Check response metadata for project name');
```

### Step 2: Attempt Duplicate Analysis
1. In the same chat session, enter: `Analyze terrain at 35.067482, -101.395466`
2. Observe the response

**Expected Result (Requirement 1.1, 1.2):**
- ✅ System detects existing project within 1km
- ✅ User prompt displayed with three options:
  ```
  Found existing project(s) at these coordinates:
  
  1. [project-name] (0.00km away)
  
  Would you like to:
  1. Continue with existing project
  2. Create new project
  3. View existing project details
  
  Please respond with your choice (1, 2, or 3).
  ```

**Verification:**
- Message contains "Found existing project"
- Message contains all three numbered options
- Distance shown is < 1km

## Test Scenario 2: User Choice - Continue with Existing

### Step 1: Choose Option 1
1. After seeing duplicate prompt, enter: `1`
2. Wait for response

**Expected Result (Requirement 1.3, 1.4):**
- ✅ System responds: "Continuing with existing project: [project-name]"
- ✅ Session context updated (active project set)
- ✅ User can proceed with next operations (layout, simulation, etc.)

**Verification:**
```javascript
// In browser console, check session storage:
console.log('Active project:', sessionStorage.getItem('activeProject'));
```

### Step 2: Verify Context Persistence
1. Enter: `Show project details`
2. Verify the active project is the one you continued with

**Expected Result:**
- ✅ Details shown for the correct project
- ✅ Project history includes the project

## Test Scenario 3: User Choice - Create New Project

### Step 1: Trigger Duplicate Detection Again
1. In a NEW chat session, enter: `Analyze terrain at 35.067482, -101.395466`
2. Wait for duplicate prompt

### Step 2: Choose Option 2
1. Enter: `2`
2. Wait for response

**Expected Result (Requirement 1.4):**
- ✅ System responds: "Creating new project at these coordinates"
- ✅ System prompts: "Please repeat your terrain analysis query to create a new project"

### Step 3: Create New Project
1. Enter: `Analyze terrain at 35.067482, -101.395466` again
2. Wait for analysis to complete

**Expected Result:**
- ✅ New project created with numbered suffix (e.g., "texas-wind-farm-2")
- ✅ Terrain analysis completes for new project
- ✅ Both projects now exist at same location

**Verification:**
1. Enter: `List my projects`
2. Verify both projects are listed

## Test Scenario 4: User Choice - View Details

### Step 1: Trigger Duplicate Detection
1. In a NEW chat session, enter: `Analyze terrain at 35.067482, -101.395466`
2. Wait for duplicate prompt

### Step 2: Choose Option 3
1. Enter: `3`
2. Wait for response

**Expected Result (Requirement 1.3):**
- ✅ System displays project details:
  ```
  Project Details:
  
  1. [project-name-1] (0.00km away)
     Created: [date]
     Completion: [X]% (Y/4 steps)
     Status: Terrain: ✓, Layout: ✗, Simulation: ✗, Report: ✗
  
  2. [project-name-2] (0.00km away)
     Created: [date]
     Completion: [X]% (Y/4 steps)
     Status: Terrain: ✓, Layout: ✗, Simulation: ✗, Report: ✗
  
  Would you like to:
  1. Continue with existing project
  2. Create new project
  ```

### Step 3: Make Choice After Viewing
1. Enter: `1` or `2`
2. Verify appropriate action is taken

## Test Scenario 5: Proximity Threshold (1km)

### Step 1: Test Within Threshold
1. Enter: `Analyze terrain at 35.067482, -101.395466`
2. Verify duplicate detected (distance ~0km)

### Step 2: Test Outside Threshold
1. Enter: `Analyze terrain at 35.077482, -101.405466` (approximately 1.5km away)
2. Wait for response

**Expected Result (Requirement 1.5, 1.6):**
- ✅ No duplicate prompt shown
- ✅ New project created at new location
- ✅ System only considers projects within 1km as duplicates

**Verification:**
- Check distance calculation in response
- Verify new project created without prompt

## Test Scenario 6: Multiple Duplicates

### Step 1: Create Multiple Projects at Same Location
1. Create 3 projects at 35.067482, -101.395466 (using option 2 each time)

### Step 2: Trigger Duplicate Detection
1. Enter: `Analyze terrain at 35.067482, -101.395466`
2. Observe duplicate prompt

**Expected Result:**
- ✅ All projects within 1km are listed
- ✅ Distances shown for each project
- ✅ User can choose which project to continue with

## Test Scenario 7: Invalid User Choice

### Step 1: Trigger Duplicate Detection
1. Enter: `Analyze terrain at 35.067482, -101.395466`
2. Wait for duplicate prompt

### Step 2: Enter Invalid Choice
1. Enter: `invalid` or `5` or any non-1/2/3 value
2. Wait for response

**Expected Result:**
- ✅ System responds: "Invalid choice. Creating new project."
- ✅ System proceeds with creating new project (safe default)

## Test Scenario 8: Session Context Verification

### Step 1: Continue with Existing Project
1. Trigger duplicate detection
2. Choose option 1 (continue)

### Step 2: Verify Active Project
1. Enter: `What's my active project?` or `Show project details`
2. Verify correct project is active

### Step 3: Verify Project History
1. Continue with multiple projects in same session
2. Enter: `List my projects`
3. Verify project history is maintained

**Expected Result (Requirement 1.4):**
- ✅ Active project correctly set
- ✅ Project history includes all accessed projects
- ✅ Session context persists across queries

## CloudWatch Logs Verification

### Check Orchestrator Logs
1. Open AWS CloudWatch Console
2. Navigate to Log Groups
3. Find orchestrator Lambda log group
4. Search for recent invocations

**Look for:**
```
🔍 Checking for duplicate projects at: {latitude, longitude}
⚠️  Found X duplicate project(s)
✅ Resolved to existing project: [name]
🆕 Generated new project name: [name]
```

### Check Lifecycle Manager Logs
**Look for:**
```
[ProjectLifecycleManager] Detecting duplicates at: {coordinates}
[ProjectLifecycleManager] Found X duplicate(s)
[ProjectLifecycleManager] Handling duplicate choice: 1/2/3
```

## Success Criteria

All tests must pass:
- ✅ Duplicate detection works within 1km radius
- ✅ User prompt displays with all three options
- ✅ Option 1 (continue) sets active project correctly
- ✅ Option 2 (create new) creates new project with suffix
- ✅ Option 3 (view details) shows project information
- ✅ Session context updates correctly
- ✅ Projects outside 1km radius not detected as duplicates
- ✅ Invalid choices handled gracefully

## Troubleshooting

### Duplicate Not Detected
**Possible causes:**
- Projects not saved to S3 correctly
- Proximity calculation error
- Session context not passed correctly

**Debug steps:**
1. Check S3 bucket for project files
2. Verify coordinates in project data
3. Check CloudWatch logs for proximity calculation

### User Choice Not Working
**Possible causes:**
- Context not passed in follow-up query
- Session ID mismatch
- Lifecycle manager not handling choice correctly

**Debug steps:**
1. Check browser console for errors
2. Verify session ID in requests
3. Check CloudWatch logs for choice handling

### Session Context Not Updating
**Possible causes:**
- DynamoDB table not accessible
- Session context manager error
- Session ID not consistent

**Debug steps:**
1. Check DynamoDB table for session records
2. Verify IAM permissions for DynamoDB
3. Check session ID consistency in logs

## Cleanup

After testing, clean up test projects:
1. Enter: `List my projects`
2. For each test project: `Delete project [name]`
3. Confirm deletion: `yes`

## Reporting Results

Document test results:
- ✅ All scenarios passed
- ⚠️  Scenarios with issues (describe)
- 📋 CloudWatch log excerpts
- 🐛 Any bugs discovered
- 💡 Suggestions for improvement

## Next Steps

After successful testing:
1. Mark Task 18 as complete
2. Proceed to Task 19 (Deploy and test deletion operations)
3. Update documentation with any findings
4. Share results with team
