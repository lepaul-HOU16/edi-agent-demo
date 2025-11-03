# Task 18: Deploy and Test Deduplication Flow - Complete Guide

## Overview

Task 18 focuses on deploying and thoroughly testing the deduplication flow that was implemented in Task 13. This ensures that the system correctly detects duplicate projects, prompts users appropriately, and handles their choices.

**Status:** ✅ Ready for Deployment and Testing

**Requirements Tested:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6

## What Was Implemented (Task 13)

The deduplication flow includes:

1. **ProximityDetector** - Calculates distances between coordinates using Haversine formula
2. **ProjectLifecycleManager** - Manages duplicate detection and user choice handling
3. **Orchestrator Integration** - Checks for duplicates before terrain analysis
4. **User Prompt Generation** - Creates formatted prompts with three options
5. **Choice Handling** - Processes user responses (1, 2, or 3)
6. **Session Context Updates** - Maintains active project and history

## Deployment Steps

### Prerequisites

1. **Sandbox Running:**
   ```bash
   npx ampx sandbox
   ```

2. **Environment Variables Set:**
   - `RENEWABLE_S3_BUCKET` - For project storage
   - `SESSION_CONTEXT_TABLE` - For session management

3. **AWS CLI Configured:**
   ```bash
   aws sts get-caller-identity
   ```

### Deployment Verification

The deduplication code is already deployed as part of the orchestrator Lambda. Verify deployment:

```bash
# Check orchestrator Lambda exists
aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName"

# Check environment variables
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -n 1)
aws lambda get-function-configuration --function-name "$ORCHESTRATOR" --query "Environment.Variables"
```

## Testing Approach

We provide three levels of testing:

### 1. Automated Deployment Test (Recommended First)

Runs comprehensive checks including Lambda invocation:

```bash
./tests/deploy-and-test-deduplication.sh
```

**What it tests:**
- ✅ Orchestrator Lambda deployed and accessible
- ✅ Environment variables configured
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ Verification script passes
- ✅ End-to-end Lambda invocation
- ✅ Duplicate detection works
- ✅ User prompts generated correctly

**Expected output:**
```
═══════════════════════════════════════════════════════════
🚀 TASK 18: Deploy and Test Deduplication Flow
═══════════════════════════════════════════════════════════

📋 Step 1: Checking deployment status...
✅ Found orchestrator: amplify-digitalassistant-renewableOrchestrator-...

📋 Step 2: Verifying lifecycle manager deployment...
✅ Lifecycle manager files present

📋 Step 3: Checking environment variables...
✅ RENEWABLE_S3_BUCKET configured
✅ SESSION_CONTEXT_TABLE configured

...

═══════════════════════════════════════════════════════════
📊 DEPLOYMENT AND TESTING SUMMARY
═══════════════════════════════════════════════════════════
✅ Tests Passed: 8
❌ Tests Failed: 0

🎉 ALL TESTS PASSED!
```

### 2. Automated E2E Test

Tests the complete flow by invoking the deployed Lambda:

```bash
npx tsx tests/e2e-test-deduplication-flow.ts
```

**What it tests:**
- ✅ First terrain analysis (no duplicates)
- ✅ Second analysis detects duplicate
- ✅ User prompt contains all options
- ✅ Choice 1 (continue) works correctly
- ✅ Choice 2 (create new) works correctly
- ✅ Choice 3 (view details) works correctly
- ✅ Proximity threshold (1km) enforced

**Expected output:**
```
═══════════════════════════════════════════════════════════
🧪 TASK 18: End-to-End Deduplication Flow Test
═══════════════════════════════════════════════════════════

📝 Test 1: First terrain analysis (should create project)
✅ PASSED: Project created successfully

📝 Test 2: Second analysis (should detect duplicate)
✅ PASSED: Duplicate detected with all options

...

═══════════════════════════════════════════════════════════
📊 TEST SUMMARY
═══════════════════════════════════════════════════════════

✅ Passed: 6/6
❌ Failed: 0/6
📈 Success Rate: 100%

🎉 ALL TESTS PASSED!
```

### 3. Manual UI Testing

Follow the detailed manual test guide:

