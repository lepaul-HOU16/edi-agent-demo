# Maintenance Agent Deployment Steps

## Current Status

The Maintenance Agent backend infrastructure has been implemented:

✅ **Completed Subtasks:**
- 1.1 ✅ Directory structure created
- 1.2 ✅ MaintenanceStrandsAgent class implemented
- 1.3 ✅ Intent detection implemented
- 1.5 ✅ Maintenance tools (MCP pattern) created
- 1.6 ✅ Handler methods implemented
- 1.8 ✅ Lambda handler created
- 1.9 ✅ CDK resource definition created
- 1.10 ✅ Backend configuration updated
- 1.11 ✅ GraphQL schema updated
- ✅ TypeScript compilation errors fixed

⏳ **In Progress:**
- 1.12 Deploy and Test Backend

⚠️ **Pending (Optional Test Tasks):**
- 1.4 Write Intent Detection Unit Tests
- 1.7 Write Handler Unit Tests

## Recent Fixes

**TypeScript Errors Fixed (Final):**
- ✅ Fixed variable shadowing in `inspectionScheduleHandler.ts` - Renamed parameter from `message` to `userMessage`
- ✅ Fixed variable shadowing in `maintenancePlanningHandler.ts` - Renamed parameter from `message` to `userMessage`
- ✅ TypeScript compilation now passes without errors
- ✅ Verified with `getDiagnostics` - No errors found

## Deployment Required

The maintenance agent code is ready but **NOT YET DEPLOYED** to AWS.

### Step 1: Stop Current Sandbox (if running)

```bash
# Press Ctrl+C in the terminal running the sandbox
```

### Step 2: Deploy Maintenance Agent

```bash
# Start sandbox to deploy all changes
npx ampx sandbox
```

**Expected Output:**
- Sandbox will detect new maintenanceAgent function
- CloudFormation will create the Lambda function
- Environment variables will be configured
- IAM permissions will be granted
- GraphQL schema will be updated

**Wait for:** "Deployed" message (typically 5-10 minutes)

### Step 3: Verify Deployment

```bash
# Run deployment verification script
node tests/test-maintenance-agent-deployment.js
```

**Expected Output:**
```
=== MAINTENANCE AGENT DEPLOYMENT VERIFICATION ===

Step 1: Checking if maintenanceAgent Lambda exists...
✅ Found: amplify-digitalassistant--maintenanceAgentlambda-XXXXX
   Runtime: nodejs20.x
   Memory: 1024MB
   Timeout: 300s

Step 2: Checking function configuration...
Environment Variables:
  ✅ S3_BUCKET: amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m

=== DEPLOYMENT VERIFICATION COMPLETE ===
✅ maintenanceAgent Lambda is deployed and configured
```

### Step 4: Test GraphQL Mutation

```bash
# Run GraphQL mutation test
node tests/test-maintenance-agent-graphql.js
```

**Expected Output:**
```
=== TESTING MAINTENANCE AGENT GRAPHQL MUTATION ===

Test Query: "What is the status of equipment PUMP-001?"

Invoking maintenanceAgent mutation...
✅ Mutation completed in XXXXms

Response Structure Verification:
  success: ✅ true
  message: ✅ Present
  artifacts: ✅ Array (X items)
  thoughtSteps: ✅ Array (X items)
  workflow: ✅ Present
  auditTrail: ✅ Present

=== TEST COMPLETE ===
✅ GraphQL mutation works correctly
✅ Response format matches expected structure
```

### Step 5: Check CloudWatch Logs

```bash
# Get the Lambda function name
aws lambda list-functions --query "Functions[?contains(FunctionName, 'maintenanceAgent')].FunctionName" --output text

# View recent logs
aws logs tail /aws/lambda/<function-name> --follow
```

**Look for:**
- "=== MAINTENANCE AGENT INVOKED ===" log entries
- No error messages
- Successful processing logs

## Troubleshooting

### Issue: Lambda Not Found

**Symptom:** `❌ maintenanceAgent Lambda NOT FOUND`

**Solution:**
1. Verify sandbox is running: `ps aux | grep ampx`
2. Check for deployment errors in sandbox output
3. Restart sandbox: `npx ampx sandbox`
4. Wait for "Deployed" message

### Issue: Environment Variable Missing

**Symptom:** `⚠️ S3_BUCKET environment variable not set`

**Solution:**
1. Check `amplify/functions/maintenanceAgent/resource.ts`
2. Verify environment variable is defined
3. Restart sandbox to apply changes

### Issue: GraphQL Mutation Fails

**Symptom:** GraphQL errors when testing mutation

**Solution:**
1. Check CloudWatch logs for Lambda errors
2. Verify authentication is configured
3. Check GraphQL schema in `amplify/data/resource.ts`
4. Verify function is linked to mutation

### Issue: Permission Errors

**Symptom:** Access denied errors in CloudWatch logs

**Solution:**
1. Check `amplify/backend.ts` for IAM policies
2. Verify S3 permissions are granted
3. Verify Bedrock permissions are granted
4. Restart sandbox to apply permission changes

## Next Steps After Successful Deployment

Once deployment is verified and tests pass:

1. ✅ Mark task 1.12 as complete
2. ✅ Mark task 1 (Backend Infrastructure Setup) as complete
3. Move to task 2: Agent Router Integration
4. Optionally implement unit tests (tasks 1.4 and 1.7)

## Files Created for Testing

- `tests/test-maintenance-agent-deployment.js` - Verifies Lambda deployment
- `tests/test-maintenance-agent-graphql.js` - Tests GraphQL mutation
- `tests/MAINTENANCE_AGENT_DEPLOYMENT_STEPS.md` - This guide

## Requirements Satisfied

This deployment satisfies the following requirements:

- **Requirement 1:** Maintenance Agent Architecture (Strands/AgentCore pattern)
- **Requirement 6:** Backend Lambda Function (dedicated Lambda with proper config)
- **Requirement 7:** GraphQL Schema Integration (invokeMaintenanceAgent mutation)

## Summary

The Maintenance Agent backend infrastructure is **READY FOR DEPLOYMENT**.

All code is implemented and configured. The only remaining step is to:

1. **Deploy via sandbox:** `npx ampx sandbox`
2. **Verify deployment:** `node tests/test-maintenance-agent-deployment.js`
3. **Test functionality:** `node tests/test-maintenance-agent-graphql.js`

Once these steps are complete, the backend infrastructure setup (Task 1) will be finished.
