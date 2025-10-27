# DEPLOYMENT FIX NEEDED

## Problem Found

**Sandbox is NOT running** - that's why nothing is working.

## Evidence

1. ❌ Sandbox process not running
2. ❌ Orchestrator last updated: Oct 17, 04:55 (hours ago)
3. ❌ Simulation Lambda runtime: **None** (broken Docker image)
4. ❌ No frontend build exists
5. ✅ Dev server running (but using old backend)

## The Issue

The simulation Lambda shows `Runtime: None` which means the Docker image failed to deploy properly. This is why wind rose queries fail.

## Immediate Fix

```bash
# 1. Stop dev server (Ctrl+C in terminal running npm run dev)

# 2. Start sandbox (this will redeploy everything)
npx ampx sandbox

# 3. Wait for "Deployed" message (5-10 minutes)

# 4. In another terminal, restart dev server
npm run dev

# 5. Test wind rose query
```

## What Happened

- Code changes were made but sandbox wasn't restarted
- Lambda functions didn't redeploy
- Docker image for simulation Lambda is broken (Runtime: None)
- Frontend is using cached old backend

## Verification After Restart

Run this to verify deployment:
```bash
./tests/debug-deployment-status.sh
```

Should see:
- ✅ Sandbox process running
- ✅ Simulation Lambda runtime: python3.12 (not None)
- ✅ Recent LastModified timestamps
- ✅ Frontend build exists

## Why Wind Rose Fails

The orchestrator is calling:
```
RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME=amplify-digitalassistant--RenewableSimulationToolF-ffzy33Y2jJO0
```

But that Lambda has `Runtime: None` = broken Docker deployment.

## Root Cause

Per the steering rules (avoid-massive-regressions.md):

**Rule: ALWAYS Restart Sandbox After Backend Changes**

ANY change to:
- `amplify/backend.ts`
- `amplify/*/resource.ts`
- Lambda function code
- Environment variables

Requires sandbox restart. Changes do NOT auto-deploy.

## Next Steps

1. **Restart sandbox** (npx ampx sandbox)
2. **Wait for full deployment** (watch for "Deployed" message)
3. **Verify Lambdas deployed** (check Runtime is not "None")
4. **Test wind rose** (should work after deployment)

## If Still Broken After Restart

Check CloudWatch logs:
```bash
# Orchestrator logs
aws logs tail /aws/lambda/amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE --follow

# Simulation logs  
aws logs tail /aws/lambda/amplify-digitalassistant--RenewableSimulationToolF-ffzy33Y2jJO0 --follow
```

Look for:
- Docker image errors
- Python import errors
- Missing dependencies
- Timeout errors

## Prevention

Before making changes:
1. Ensure sandbox is running
2. Make changes
3. Sandbox auto-deploys (watch logs)
4. Verify deployment completed
5. Test changes

**Never assume changes are deployed without verifying.**
