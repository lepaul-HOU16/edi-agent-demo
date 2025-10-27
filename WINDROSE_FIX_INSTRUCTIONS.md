# Wind Rose Fix - ACTUAL ROOT CAUSE

## Root Cause Found
The simulation Lambda has `Runtime.InvalidEntrypoint` error in CloudWatch logs:
```
INIT_REPORT Init Duration: 9.36 ms  Phase: init     Status: error   Error Type: Runtime.InvalidEntrypoint
```

This means the Docker Lambda cannot find or execute the handler function.

## What I Fixed
1. ✅ Removed problematic `sys.path.append()` from handler.py (already done)
2. ✅ Updated Dockerfile timestamp to force rebuild

## What YOU Must Do Now

### Step 1: Stop Sandbox
Press `Ctrl+C` in your terminal where sandbox is running

### Step 2: Restart Sandbox
```bash
npx ampx sandbox
```

**CRITICAL:** Wait for the full deployment to complete. Docker images take 5-10 minutes to build and deploy.

Look for these messages:
```
✓ Building Docker image for RenewableSimulationTool...
✓ Pushing Docker image to ECR...
✓ Deployed
```

### Step 3: Verify Deployment
```bash
# Check Lambda exists
aws lambda list-functions --query "Functions[?contains(FunctionName, 'Simulation')].FunctionName" --output text

# Check for errors in logs (should be EMPTY after restart)
aws logs tail /aws/lambda/$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Simulation')].FunctionName" --output text) --since 5m --format short
```

### Step 4: Test Wind Rose
In the UI, send:
```
analyze wind rose for 35.067482, -101.395466
```

You should see:
- ✅ Plotly interactive wind rose chart
- ✅ Wind statistics
- ✅ NO "Tool execution failed" error

## Why This Happened
The Docker image was built with the old handler.py that had `sys.path.append()` which breaks Lambda's module loading. Even though we fixed handler.py, the OLD Docker image was still deployed. Restarting sandbox rebuilds the Docker image with the fixed code.

## If It Still Fails
Check CloudWatch logs again:
```bash
aws logs tail /aws/lambda/$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Simulation')].FunctionName" --output text) --since 5m
```

If you still see `Runtime.InvalidEntrypoint`, the Docker image didn't rebuild. Try:
1. Delete the function manually
2. Restart sandbox again
3. Wait for full deployment
