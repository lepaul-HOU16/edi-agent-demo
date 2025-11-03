# Orchestrator Invocation Flow Test

## Overview

This document describes the comprehensive test suite for validating the orchestrator invocation flow. The test ensures that the renewable energy orchestrator is properly invoked, calls the terrain Lambda, and returns responses with unique project IDs.

## Test Objectives

The test validates the following requirements:

### Requirement 1.1, 1.2, 1.3: Diagnose Orchestrator Invocation Flow
- ✅ Verify orchestrator Lambda is deployed and accessible
- ✅ Confirm orchestrator is invoked (not bypassed)
- ✅ Validate orchestrator calls terrain Lambda with proper parameters

### Requirement 2.1, 2.2, 2.3: Fix Project ID Generation
- ✅ Verify unique project ID is generated for each analysis
- ✅ Confirm project ID is not "default-project"
- ✅ Validate project ID appears in response metadata

## Test Components

### 1. Deployment Validation Script
**File**: `scripts/deploy-and-test-orchestrator.sh`

Bash script that:
- Checks if sandbox environment is running
- Discovers deployed Lambda function names
- Exports environment variables for test script
- Executes the test suite
- Reports results with color-coded output

**Usage**:
```bash
# Terminal 1: Start sandbox
npx ampx sandbox

# Terminal 2: Run test
./scripts/deploy-and-test-orchestrator.sh
```

### 2. Orchestrator Invocation Flow Test
**File**: `scripts/test-orchestrator-invocation-flow.js`

Node.js test script that performs comprehensive validation:

#### Test Steps

**Step 1: Deployment Status Check**
- Verifies orchestrator Lambda exists using `GetFunctionCommand`
- Verifies terrain tool Lambda exists
- Logs function ARNs, runtimes, and timeout settings
- **Pass Criteria**: Both functions are deployed and accessible

**Step 2: Orchestrator Invocation**
- Invokes orchestrator with test terrain analysis query
- Measures invocation duration
- Captures response payload
- **Pass Criteria**: Orchestrator responds successfully within timeout

**Step 3: CloudWatch Logs - Orchestrator**
- Searches for key log patterns in orchestrator logs:
  - `ORCHESTRATOR ENTRY POINT` - Confirms orchestrator was invoked
  - `INTENT DETECTION RESULTS` - Validates intent routing
  - `TOOL LAMBDA INVOCATION` - Confirms tool Lambda call
  - `TOOL LAMBDA RESPONSE` - Validates tool response received
  - `PROJECT ID GENERATION` - Confirms project ID creation
  - `FINAL RESPONSE STRUCTURE` - Validates response formatting
- **Pass Criteria**: All key log patterns found in recent logs

**Step 4: CloudWatch Logs - Terrain Lambda**
- Searches terrain Lambda logs for invocation records
- Confirms invocation was triggered by orchestrator
- **Pass Criteria**: Terrain Lambda was invoked by orchestrator

**Step 5: Response Validation**
- Validates response structure (success, message, artifacts)
- Extracts and validates project ID
- Confirms project ID is unique (not "default-project")
- Validates project ID format
- **Pass Criteria**: Response is valid with unique project ID

## Test Configuration

```javascript
const TEST_CONFIG = {
  orchestratorFunctionName: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME,
  terrainFunctionName: process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME,
  testQuery: 'Analyze terrain for wind farm at coordinates 35.067482, -101.395466 with 5km radius',
  timeoutMs: 90000, // 90 seconds
  logWaitMs: 5000, // Wait 5 seconds for logs to propagate
};
```

## Expected Output

### Successful Test Run

