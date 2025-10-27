# Docker Lambda Fix Applied

## Problem
The simulation Lambda Docker image was failing with `Runtime.InvalidEntrypoint` because the Dockerfile COPY paths were ambiguous.

## Fix Applied
Updated `amplify/functions/renewableTools/simulation/Dockerfile`:
- Made all COPY paths explicit with destination filenames
- Clarified which files come from `simulation/` vs parent directory
- Updated rebuild timestamp to force new build

## What Changed
```dockerfile
# Before (ambiguous):
COPY simulation/handler.py ./
COPY plotly_wind_rose_generator.py ./

# After (explicit):
COPY simulation/handler.py ./handler.py
COPY plotly_wind_rose_generator.py ./plotly_wind_rose_generator.py
```

## Why This Fixes It
Docker was confused about file locations. Explicit destinations ensure:
1. `handler.py` is at `/var/task/handler.py`
2. Lambda can find `handler.handler` function
3. All imports work correctly

## Next Steps

### 1. Restart Sandbox (REQUIRED)
```bash
# Stop current sandbox (Ctrl+C)
# Then restart:
npx ampx sandbox
```

### 2. Wait for Docker Build
The Docker image will rebuild (takes 5-10 minutes):
- Watch for "Building Docker image" messages
- Wait for "Deployed" confirmation
- Docker image will have proper entrypoint

### 3. Verify Deployment
```bash
./tests/debug-deployment-status.sh
```

Should show:
- ✅ Simulation Lambda Runtime: `python3.12` (not `None`)
- ✅ Recent LastModified timestamp
- ✅ No `InvalidEntrypoint` errors

### 4. Test Wind Rose
```
show me a wind rose for 35.067482, -101.395466
```

Should work now that Docker Lambda is fixed.

## Why Docker Lambda is Needed
- Regular Lambda: 6MB response limit
- Docker Lambda: 10GB response limit
- Wind rose visualizations can be large (Plotly JSON + PNG fallback)
- Need Docker for reliable large responses

## If Still Broken
Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/amplify-digitalassistant--RenewableSimulationToolF-ffzy33Y2jJO0 --follow
```

Look for:
- Python import errors
- Missing dependencies
- Handler not found errors

## Verification Checklist
- [ ] Sandbox restarted
- [ ] Docker image rebuilt (check logs)
- [ ] Lambda Runtime shows `python3.12`
- [ ] No `InvalidEntrypoint` errors
- [ ] Wind rose query works
- [ ] Plotly visualization displays

## Timeline
- **Before**: Runtime: None, InvalidEntrypoint errors
- **After Fix**: Runtime: python3.12, handler found
- **Expected**: 5-10 minutes for Docker rebuild
