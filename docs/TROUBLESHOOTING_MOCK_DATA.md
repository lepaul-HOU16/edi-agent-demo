# Troubleshooting: Still Getting Mock Data

## Problem

After deploying, renewable energy queries still return mock data with "mock-project-123" instead of real terrain analysis.

## Root Cause

The NEW Lambda-based solution hasn't been fully deployed yet. The system is falling back to mock data because:

1. Lambda functions aren't deployed
2. Lambda functions aren't registered in `amplify/backend.ts`
3. Frontend isn't configured to call the Lambda orchestrator

## Solution Steps

### Step 1: Check What's Currently Deployed

Run the validation script:

```bash
./scripts/check-renewable-lambdas.sh
```

This will show which Lambda functions exist. You should see:
- ✅ `renewableOrchestrator`
- ✅ `renewableTerrainTool`
- ✅ `renewableLayoutTool`
- ✅ `renewableSimulationTool`
- ✅ `renewableReportTool`

If any are missing, proceed to Step 2.

### Step 2: Register Lambda Functions in Backend

Edit `amplify/backend.ts` and add the renewable Lambda functions:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

// Import renewable Lambda functions
import { renewableOrchestrator } from './functions/renewableOrchestrator/resource';
import { renewableTerrainTool } from './functions/renewableTools/terrain/resource';
import { renewableLayoutTool } from './functions/renewableTools/layout/resource';
import { renewableSimulationTool } from './functions/renewableTools/simulation/resource';
import { renewableReportTool } from './functions/renewableTools/report/resource';

import { aws_iam as iam } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  // Add renewable functions here
  renewableOrchestrator,
  renewableTerrainTool,
  renewableLayoutTool,
  renewableSimulationTool,
  renewableReportTool
});

// Grant orchestrator permission to invoke tool Lambdas
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      backend.renewableTerrainTool.resources.lambda.functionArn,
      backend.renewableLayoutTool.resources.lambda.functionArn,
      backend.renewableSimulationTool.resources.lambda.functionArn,
      backend.renewableReportTool.resources.lambda.functionArn
    ]
  })
);

// Grant tool Lambdas permission to access S3
const s3BucketName = process.env.RENEWABLE_S3_BUCKET || backend.storage.resources.bucket.bucketName;
[
  backend.renewableTerrainTool,
  backend.renewableLayoutTool,
  backend.renewableSimulationTool,
  backend.renewableReportTool
].forEach(toolLambda => {
  toolLambda.resources.lambda.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
      resources: [
        `arn:aws:s3:::${s3BucketName}`,
        `arn:aws:s3:::${s3BucketName}/*`
      ]
    })
  );
});

// Pass tool Lambda function names to orchestrator
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
  backend.renewableTerrainTool.resources.lambda.functionName
);
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
  backend.renewableLayoutTool.resources.lambda.functionName
);
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
  backend.renewableSimulationTool.resources.lambda.functionName
);
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_REPORT_TOOL_FUNCTION_NAME',
  backend.renewableReportTool.resources.lambda.functionName
);
```

### Step 3: Deploy Lambda Functions

```bash
npx ampx sandbox --stream-function-logs
```

Wait for deployment to complete. You should see:
```
✅ Deployed: renewableOrchestrator
✅ Deployed: renewableTerrainTool
✅ Deployed: renewableLayoutTool
✅ Deployed: renewableSimulationTool
✅ Deployed: renewableReportTool
```

### Step 4: Configure Frontend to Use Lambda Orchestrator

The frontend has been updated to automatically detect and use the Lambda orchestrator. No additional configuration needed!

The updated `renewableClient.ts` will:
1. Try to invoke `renewableOrchestrator` Lambda
2. Fall back to mock data only if Lambda fails

### Step 5: Test the Lambda Orchestrator Directly

Test the orchestrator Lambda directly to verify it works:

```bash
aws lambda invoke \
  --function-name renewableOrchestrator \
  --payload '{"query":"Analyze terrain for wind farm at 35.067482, -101.395466","userId":"test-user","sessionId":"test-session"}' \
  response.json

cat response.json | jq .
```

Expected output:
```json
{
  "success": true,
  "message": "Terrain analysis completed...",
  "artifacts": [...],
  "thoughtSteps": [...],
  "metadata": {
    "executionTime": 5234,
    "toolsUsed": ["terrain_analysis"],
    "projectId": "project-..."
  }
}
```

### Step 6: Test in Chat UI

1. Open the EDI Platform chat interface
2. Type: "Analyze terrain for wind farm at 35.067482, -101.395466"
3. Check browser console for logs:
   - Should see: "RenewableClient: Invoking Lambda orchestrator"
   - Should NOT see: "using mock response"

### Step 7: Check CloudWatch Logs

If still getting mock data, check CloudWatch logs:

```bash
# Check orchestrator logs
aws logs tail /aws/lambda/renewableOrchestrator --follow

