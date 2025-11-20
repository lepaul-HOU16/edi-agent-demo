# Diagnosis: 503 Service Unavailable - 30 Second Timeout

## Issue Found

**Status:** HTTP 503 Service Unavailable  
**Duration:** 30,150 ms (30 seconds exactly)  
**Root Cause:** API Gateway 30-second timeout limit

## What's Happening

1. ✅ Frontend sends request correctly
2. ✅ API Gateway receives request
3. ✅ Chat Lambda starts processing
4. ✅ Agent Router routes to Renewable Proxy Agent
5. 🟠 Proxy Agent invokes Renewable Orchestrator (synchronously)
6. ❌ **Orchestrator hangs or takes > 30 seconds**
7. ❌ API Gateway times out after 30 seconds
8. ❌ Returns 503 to frontend

## Key Findings

### API Gateway Timeout
- API Gateway has a **hard 30-second timeout limit**
- Cannot be increased
- This is why the request fails at exactly 30 seconds

### Lambda Configuration
- Chat Lambda timeout: 300 seconds (5 minutes) ✅
- Orchestrator timeout: 300 seconds (5 minutes) ✅
- Lambdas are configured correctly

### Synchronous Invocation
The Renewable Proxy Agent invokes the orchestrator **synchronously**:
```typescript
InvocationType: 'RequestResponse', // Waits for results
```

This means:
- Chat Lambda waits for Orchestrator to complete
- If Orchestrator takes > 30 seconds, API Gateway times out
- Entire request fails with 503

## Likely Root Causes

### 1. Tool Lambda Issues (Most Likely)
The orchestrator tries to invoke tool Lambdas:
- `renewable-terrain-simple`
- `renewable-layout-simple`
- `renewable-simulation-simple`

**Possible issues:**
- ❌ Tool Lambdas don't exist
- ❌ Tool Lambdas are misconfigured
- ❌ Tool Lambdas are timing out
- ❌ IAM permissions missing

### 2. Orchestrator Code Issue
- ❌ Infinite loop or hang
- ❌ Waiting for external service that doesn't respond
- ❌ Missing error handling causing hang

### 3. Missing Dependencies
- ❌ Python dependencies not installed
- ❌ Required environment variables missing
- ❌ S3 bucket access issues

## What to Check

### 1. Check if Tool Lambdas Exist
```bash
aws lambda list-functions | grep renewable
```

**Expected:**
- renewable-terrain-simple
- renewable-layout-simple
- renewable-simulation-simple

### 2. Check Orchestrator CloudWatch Logs
```bash
aws logs tail /aws/lambda/EnergyInsights-development-renewable-orchestrator --follow --since 5m
```

**Look for:**
- Did orchestrator start?
- What was it doing when it timed out?
- Any errors or exceptions?
- Was it trying to invoke tool Lambdas?

### 3. Check Tool Lambda Logs
```bash
aws logs tail /aws/lambda/renewable-terrain-simple --follow --since 5m
```

**Look for:**
- Were tool Lambdas invoked?
- Did they complete successfully?
- Any errors?

## Comparison with Pre-Migration

**Before Migration (Amplify Gen 2):**
- Worked correctly
- Returned results quickly

**After Migration (CDK):**
- Times out after 30 seconds
- Returns 503

**What Changed:**
- Lambda function names/ARNs
- IAM permissions
- Environment variables
- Possibly removed critical code

## Next Steps

1. **Check CloudWatch logs** for orchestrator and tool Lambdas
2. **Verify tool Lambdas exist** and are deployed
3. **Check IAM permissions** for Lambda invocations
4. **Compare with pre-migration code** to find what was removed
5. **Test orchestrator directly** (bypass API Gateway timeout)

## Quick Test

Test the orchestrator directly to bypass API Gateway timeout:

```bash
aws lambda invoke \
  --function-name EnergyInsights-development-renewable-orchestrator \
  --payload '{"body":"{\"query\":\"Analyze terrain at 40.7128, -74.0060\"}"}' \
  response.json

cat response.json
```

This will show if the orchestrator itself works or if it's hanging.

## Recommended Fix

Based on findings, likely need to:

1. **Deploy missing tool Lambdas** if they don't exist
2. **Fix orchestrator code** if it's hanging
3. **Add proper error handling** to prevent hangs
4. **Consider async pattern** if analysis takes > 30 seconds:
   - Return immediately with "processing" status
   - Store results in DynamoDB when complete
   - Frontend polls for results

## Critical Question

**Did the migration remove the tool Lambda implementations?**

The orchestrator is configured to call:
- `renewable-terrain-simple`
- `renewable-layout-simple`  
- `renewable-simulation-simple`

But these might not exist or might not be deployed. This would cause the orchestrator to hang waiting for a response that never comes.

**Action:** Check if these Lambdas exist and are properly deployed.