```bash
cat tests/e2e-deduplication-manual-test.md
```

**Test scenarios:**
1. Duplicate detection on first analysis
2. User choice - Continue with existing
3. User choice - Create new project
4. User choice - View details
5. Proximity threshold verification
6. Multiple duplicates handling
7. Invalid user choice handling
8. Session context verification

## Requirements Verification Matrix

| Requirement | Description | Test Coverage |
|-------------|-------------|---------------|
| **1.1** | System checks for existing projects within 1km | ✅ Automated + Manual |
| **1.2** | System asks user for choice when duplicate found | ✅ Automated + Manual |
| **1.3** | System sets active project when user continues | ✅ Automated + Manual |
| **1.4** | System creates new project when user chooses | ✅ Automated + Manual |
| **1.5** | Proximity threshold (1km) is configurable | ✅ Automated + Manual |
| **1.6** | System considers projects duplicate within threshold | ✅ Automated + Manual |

## Expected Behavior

### Scenario 1: First Analysis (No Duplicates)

**User Input:**
```
Analyze terrain at 35.067482, -101.395466
```

**Expected Response:**
```
✅ Terrain analysis complete for project: texas-wind-farm

[Terrain analysis artifact displayed]

Next steps:
• Create layout: "Create layout for this project"
• Run simulation: "Run wake simulation"
```

**Verification:**
- ✅ No duplicate prompt shown
- ✅ Project created successfully
- ✅ Terrain analysis completes

### Scenario 2: Duplicate Detection

**User Input:**
```
Analyze terrain at 35.067482, -101.395466
```

**Expected Response:**
```
Found existing project(s) at these coordinates:

1. texas-wind-farm (0.00km away)

Would you like to:
1. Continue with existing project
2. Create new project
3. View existing project details

Please respond with your choice (1, 2, or 3).
```

**Verification:**
- ✅ Duplicate detected
- ✅ All three options shown
- ✅ Distance calculated correctly

### Scenario 3: User Choice - Continue

**User Input:**
```
1
```

**Expected Response:**
```
Continuing with existing project: texas-wind-farm

You can now continue with terrain analysis, layout optimization, or other operations.
```

**Verification:**
- ✅ Active project set to texas-wind-farm
- ✅ Session context updated
- ✅ User can proceed with next operations

### Scenario 4: User Choice - Create New

**User Input:**
```
2
```

**Expected Response:**
```
Creating new project at these coordinates. Please repeat your terrain analysis query to create a new project.
```

**Then user repeats:**
```
Analyze terrain at 35.067482, -101.395466
```

**Expected Response:**
```
✅ Terrain analysis complete for project: texas-wind-farm-2

[Terrain analysis artifact displayed]
```

**Verification:**
- ✅ New project created with suffix
- ✅ Terrain analysis runs for new project
- ✅ Both projects exist at same location

### Scenario 5: User Choice - View Details

**User Input:**
```
3
```

**Expected Response:**
```
Project Details:

1. texas-wind-farm (0.00km away)
   Created: 2025-01-15
   Completion: 25% (1/4 steps)
   Status: Terrain: ✓, Layout: ✗, Simulation: ✗, Report: ✗

2. texas-wind-farm-2 (0.00km away)
   Created: 2025-01-15
   Completion: 25% (1/4 steps)
   Status: Terrain: ✓, Layout: ✗, Simulation: ✗, Report: ✗

Would you like to:
1. Continue with existing project
2. Create new project
```

**Verification:**
- ✅ Project details displayed
- ✅ Completion percentages shown
- ✅ User can make choice after viewing

## Troubleshooting

### Issue: Duplicate Not Detected

**Symptoms:**
- Second analysis at same coordinates doesn't show duplicate prompt
- New project created instead of detecting existing

**Possible Causes:**
1. First project not saved to S3
2. Proximity calculation error
3. Session context not passed

**Debug Steps:**
```bash
# Check S3 for project files
aws s3 ls s3://$RENEWABLE_S3_BUCKET/renewable/projects/

# Check CloudWatch logs
aws logs tail /aws/lambda/$ORCHESTRATOR_FUNCTION --follow

# Look for:
# "🔍 Checking for duplicate projects at:"
# "⚠️  Found X duplicate project(s)"
```

