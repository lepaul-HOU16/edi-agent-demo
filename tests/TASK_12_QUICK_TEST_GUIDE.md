# Task 12: Wake Simulation - Quick Test Guide

## Quick Verification

### 1. Run Automated Test
```bash
node tests/test-wake-simulation-orchestrator.js
```

**Expected Output:**
```
🎉 ALL TESTS PASSED
```

### 2. Deploy Changes
```bash
npx ampx sandbox
```

Wait for: `Deployed` message

### 3. Test in UI

**Test Query:**
```
run wake simulation for project WindFarm-Alpha
```

**Expected Response:**
- Intent detected: wake_simulation
- Artifact type: wake_simulation
- Visualization renders with:
  - Performance metrics
  - Turbine metrics
  - Monthly production chart
  - Wake heatmap
  - Action buttons

### 4. Alternative Test Queries

```
analyze wake effects for my wind farm
show me wake analysis results
calculate wake losses for project X
wake simulation for turbine layout
```

## Troubleshooting

### Issue: Query not detected as wake_simulation
**Check:**
- RenewableIntentClassifier patterns
- Query contains wake-related keywords

### Issue: Artifact not rendering
**Check:**
- Artifact type is 'wake_simulation'
- ChatMessage.tsx handles the type
- SimulationChartArtifact component exists

### Issue: Missing data in visualization
**Check:**
- Tool Lambda returns correct data structure
- formatArtifacts maps all fields
- Frontend component expects the fields

## Success Indicators

✅ Query detected as wake_simulation intent
✅ Orchestrator routes to simulation tool
✅ Artifact generated with correct type
✅ Frontend renders visualization
✅ All data fields populated
✅ Action buttons appear

## Files to Review

1. `amplify/functions/renewableOrchestrator/handler.ts` (line 2256)
2. `amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts` (line 127)
3. `src/components/ChatMessage.tsx` (line 579)
4. `tests/test-wake-simulation-orchestrator.js`

## Quick Commands

```bash
# Test
node tests/test-wake-simulation-orchestrator.js

# Deploy
npx ampx sandbox

# Check logs
aws logs tail /aws/lambda/renewable-orchestrator --follow

# Verify environment variables
aws lambda get-function-configuration \
  --function-name <orchestrator-name> \
  --query "Environment.Variables"
```

## Status: ✅ READY FOR TESTING