# Check terrain tool logs
aws logs tail /aws/lambda/renewableTerrainTool --follow
```

Look for:
- ✅ "Renewable orchestrator invoked"
- ✅ "Terrain analysis Lambda invoked"
- ❌ Any error messages

## Common Issues

### Issue 1: Lambda Functions Not Deployed

**Symptom**: `check-renewable-lambdas.sh` shows functions don't exist

**Solution**: 
1. Verify functions are registered in `amplify/backend.ts`
2. Run `npx ampx sandbox`
3. Wait for deployment to complete

### Issue 2: Lambda Layer Not Attached

**Symptom**: Lambda logs show "ModuleNotFoundError: No module named 'agents'"

**Solution**:
1. Build Lambda layer: `cd amplify/layers/renewableDemo && ./build.sh`
2. Publish layer: `./scripts/deploy-lambda-layer.sh`
3. Set `RENEWABLE_DEMO_LAYER_ARN` in `.env.local`
4. Redeploy: `npx ampx sandbox`

### Issue 3: Permission Denied

**Symptom**: Lambda logs show "AccessDenied" or "Forbidden"

**Solution**:
1. Check IAM policies in `amplify/backend.ts`
2. Verify orchestrator can invoke tool Lambdas
3. Verify tool Lambdas can access S3
4. Redeploy: `npx ampx sandbox`

### Issue 4: Still Getting Mock Data

**Symptom**: Response contains "mock-project-123"

**Solution**:
1. Check browser console logs
2. Look for "RenewableClient: Invoking Lambda orchestrator"
3. If you see "using mock response", Lambda invocation failed
4. Check CloudWatch logs for the actual error
5. Verify Lambda function name is correct

## Quick Fix: Force Lambda Orchestrator

If you want to force the system to use the Lambda orchestrator, update `.env.local`:

```bash
# Add this to force Lambda orchestrator usage
NEXT_PUBLIC_RENEWABLE_LAMBDA_ENDPOINT=renewableOrchestrator
```

Then restart your dev server:
```bash
npm run dev
```

## Verification Checklist

- [ ] Lambda functions exist (run `./scripts/check-renewable-lambdas.sh`)
- [ ] Lambda functions are registered in `amplify/backend.ts`
- [ ] Lambda layer is built and published
- [ ] `RENEWABLE_DEMO_LAYER_ARN` is set in `.env.local`
- [ ] IAM permissions are configured
- [ ] Deployment completed successfully
- [ ] Browser console shows "Invoking Lambda orchestrator"
- [ ] CloudWatch logs show Lambda execution
- [ ] Response does NOT contain "mock-project-123"
- [ ] Response contains real coordinates (35.067482, -101.395466)

## Expected Behavior After Fix

When working correctly:

1. **Browser Console**:
   ```
   RenewableClient: Invoking Lambda orchestrator
   RenewableClient: Using function name: renewableOrchestrator
   RenewableClient: Lambda orchestrator response: {success: true, artifactCount: 1, ...}
   ```

2. **CloudWatch Logs** (`/aws/lambda/renewableOrchestrator`):
   ```
   Renewable orchestrator invoked: {"query":"Analyze terrain..."}
   Parsed intent: {"type":"terrain_analysis","params":{...}}
   Calling terrain_analysis tool
   ```

3. **CloudWatch Logs** (`/aws/lambda/renewableTerrainTool`):
   ```
   Terrain analysis Lambda invoked
   Analyzing terrain at (35.067482, -101.395466)
   Terrain analysis completed: success=True
   ```

4. **Chat UI**:
   - Shows real coordinates
   - Shows actual exclusion zones
   - Shows Folium map (when visualization is working)
   - NO "mock-project-123" anywhere

## Still Not Working?

If you've followed all steps and still getting mock data:

1. **Check the actual error**:
   ```bash
   aws logs tail /aws/lambda/renewableOrchestrator --follow
   ```

2. **Test Lambda directly**:
   ```bash
   aws lambda invoke --function-name renewableOrchestrator \
     --payload '{"query":"test","userId":"test","sessionId":"test"}' \
     response.json
   ```

3. **Verify Lambda exists**:
   ```bash
   aws lambda get-function --function-name renewableOrchestrator
   ```

4. **Check IAM permissions**:
   ```bash
   aws lambda get-policy --function-name renewableOrchestrator
   ```

5. **Create a GitHub issue** with:
   - Output from `check-renewable-lambdas.sh`
   - CloudWatch logs
   - Browser console logs
   - Lambda test results

## Summary

The mock data issue occurs because the Lambda functions aren't deployed yet. Follow the steps above to:
1. Register Lambda functions in backend
2. Deploy with `npx ampx sandbox`
3. Verify deployment
4. Test in chat UI

After deployment, you'll get REAL terrain analysis data instead of mock data!