### Issue: User Choice Not Working

**Symptoms:**
- Entering "1", "2", or "3" doesn't trigger expected action
- Error message or no response

**Possible Causes:**
1. Context not passed in follow-up query
2. Session ID mismatch
3. Lifecycle manager error

**Debug Steps:**
```bash
# Check browser console for errors
# Verify session ID in network requests
# Check CloudWatch logs for choice handling

# Look for:
# "🔄 Handling duplicate resolution choice"
# "[ProjectLifecycleManager] Handling duplicate choice: X"
```

### Issue: Session Context Not Updating

**Symptoms:**
- Active project not set after choosing option 1
- Project history not maintained

**Possible Causes:**
1. DynamoDB table not accessible
2. Session context manager error
3. IAM permissions missing

**Debug Steps:**
```bash
# Check DynamoDB table
aws dynamodb scan --table-name $SESSION_CONTEXT_TABLE --limit 5

# Check IAM permissions
aws lambda get-function --function-name $ORCHESTRATOR_FUNCTION --query "Configuration.Role"

# Verify role has DynamoDB permissions
```

## CloudWatch Log Patterns

### Successful Duplicate Detection

```
🔍 Checking for duplicate projects at: {latitude: 35.067482, longitude: -101.395466}
[ProjectLifecycleManager] Detecting duplicates at: {latitude: 35.067482, longitude: -101.395466}
[ProjectLifecycleManager] Found 1 duplicate(s)
⚠️  Found 1 duplicate project(s)
```

### Successful Choice Handling

```
🔄 Handling duplicate resolution choice
[ProjectLifecycleManager] Handling duplicate choice: 1
✅ Resolved to existing project: texas-wind-farm
🆔 PROJECT CONTEXT RESOLUTION
   Active Project: texas-wind-farm
```

### No Duplicates Found

```
🔍 Checking for duplicate projects at: {latitude: 35.077482, longitude: -101.405466}
[ProjectLifecycleManager] Detecting duplicates at: {latitude: 35.077482, longitude: -101.405466}
[ProjectLifecycleManager] Found 0 duplicate(s)
✅ No duplicates found, proceeding with new project
```

## Success Criteria

Task 18 is complete when:

- ✅ All automated tests pass (deploy-and-test-deduplication.sh)
- ✅ All E2E tests pass (e2e-test-deduplication-flow.ts)
- ✅ Manual UI testing confirms all scenarios work
- ✅ CloudWatch logs show correct behavior
- ✅ All six requirements (1.1-1.6) verified
- ✅ No regressions in existing functionality

## Next Steps

After Task 18 is complete:

1. **Mark task as complete** in tasks.md
2. **Proceed to Task 19:** Deploy and test deletion operations
3. **Document any issues** found during testing
4. **Update user documentation** with deduplication workflow

## Quick Reference Commands

```bash
# Run all tests
./tests/deploy-and-test-deduplication.sh

# Run E2E test only
npx tsx tests/e2e-test-deduplication-flow.ts

# Check deployment status
aws lambda list-functions | grep renewableOrchestrator

# View CloudWatch logs
aws logs tail /aws/lambda/$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -n 1) --follow

# Clean up test projects
aws s3 rm s3://$RENEWABLE_S3_BUCKET/renewable/projects/test-dedup- --recursive
```

## Files Created for Task 18

1. **tests/deploy-and-test-deduplication.sh** - Automated deployment and testing script
2. **tests/e2e-test-deduplication-flow.ts** - End-to-end automated test
3. **tests/e2e-deduplication-manual-test.md** - Manual testing guide
4. **tests/TASK_18_DEPLOYMENT_AND_TESTING_GUIDE.md** - This document

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review CloudWatch logs for detailed error messages
3. Run verification script: `npx tsx tests/verify-deduplication-terrain-flow.ts`
4. Check existing test results in tests/ directory
5. Refer to Task 13 implementation documentation

---

**Task 18 Status:** ✅ Ready for Execution

**Last Updated:** 2025-01-15

**Requirements Coverage:** 100% (1.1, 1.2, 1.3, 1.4, 1.5, 1.6)
