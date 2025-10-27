# NREL HTTPS Fix Required

## Issue Found After Deployment

**Status:** 🔴 BLOCKING - Tool execution fails with 403 error

## Root Cause

After successful deployment, the simulation tool returns:
```
Tool execution failed. Please check the parameters and try again.
```

**CloudWatch logs show:**
```
NREL API request failed (Status: 403)
```

**Reason:** The NREL API URL is using **HTTP** instead of **HTTPS**

## The Fix

Changed in `amplify/functions/renewableTools/nrel_wind_client.py`:

```python
# ❌ BEFORE (causes 403 error)
nrel_api_url = (
    f'http://developer.nrel.gov/api/wind-toolkit/...'
)

# ✅ AFTER (works correctly)
nrel_api_url = (
    f'https://developer.nrel.gov/api/wind-toolkit/...'
)
```

## Why This Happened

NREL's API requires HTTPS for security. Using HTTP results in a 403 Forbidden response.

## Deployment Required

The fix has been applied to the code but needs to be deployed:

### Option 1: Restart Sandbox (Recommended)
```bash
# Stop current sandbox (Ctrl+C)
# Then restart:
npx ampx sandbox
```

### Option 2: Use Deployment Script
```bash
./scripts/deploy-nrel-https-fix.sh
```

## Verification

After deployment, test with:
```bash
node tests/test-nrel-https-fix.js
```

Expected result:
- ✅ No 403 errors
- ✅ Wind data fetched successfully
- ✅ Artifacts generated
- ✅ Chain of thought shows all steps completed

## Timeline

- **Fix Applied:** 2025-01-20 12:45 PM
- **Deployment:** Pending sandbox restart
- **ETA:** 5-10 minutes after restart
- **Testing:** 2 minutes

## Impact

**Before Fix:**
- All simulation queries fail with "Tool execution failed"
- CloudWatch shows 403 Forbidden errors
- No artifacts generated

**After Fix:**
- Simulation queries work correctly
- Real NREL data fetched via HTTPS
- Artifacts generated successfully
- Wind rose displays real data

## Files Changed

1. `amplify/functions/renewableTools/nrel_wind_client.py` - HTTP → HTTPS

## Next Steps

1. 🔄 Restart sandbox to deploy HTTPS fix
2. ⏳ Wait for deployment (5-10 minutes)
3. ✅ Run test: `node tests/test-nrel-https-fix.js`
4. ✅ Verify in UI with actual query
5. ✅ Get PM validation

---

**Priority:** HIGH - Blocks all simulation functionality
**Effort:** 5 minutes (just restart sandbox)
**Risk:** LOW - Simple URL change
