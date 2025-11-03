# Wind Rose Fix V2 - Missing Dependencies

## Problem Update

After fixing the Python syntax error, the Lambda still fails with `InvalidEntrypoint`.

## Root Cause #2: Missing Python Modules in Docker Image

The Dockerfile was only copying files from the `simulation/` directory, but the handler.py imports modules from the parent directory:

### Missing Files:
1. `visualization_generator.py` - Required by handler
2. `wind_client.py` - Required for wind data fetching

### Why This Breaks:
```python
# In handler.py:
from visualization_generator import RenewableVisualizationGenerator  # ← File not in Docker image
from wind_client import get_wind_resource_data_with_fallback        # ← File not in Docker image
```

When Lambda tries to load the handler module, Python can't find these imports, causing the entrypoint to fail.

## The Fix

Updated Dockerfile to copy required modules from parent directory:

```dockerfile
# BEFORE (BROKEN):
COPY simulation/*.py ${LAMBDA_TASK_ROOT}/

# AFTER (FIXED):
COPY simulation/*.py ${LAMBDA_TASK_ROOT}/
COPY visualization_generator.py ${LAMBDA_TASK_ROOT}/
COPY wind_client.py ${LAMBDA_TASK_ROOT}/
```

## Deployment Steps

1. **Stop current sandbox** (if running):
   ```bash
   # Press Ctrl+C in the terminal running sandbox
   ```

2. **Restart sandbox to rebuild Docker image**:
   ```bash
   npx ampx sandbox
   ```
   
   Wait for "Deployed" message (5-10 minutes)

3. **Verify deployment**:
   ```bash
   ./verify-simulation-deployment.sh
   ```

4. **Test wind rose**:
   ```bash
   bash tests/test-wind-rose.sh
   ```

## Why This Happened

The handler.py was written to import from parent directory using:
```python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
```

But the Dockerfile didn't copy those parent directory files into the image.

## Files Modified

- `amplify/functions/renewableTools/simulation/Dockerfile` - Added missing file copies
- `WIND_ROSE_FIX_V2.md` - This document

## Expected Result

After deployment:
- Lambda should start without InvalidEntrypoint error
- Wind rose analysis should return success
- Visualizations should be generated

## Validation

Run these commands after deployment:

```bash
# 1. Check Lambda responds
./verify-simulation-deployment.sh

# 2. Run full test suite
bash tests/test-wind-rose.sh

# 3. Check CloudWatch logs (should see "Visualization modules loaded successfully")
aws logs tail /aws/lambda/amplify-digitalassistant--RenewableSimulationToolF-3zMAJnuPbmwG --since 2m
```

