# Simulation Lambda - Bundle Dependencies Fix

## Problem

After switching to ZIP deployment, Lambda failed with:
```
No module named 'numpy'
```

## Root Cause

ZIP deployment doesn't automatically include Python dependencies from requirements.txt. The dependencies need to be:
1. Bundled in a Lambda Layer, OR
2. Installed directly into the function directory

## Discovery

Checked terrain Lambda (which works):
- Has NO Lambda Layer attached
- Has dependencies bundled directly in its directory (aiohttp, multidict, frozenlist, etc.)

## The Solution

**Bundle dependencies directly into the simulation directory** - matching terrain's pattern.

## Implementation

Installed all dependencies from requirements.txt into the simulation directory:

```bash
pip3 install -r amplify/functions/renewableTools/simulation/requirements.txt \
  --target amplify/functions/renewableTools/simulation/ \
  --upgrade
```

This installs:
- numpy
- scipy  
- pandas
- matplotlib
- folium
- boto3
- shapely
- pyproj
- requests
- All their dependencies

## Result

The simulation directory now contains:
- handler.py (main code)
- visualization_generator.py (copied)
- wind_client.py (copied)
- matplotlib_generator.py
- folium_generator.py
- visualization_config.py
- numpy/ (bundled dependency)
- matplotlib/ (bundled dependency)
- folium/ (bundled dependency)
- boto3/ (bundled dependency)
- ... all other dependencies

## Deployment

The ZIP deployment will now include all dependencies:

```bash
npx ampx sandbox
```

Wait for deployment, then test:

```bash
bash tests/test-wind-rose.sh
```

## Expected Result

Lambda should:
- ✅ Import numpy successfully
- ✅ Import matplotlib successfully
- ✅ Import all visualization modules
- ✅ Process wind rose requests
- ✅ Generate visualizations

## Why This Pattern

This matches how terrain works:
1. ZIP deployment (simple)
2. Dependencies bundled in directory (no layer needed)
3. All code and dependencies in one package

## File Size Note

The simulation directory is now larger (~100MB+) due to bundled dependencies, but this is normal for Lambda functions with scientific Python libraries.