```
═══════════════════════════════════════════════════════════
🧪 ORCHESTRATOR INVOCATION FLOW TEST
═══════════════════════════════════════════════════════════
📋 Test Query: Analyze terrain for wind farm at coordinates 35.067482, -101.395466 with 5km radius
⏰ Started: 2025-01-08T10:30:00.000Z
═══════════════════════════════════════════════════════════

───────────────────────────────────────────────────────────
📦 STEP 1: Checking Deployment Status
───────────────────────────────────────────────────────────
✅ Orchestrator deployed: renewableOrchestrator-sandbox-abc123
   ARN: arn:aws:lambda:us-west-2:123456789012:function:renewableOrchestrator-sandbox-abc123
   Runtime: nodejs20.x
   Timeout: 300s
✅ Terrain tool deployed: renewableTerrainTool-sandbox-abc123
   ARN: arn:aws:lambda:us-west-2:123456789012:function:renewableTerrainTool-sandbox-abc123
   Runtime: python3.12
   Timeout: 300s

───────────────────────────────────────────────────────────
🚀 STEP 2: Invoking Orchestrator
───────────────────────────────────────────────────────────
📤 Payload: {
  "query": "Analyze terrain for wind farm at coordinates 35.067482, -101.395466 with 5km radius",
  "userId": "test-user",
  "sessionId": "test-session-1704710400000",
  "context": {}
}
✅ Orchestrator invoked successfully
   Duration: 2345ms
   Status Code: 200
   Function Error: None
📥 Response Preview:
   Success: true
   Message: Terrain analysis completed successfully...
   Artifact Count: 1
   Thought Steps: 4

⏳ Waiting 5000ms for logs to propagate...

───────────────────────────────────────────────────────────
📋 STEP 3: Checking Orchestrator CloudWatch Logs
───────────────────────────────────────────────────────────
📊 Found 3 recent log streams
✅ Found "ORCHESTRATOR ENTRY POINT" in logs (1 occurrences)
✅ Found "INTENT DETECTION RESULTS" in logs (1 occurrences)
✅ Found "TOOL LAMBDA INVOCATION" in logs (1 occurrences)
✅ Found "TOOL LAMBDA RESPONSE" in logs (1 occurrences)
✅ Found "PROJECT ID GENERATION" in logs (1 occurrences)
✅ Found "FINAL RESPONSE STRUCTURE" in logs (1 occurrences)

✅ Orchestrator invocation confirmed in CloudWatch logs

───────────────────────────────────────────────────────────
🗺️  STEP 4: Checking Terrain Lambda CloudWatch Logs
───────────────────────────────────────────────────────────
📊 Found 2 recent log streams
✅ Terrain Lambda was invoked (1 invocations)
✅ Terrain Lambda was invoked BY orchestrator

───────────────────────────────────────────────────────────
✅ STEP 5: Validating Response Structure
───────────────────────────────────────────────────────────
✅ All required fields present
✅ Artifacts is an array (1 artifacts)
✅ Project ID found: terrain-1704710400000-abc123
✅ Project ID is unique (not "default-project")
✅ Project ID format is valid

═══════════════════════════════════════════════════════════
📊 TEST RESULTS SUMMARY
═══════════════════════════════════════════════════════════

✅ PASS - Deployment Check
   All Lambda functions are deployed and accessible

✅ PASS - Orchestrator Invocation
   Orchestrator invoked successfully in 2345ms

✅ PASS - Terrain Lambda Invocation
   Terrain Lambda invoked 1 times (invoked by orchestrator)

✅ PASS - Project ID Generation
   Unique project ID generated: terrain-1704710400000-abc123

✅ PASS - Response Validation
   Response structure is valid

───────────────────────────────────────────────────────────
📈 Overall: 5/5 tests passed
✅ ALL TESTS PASSED
═══════════════════════════════════════════════════════════

📋 Orchestrator Log Patterns Found:
   - ORCHESTRATOR ENTRY POINT: 1 occurrences
   - INTENT DETECTION RESULTS: 1 occurrences
   - TOOL LAMBDA INVOCATION: 1 occurrences
   - TOOL LAMBDA RESPONSE: 1 occurrences
   - PROJECT ID GENERATION: 1 occurrences
   - FINAL RESPONSE STRUCTURE: 1 occurrences

🆔 Project ID: terrain-1704710400000-abc123

⏰ Completed: 2025-01-08T10:30:15.000Z
═══════════════════════════════════════════════════════════
```

## Troubleshooting

### Test Failure: Orchestrator Not Found

**Symptom**: Deployment check fails with "ResourceNotFoundException"

