# Deploy with Certainty - Timeout Fixes

## The Problem with `npx ampx sandbox`

The command `npx ampx sandbox` runs in the background and doesn't give clear feedback about when deployment is actually complete. You're left wondering:
- Did it deploy?
- Are my changes live?
- Can I test now?

## The Solution

Use the deployment verification script that:
1. Records current configuration
2. Deploys changes
3. Waits for AWS to propagate
4. Verifies the actual deployed configuration
5. Tells you exactly when it's safe to test

## How to Deploy

### Single Command

```bash
./scripts/deploy-and-verify-timeout-fixes.sh
```

That's it! The script will:
- ✅ Show you the BEFORE configuration
- ✅ Deploy your changes
- ✅ Monitor deployment progress
- ✅ Wait for AWS propagation
- ✅ Verify the AFTER configuration
- ✅ Tell you exactly what changed
- ✅ Confirm when it's safe to test

### What You'll See

```
==========================================
DEPLOYMENT AND VERIFICATION SCRIPT
==========================================

📋 BEFORE DEPLOYMENT - Current Configuration:
----------------------------------------------
Report Lambda timeout: 30s
Orchestrator timeout: 90s

🚀 STARTING DEPLOYMENT...
----------------------------------------------
This will take 5-10 minutes. Please wait...

Deployment PID: 12345
Monitoring deployment progress...

⏳ Still deploying... (30s elapsed)
⏳ Still deploying... (60s elapsed)
⏳ Still deploying... (90s elapsed)

✅ Deployment command completed

⏱️  Waiting 30 seconds for AWS to propagate changes...

🔍 VERIFICATION - Checking Deployed Configuration:
----------------------------------------------
Checking Report Lambda... ✅ VERIFIED
   Timeout: 300s (expected 300s)
   Last Modified: 2025-10-27T15:30:00.000+0000

Checking Orchestrator Lambda... ✅ VERIFIED
   Timeout: 300s (expected 300s)
   Last Modified: 2025-10-27T15:30:00.000+0000

==========================================
✅ DEPLOYMENT SUCCESSFUL AND VERIFIED

Summary:
  - Report Lambda: 30s → 300s
  - Orchestrator: 90s → 300s
  - Total time: 8m 45s

✅ You can now test in the UI:
   1. 'Perform financial analysis and ROI calculation'
   2. 'Generate comprehensive executive report'

Both should now work without timeout errors.
==========================================
```

## What Gets Deployed

### 1. Report Lambda Timeout Fix
- **File**: `amplify/functions/renewableTools/report/resource.ts`
- **Change**: `timeout: Duration.seconds(30)` → `timeout: Duration.seconds(300)`
- **Change**: `memorySize: 512` → `memorySize: 1024`

### 2. Orchestrator Timeout Fix
- **File**: `amplify/functions/renewableOrchestrator/resource.ts`
- **Change**: `timeoutSeconds: 90` → `timeoutSeconds: 300`

### 3. Mock Data Removal
- **File**: `amplify/functions/renewableOrchestrator/handler.ts`
- **Change**: Removed all mock data fallbacks
- **Result**: Real errors will surface instead of fake data

## If Verification Fails

The script will tell you:

```
❌ DEPLOYMENT VERIFICATION FAILED

The deployment completed but timeouts were not updated correctly.
This might mean:
  1. Changes didn't deploy (check amplify/functions/*/resource.ts)
  2. AWS needs more time to propagate
  3. Sandbox needs to be restarted

Try running this script again in 2 minutes.
```

In this case:
1. Wait 2 minutes
2. Run the script again
3. If it still fails, check the deployment log at `/tmp/amplify-deploy.log`

## Manual Verification (If Needed)

If you want to check manually:

```bash
# Check Report Lambda
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant--RenewableReportToolB3B5E-JRhfq69yq1WC \
  --query '[Timeout,MemorySize,LastModified]' \
  --output table

# Check Orchestrator
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE \
  --query '[Timeout,MemorySize,LastModified]' \
  --output table
```

Expected output:
```
Report Lambda:    300s timeout, 1024MB memory
Orchestrator:     300s timeout, 512MB memory
```

## Testing After Deployment

Once the script says "✅ DEPLOYMENT SUCCESSFUL AND VERIFIED", test these queries:

### 1. Financial Analysis
Query: `Perform financial analysis and ROI calculation`

**Before**: Timeout error after 30 seconds
**After**: Should complete (or show real error if implementation missing)

### 2. Report Generation
Query: `Generate comprehensive executive report`

**Before**: "Mock data not available for comprehensive_assessment"
**After**: Should complete (or show real error if implementation missing)

## Why This Works

1. **Records baseline**: Captures current config before deployment
2. **Monitors progress**: Shows you deployment is actually running
3. **Waits for propagation**: AWS needs 30s to propagate Lambda config changes
4. **Verifies actual state**: Checks the deployed Lambda configuration
5. **Confirms success**: Only says "done" when changes are actually live

## Troubleshooting

### "Deployment timeout after 600s"
- Deployment is taking longer than 10 minutes
- Check `/tmp/amplify-deploy.log` for errors
- May need to stop and restart

### "Deployment failed with exit code: 1"
- Check the last 20 lines shown in output
- Common issues:
  - TypeScript compilation errors
  - Missing dependencies
  - AWS permission issues

### "Timeouts don't match expected values"
- AWS needs more time to propagate
- Wait 2 minutes and run script again
- Check if sandbox is actually running

## Files Changed

1. `amplify/functions/renewableTools/report/resource.ts` - Report timeout
2. `amplify/functions/renewableOrchestrator/resource.ts` - Orchestrator timeout
3. `amplify/functions/renewableOrchestrator/handler.ts` - Mock data removed

All changes are in code and ready to deploy.
