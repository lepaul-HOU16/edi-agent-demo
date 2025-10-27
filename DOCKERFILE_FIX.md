# Dockerfile Fix for NREL Integration

## Problem

Deployment was failing with error:
```
[ERROR] [UnknownFault] ToolkitError: Failed to build asset function/RenewableTerrainTool/AssetImage
```

## Root Cause

The Dockerfiles for both terrain and simulation tools were trying to copy a file named `wind_client.py` which doesn't exist. The correct filename is `nrel_wind_client.py`.

## Files Fixed

### 1. `amplify/functions/renewableTools/terrain/Dockerfile`

**Before:**
```dockerfile
COPY terrain/wind_client.py ./
```

**After:**
```dockerfile
COPY nrel_wind_client.py ./
```

### 2. `amplify/functions/renewableTools/simulation/Dockerfile`

**Before:**
```dockerfile
COPY simulation/wind_client.py ./
```

**After:**
```dockerfile
COPY nrel_wind_client.py ./
```

## Why This Happened

The file was originally named `wind_client.py` in the workshop code, but we renamed it to `nrel_wind_client.py` to be more explicit about using NREL data. The Dockerfiles weren't updated to reflect this change.

## Deployment

The sandbox should now deploy successfully. The changes are:

1. ✅ Fixed terrain Dockerfile to copy `nrel_wind_client.py`
2. ✅ Fixed simulation Dockerfile to copy `nrel_wind_client.py`
3. ✅ Both tools will now have access to the NREL wind client

## Next Steps

The sandbox should automatically rebuild the Docker images with the corrected file paths. Wait for the deployment to complete, then test the wind rose generation.

---

**Status**: Fixed
**Files Changed**: 2 Dockerfiles
**Impact**: Unblocks deployment of NREL real data integration
