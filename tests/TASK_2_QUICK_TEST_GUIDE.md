# Task 2: Quick Test Guide

## After Deployment Testing

Once you've deployed the changes with `npx ampx sandbox`, use this guide to quickly verify Task 2 is working.

## Quick Test Commands

### 1. Verify Environment Variables
```bash
# Get simulation Lambda name
SIMULATION_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)

# Check environment variables
aws lambda get-function-configuration \
  --function-name "$SIMULATION_LAMBDA" \
  --query "Environment.Variables" \
  --output json | grep -E "RENEWABLE_S3_BUCKET|S3_BUCKET"
```

**Expected**: Both variables should be set to the Amplify storage bucket name

### 2. Run Integration Test
```bash
node tests/test-wake-simulation-s3-retrieval.js
```

**Expected Results**:
- ✅ Test 1: S3 Layout Retrieval - PASS
- ✅ Test 2: Missing Layout Error Handling - PASS
- ✅ Test 3: Layout Source Logging - PASS

### 3. Check CloudWatch Logs
```bash
# Get recent logs
aws logs tail /aws/lambda/$SIMULATION_LAMBDA --follow
```

**Look for these log messages**:
- 🔍 "Loading layout from S3: s3://bucket/renewable/layout/{project_id}/layout.json"
- ✅ "Successfully loaded layout from S3"
- ✅ "Layout source: S3"

### 4. Test with Real Project

#### Step 1: Create a layout
```
User query: "optimize turbine layout at 35.0675, -101.3955"
```

#### Step 2: Run wake simulation
```
User query: "run wake simulation"
```

**Expected**: Simulation should load layout from S3 and complete successfully

#### Step 3: Verify in logs
```bash
# Check logs for S3 retrieval
aws logs filter-log-events \
  --log-group-name /aws/lambda/$SIMULATION_LAMBDA \
  --filter-pattern "Loading layout from S3" \
  --max-items 5
```

## Troubleshooting

### Issue: "Layout data not found"

**Check**:
1. Was layout optimization run first?
2. Did layout save to S3 successfully?
3. Are environment variables set correctly?

**Verify layout exists in S3**:
```bash
aws s3 ls s3://renewable-energy-artifacts-484907533441/renewable/layout/ --recursive
```

### Issue: "S3_BUCKET environment variable not configured"

**Fix**:
1. Verify `amplify/backend.ts` has S3 bucket configuration
2. Restart sandbox: `npx ampx sandbox`
3. Wait for "Deployed" message
4. Re-test

### Issue: "Access Denied" from S3

**Fix**:
1. Check IAM permissions in `amplify/backend.ts`
2. Verify simulation Lambda has `s3:GetObject` permission
3. Restart sandbox to apply permissions

## Success Criteria

Task 2 is working correctly when:

- [x] Simulation Lambda has `RENEWABLE_S3_BUCKET` environment variable
- [x] Layout can be loaded from S3 successfully
- [x] Missing layout returns clear error message
- [x] CloudWatch logs show "Layout source: S3"
- [x] Wake simulation completes with S3 layout data
- [x] Error messages include actionable next steps

## Quick Validation

**One-line test**:
```bash
node tests/test-wake-simulation-s3-retrieval.js && echo "✅ Task 2 VERIFIED"
```

If this passes, Task 2 is working correctly!

## Next Task

Once Task 2 is verified, proceed to:
- **Task 3**: Fix intelligent placement algorithm selection
- **Task 4**: Add terrain feature visualization to layout map
- **Task 5**: Implement call-to-action button system
