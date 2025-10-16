# Wind Rose Fix V3 - Switch to Simple Handler

## Problem Analysis

After multiple attempts to fix the `handler.py` file, the Lambda still fails with `InvalidEntrypoint`. 

## Root Cause Analysis

The complex `handler.py` (695 lines) has dependencies that are difficult to satisfy in the Docker environment:
- Imports from parent directory using sys.path manipulation
- Complex visualization dependencies
- Multiple cross-module imports

## The Solution: Use Simple Handler

Switch to `simple_handler.py` (479 lines) which:
- ✅ Only uses standard library imports (json, sys, os, logging, numpy, boto3, datetime, math)
- ✅ No complex cross-module dependencies
- ✅ Simpler, more reliable
- ✅ Still generates wind rose data and visualizations

## Changes Made

### Dockerfile Update
```dockerfile
# BEFORE:
CMD ["handler.handler"]

# AFTER:
CMD ["simple_handler.handler"]
```

This tells Lambda to use `simple_handler.py` instead of `handler.py`.

## Why This Works

`simple_handler.py`:
1. Has no external module dependencies beyond standard libraries
2. Doesn't try to import from parent directories
3. Generates wind rose data inline
4. Creates matplotlib visualizations directly
5. Saves to S3 properly

## Deployment Steps

```bash
# The Dockerfile has been updated
# Now redeploy:

npx ampx sandbox

# Wait for "Deployed" message (5-10 minutes)
```

## Testing

After deployment:

```bash
# Test wind rose
bash tests/test-wind-rose.sh

# Or test directly
./test-docker-image-contents.sh
```

## Expected Result

The Lambda should:
- ✅ Start without InvalidEntrypoint error
- ✅ Process wind rose requests
- ✅ Generate matplotlib wind rose PNG
- ✅ Save to S3
- ✅ Return success with visualization URL

## What simple_handler.py Does

1. **Wind Rose Analysis**:
   - Generates wind direction/speed data
   - Creates matplotlib wind rose visualization
   - Saves PNG to S3
   - Returns data + visualization URL

2. **Wake Simulation**:
   - Calculates wake effects
   - Generates performance metrics
   - Creates visualizations
   - Returns comprehensive results

## Files Modified

- `amplify/functions/renewableTools/simulation/Dockerfile` - Changed CMD to use simple_handler
- `WIND_ROSE_FIX_V3.md` - This document

## Why Previous Fixes Didn't Work

1. **V1**: Fixed Python syntax error - but handler.py still had import issues
2. **V2**: Added missing files to Docker - but complex imports still problematic
3. **V3**: Switch to simpler handler - eliminates all import complexity

## Validation

After deployment, you should see in CloudWatch logs:
```
INFO Simulation Lambda invoked
INFO Handling wind rose analysis
INFO ✅ Saved wind rose PNG to S3: https://...
```

Instead of:
```
Runtime.InvalidEntrypoint
```

