# Deploy Intelligent Placement Fix

## Problem
The Python code was updated locally, but Lambda is still running the **old deployed version** with the grid algorithm.

## Root Cause
**Python Lambda functions require sandbox restart to deploy changes.**

Unlike some hot-reload scenarios, changes to Python Lambda functions in Amplify Gen 2 require a full sandbox restart to be deployed.

## Solution: Restart Sandbox

### Step 1: Stop Current Sandbox
Press `Ctrl+C` in the terminal where `npx ampx sandbox` is running.

### Step 2: Restart Sandbox
```bash
npx ampx sandbox
```

### Step 3: Wait for Deployment
Wait for the message:
```
✅ Deployed
```

This typically takes 5-10 minutes.

### Step 4: Test Again
Run the same query:
```
Create a wind farm layout for Austin, Texas (30.2672, -97.7431) with 25 turbines
```

## Expected Result After Deployment

You should see:
- Algorithm: `intelligent_placement` ✅
- Verification: `INTELLIGENT_PLACEMENT_WITH_OSM_CONSTRAINTS` ✅
- Constraints Applied: `149 terrain features` ✅

## Why This Happened

The file `amplify/functions/renewableTools/layout/simple_handler.py` was edited, but:
1. Lambda was still running the old code from the previous deployment
2. Python changes in Amplify Gen 2 require sandbox restart
3. The local file change doesn't automatically deploy to Lambda

## Verification

After sandbox restart, check CloudWatch logs for:
```
Algorithm: intelligent_placement
Intelligent placement returned X turbines
```

---

**Action Required**: Restart the sandbox to deploy the Python code changes.
