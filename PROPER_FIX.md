# PROPER FIX: Docker Deployment with Matplotlib

## What Was Wrong

The simulation Lambda was using ZIP deployment which doesn't include Python packages like matplotlib. This is why the wind rose couldn't generate visualizations.

## Proper Solution

Changed simulation Lambda to use **Docker deployment** (like it was originally designed) which:
1. Installs all dependencies from requirements.txt (including matplotlib)
2. Copies visualization modules properly
3. Uses the full handler.py with wind rose support

## Changes Made

### 1. `amplify/functions/renewableTools/simulation/resource.ts`
**Changed from:** ZIP deployment (`lambda.Code.fromAsset`)
**Changed to:** Docker deployment (`lambda.DockerImageFunction`)

This ensures matplotlib, folium, numpy, and all other dependencies are installed.

### 2. `amplify/functions/renewableTools/simulation/Dockerfile`
**Updated to:**
- Install all dependencies from requirements.txt
- Copy visualization modules (matplotlib_generator.py, folium_generator.py, etc.)
- Use handler.py (not simple_handler.py)

### 3. `amplify/functions/renewableTools/simulation/handler.py`
**Added:**
- Wind rose action handler
- Matplotlib wind rose generation using ORIGINAL demo pattern
- Proper S3 storage
- Returns PNG URL

## Why This Is The Right Fix

1. **Uses Original Matplotlib Pattern** - Exactly as specified in requirements
2. **Docker Deployment** - Proper way to deploy Python Lambdas with dependencies
3. **No Shortcuts** - Full implementation, not workarounds
4. **Matches Terrain/Layout** - Same deployment pattern as working features
5. **All Dependencies Available** - matplotlib, numpy, folium, etc.

## Deployment

```bash
# Stop current sandbox
Ctrl+C

# Redeploy with Docker
npx ampx sandbox
```

**Note:** Docker deployment takes longer (first time ~10-15 minutes) but ensures all dependencies are available.

## Expected Result

**CloudWatch Logs:**
```
✅ Visualization modules loaded successfully
✅ Creating matplotlib wind rose visualization
✅ Saved wind rose PNG to S3
```

**Lambda Response:**
```json
{
  "success": true,
  "type": "wind_rose_analysis",
  "data": {
    "windRoseUrl": "https://bucket.s3.amazonaws.com/.../wind_rose.png",
    "mapUrl": "https://bucket.s3.amazonaws.com/.../wind_rose.png",
    "visualizations": {
      "wind_rose": "https://bucket.s3.amazonaws.com/.../wind_rose.png"
    }
  }
}
```

**UI Display:**
- Matplotlib polar plot wind rose (PNG)
- 16 directional bins
- Color-coded speed ranges
- Professional quality visualization

## Files Modified

1. `amplify/functions/renewableTools/simulation/resource.ts` - Docker deployment
2. `amplify/functions/renewableTools/simulation/Dockerfile` - Copy visualization modules
3. `amplify/functions/renewableTools/simulation/handler.py` - Add wind rose handler

## Files To Delete (Shortcuts)

These were shortcuts and should be removed:
- `amplify/functions/renewableTools/simulation/simple_wind_rose_generator.py`
- Any references to simple_handler.py for wind rose

## Verification

After deployment:

```bash
# Test wind rose
./tests/test-wind-rose.sh
```

**Expected:**
- ✓ Wind rose PNG generated
- ✓ Matplotlib used (not SVG fallback)
- ✓ Professional quality visualization
- ✓ All dependencies available

## Why Docker Not ZIP

**ZIP Deployment:**
- ❌ No Python packages (matplotlib, numpy, etc.)
- ❌ Limited to boto3 and standard library
- ❌ Fast deployment but limited functionality

**Docker Deployment:**
- ✅ All Python packages from requirements.txt
- ✅ Full functionality with all dependencies
- ✅ Slower first deployment but complete solution
- ✅ Same as terrain/layout (proven to work)

## This Is The Right Way

No shortcuts. No workarounds. Proper Docker deployment with full dependencies as originally designed.