**Solution**:
1. Ensure sandbox is running: `npx ampx sandbox`
2. Wait for deployment to complete (check sandbox logs)
3. Verify function name in AWS Lambda console

### Test Failure: Orchestrator Entry Point Not Found in Logs

**Symptom**: Step 3 fails to find "ORCHESTRATOR ENTRY POINT" pattern

**Possible Causes**:
1. **Orchestrator Bypassed**: RenewableProxyAgent is not calling orchestrator
2. **Validation Failed**: Pre-flight validation rejected the request
3. **Log Delay**: Logs haven't propagated yet (increase `logWaitMs`)

**Solution**:
1. Check RenewableProxyAgent logs for validation errors
2. Verify environment variable `RENEWABLE_ORCHESTRATOR_FUNCTION_NAME` is set
3. Increase log wait time to 10 seconds

### Test Failure: Project ID is "default-project"

**Symptom**: Step 5 fails with "Project ID is 'default-project'"

**Possible Causes**:
1. Orchestrator not generating project ID
2. Project ID not passed to tool Lambda
3. Tool Lambda using fallback project ID

**Solution**:
1. Check orchestrator logs for "PROJECT ID GENERATION" pattern
2. Verify project ID is included in tool Lambda payload
3. Review tool Lambda logs for project ID handling

### Test Failure: Terrain Lambda Not Invoked

**Symptom**: Step 4 fails to find terrain Lambda invocation

**Possible Causes**:
1. Orchestrator failed before calling tool Lambda
2. Tool Lambda function name not configured
3. IAM permissions missing for Lambda invocation

**Solution**:
1. Check orchestrator logs for errors
2. Verify `RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME` environment variable
3. Check IAM role has `lambda:InvokeFunction` permission

## CloudWatch Log Links

After running the test, you can view detailed logs in CloudWatch:

### Orchestrator Logs
```
https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252F<ORCHESTRATOR_FUNCTION_NAME>
```

### Terrain Tool Logs
```
https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252F<TERRAIN_FUNCTION_NAME>
```

## Integration with Task Workflow

This test is part of **Task 14** in the orchestrator fix specification:

**Previous Tasks**:
- Task 1-13: Implementation of logging, validation, retry logic, diagnostics

**Current Task**:
- Task 14: Test orchestrator invocation flow ✅

**Next Tasks**:
- Task 15: Test feature count restoration
- Task 16: Test loading state completion
- Task 17: Test error scenarios
- Task 18: Run diagnostic panel tests
- Task 19: Document findings and fixes
- Task 20: Deploy and validate in production

## Success Criteria

The test is considered successful when:

1. ✅ All 5 test steps pass
2. ✅ Orchestrator entry point confirmed in logs
3. ✅ Terrain Lambda invoked by orchestrator
4. ✅ Unique project ID generated (not "default-project")
5. ✅ Response structure is valid
6. ✅ No errors in CloudWatch logs

## Manual Verification

After automated tests pass, perform manual verification:

1. **UI Test**: Send terrain analysis query through chat interface
2. **Visual Inspection**: Verify loading indicator appears and disappears
3. **Artifact Rendering**: Confirm terrain map artifact renders correctly
4. **Project ID**: Check project ID in artifact metadata
5. **Feature Count**: Verify feature count matches expected value

## Related Documentation

- [Orchestrator Fix Specification](.kiro/specs/fix-renewable-orchestrator-flow/design.md)
- [Orchestrator Logging Enhancement](./ORCHESTRATOR_LOGGING_ENHANCEMENT.md)
- [Orchestrator Diagnostics Implementation](./ORCHESTRATOR_DIAGNOSTICS_IMPLEMENTATION.md)
- [Response Validation Implementation](./RESPONSE_VALIDATION_IMPLEMENTATION.md)

## Conclusion

This comprehensive test suite validates the complete orchestrator invocation flow, ensuring that:
- The orchestrator is properly deployed and accessible
- The orchestrator is invoked for renewable energy queries (not bypassed)
- The terrain Lambda is called by the orchestrator
- Unique project IDs are generated for each analysis
- Responses are properly structured and validated

The test provides detailed logging and troubleshooting guidance to quickly identify and resolve any issues in the orchestrator flow.
