# Intelligent Placement Deployment Guide

## Current Status

The intelligent placement algorithm has been fixed to work without numpy/scipy dependencies. The code changes are complete but need to be deployed.

## Changes Made

1. **Removed numpy/scipy dependencies** - Replaced with pure Python implementations
2. **Implemented intelligent placement methods**:
   - Hexagonal grid candidate generation
   - Wind-optimized positioning
   - Constraint-avoiding placement
   - Multi-factor scoring system
   - Wake effect calculations

## Deployment Steps

### 1. Stop Current Sandbox (if running)
```bash
# Press Ctrl+C in the terminal running the sandbox
```

### 2. Deploy Changes
```bash
npx ampx sandbox
```

### 3. Wait for Deployment
- Wait for "Deployed" message (typically 5-10 minutes)
- Watch for any errors during deployment

### 4. Verify Deployment
```bash
# Test the layout Lambda directly
node tests/debug-lambda-responses.js | grep -A 5 "layoutType"
```

Expected output should show:
```json
"layoutType": "Intelligent"
"placementMethod": "constraint_aware_optimization"
```

### 5. Test End-to-End
```bash
# Run comprehensive test
node tests/test-intelligent-placement-with-osm.js
```

## Verification Checklist

- [ ] Sandbox deployed successfully
- [ ] Layout Lambda shows "Intelligent" layout type
- [ ] Constraint consideration count > 0
- [ ] Turbine properties include optimization scores
- [ ] No fallback to grid layout

## Rollback Plan

If deployment fails:
```bash
# Revert the intelligent_placement.py changes
git checkout HEAD~1 amplify/functions/renewableTools/layout/intelligent_placement.py

# Redeploy
npx ampx sandbox
```

## Expected Results

After successful deployment:
- Layout type: "Intelligent"
- Placement method: "constraint_aware_optimization"
- Constraints considered: 170+ features
- Individual turbine scores visible
- No numpy/scipy import errors
