# NREL Integration - Quick Start Guide

## Current Status

✅ **All code complete**
⏸️ **Deployment pending** - Sandbox restart required

## What You Need to Do

### Step 1: Check Status (30 seconds)
```bash
bash tests/check-nrel-deployment-simple.sh
```

**Expected**: "❌ DEPLOYMENT REQUIRED"

### Step 2: Restart Sandbox (10 minutes)
```bash
# In terminal running sandbox, press Ctrl+C to stop

# Then restart:
npx ampx sandbox

# Wait for "Deployed" message (5-10 minutes)
```

### Step 3: Verify Deployment (30 seconds)
```bash
bash tests/check-nrel-deployment-simple.sh
```

**Expected**: "✅ DEPLOYMENT COMPLETE"

### Step 4: Run Validation (5 minutes)
```bash
bash tests/deploy-and-validate-nrel.sh
```

**Expected**: All tests pass ✅

### Step 5: Test in UI (5 minutes)
1. Open chat interface
2. Enter: "Generate a wind rose for coordinates 35.067482, -101.395466"
3. Verify:
   - Wind rose displays
   - "Data Source: NREL Wind Toolkit (2023)" visible
   - Chain of thought shows "Fetching wind data from NREL Wind Toolkit API"

### Step 6: Get PM Approval
Present to PM:
- Wind rose with real NREL data
- Data source label visible
- Chain of thought shows sub-agent reasoning
- No synthetic data anywhere

## Total Time: ~20 minutes

## If Something Goes Wrong

### Deployment still shows "REQUIRED"
```bash
# Check backend.ts has NREL_API_KEY
grep -A 2 "NREL_API_KEY" amplify/backend.ts

# Should show:
# backend.renewableSimulationTool.addEnvironment('NREL_API_KEY', nrelApiKey);
# backend.renewableTerrainTool.addEnvironment('NREL_API_KEY', nrelApiKey);
```

### Tests fail
```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/amplify-digitalassistant--RenewableSimulationToolF-* --follow
```

### UI shows errors
1. Check data source label is visible
2. Verify chain of thought shows NREL steps
3. Review CloudWatch logs

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bash tests/check-nrel-deployment-simple.sh` | Check deployment status |
| `npx ampx sandbox` | Restart sandbox |
| `bash tests/deploy-and-validate-nrel.sh` | Full validation |
| `node tests/test-simulation-nrel-integration.js` | Test simulation |
| `node tests/test-terrain-nrel-integration.js` | Test terrain |

## Success Criteria

✅ NREL_API_KEY deployed to Lambdas
✅ All validation tests pass
✅ UI shows "Data Source: NREL Wind Toolkit"
✅ Chain of thought shows sub-agent reasoning
✅ No synthetic data in production
✅ PM approves

## Documentation

- **Full Guide**: `NREL_DEPLOYMENT_GUIDE.md`
- **Task Summary**: `TASK_10_DEPLOYMENT_SUMMARY.md`
- **Complete Status**: `NREL_INTEGRATION_COMPLETE.md`

---

**Next Action**: Restart sandbox
**ETA**: 20 minutes
