# NREL Real Data Integration - Deployment Guide

## Current Status

✅ **Code Implementation**: Complete
- NREL Wind Client created
- Handlers updated to use NREL client
- Synthetic data removed
- UI components updated with data source labels
- Chain of thought integration complete

❌ **Deployment Status**: NREL_API_KEY not deployed to Lambda functions

## Why Deployment is Needed

The NREL_API_KEY is configured in `amplify/backend.ts` but has not been applied to the Lambda functions. This requires a sandbox restart to deploy the environment variable changes.

### Current Configuration (backend.ts)
```typescript
const nrelApiKey = 'Fkh6pFT1SPsn9SBw8TDMSl7EnjEe';
backend.renewableSimulationTool.addEnvironment('NREL_API_KEY', nrelApiKey);
backend.renewableTerrainTool.addEnvironment('NREL_API_KEY', nrelApiKey);
```

### Current Lambda Status
```
Simulation Lambda: NREL_API_KEY = NOT SET
Terrain Lambda: NREL_API_KEY = NOT SET
```

## Deployment Steps

### Step 1: Check Current Status
```bash
bash tests/check-nrel-deployment-simple.sh
```

Expected output: "❌ DEPLOYMENT REQUIRED"

### Step 2: Stop Current Sandbox
In the terminal running the sandbox, press `Ctrl+C` to stop it.

### Step 3: Restart Sandbox
```bash
npx ampx sandbox
```

**Important**: Wait for the "Deployed" message. This can take 5-10 minutes.

### Step 4: Verify Deployment
```bash
bash tests/check-nrel-deployment-simple.sh
```

Expected output: "✅ DEPLOYMENT COMPLETE"

### Step 5: Run Full Validation
```bash
bash tests/deploy-and-validate-nrel.sh
```

This will run all validation tests:
1. Pre-deployment validation
2. NREL API key configuration check
3. NREL Wind Client test
4. Simulation integration test
5. Terrain integration test
6. UI data source label test
7. Chain of thought test
8. End-to-end test

## Validation Checklist

After deployment, verify:

- [ ] NREL_API_KEY is set in Simulation Lambda
- [ ] NREL_API_KEY is set in Terrain Lambda
- [ ] No synthetic wind data in production code
- [ ] Simulation handler uses NREL client
- [ ] Terrain handler uses NREL client
- [ ] UI shows "Data Source: NREL Wind Toolkit"
- [ ] Chain of thought shows sub-agent reasoning
- [ ] End-to-end workflow works

## Testing in UI

### Test 1: Wind Rose Generation
1. Open chat interface
2. Enter query: "Generate a wind rose for coordinates 35.067482, -101.395466"
3. Verify:
   - Wind rose displays
   - "Data Source: NREL Wind Toolkit (2023)" label visible
   - No "Visualization Unavailable" error
   - Chain of thought shows "Fetching wind data from NREL Wind Toolkit API"

### Test 2: Wake Simulation
1. Enter query: "Analyze wake effects for a wind farm at 35.067482, -101.395466"
2. Verify:
   - Simulation results display
   - Data source label visible
   - Real NREL data used (not synthetic)

### Test 3: Error Handling
1. Enter query with invalid coordinates: "Generate wind rose for 0, 0"
2. Verify:
   - Clear error message displayed
   - No synthetic data fallback
   - Instructions for valid coordinates shown

## Troubleshooting

### Issue: Sandbox won't start
**Solution**: Check for port conflicts or stale processes
```bash
ps aux | grep ampx
kill <process_id>
npx ampx sandbox
```

### Issue: NREL_API_KEY still not set after restart
**Solution**: Verify backend.ts configuration
```bash
grep -A 2 "NREL_API_KEY" amplify/backend.ts
```

Should show:
```typescript
backend.renewableSimulationTool.addEnvironment('NREL_API_KEY', nrelApiKey);
backend.renewableTerrainTool.addEnvironment('NREL_API_KEY', nrelApiKey);
```

### Issue: Tests fail with "NREL API error"
**Solution**: Verify API key is valid
```bash
cd amplify/functions/renewableTools
python3 -c "
from nrel_wind_client import NRELWindClient
client = NRELWindClient()
print(f'API Key: {client.api_key[:8]}...')
"
```

### Issue: UI shows "Visualization Unavailable"
**Solution**: Check CloudWatch logs
```bash
# Get recent logs for simulation Lambda
aws logs tail /aws/lambda/amplify-digitalassistant--RenewableSimulationToolF-* --follow
```

## Success Criteria

Deployment is complete when:

✅ All validation tests pass
✅ NREL_API_KEY deployed to all required Lambdas
✅ No synthetic wind data in production
✅ UI shows "Data Source: NREL Wind Toolkit"
✅ Chain of thought shows sub-agent reasoning
✅ End-to-end workflow works without errors
✅ PM approves the implementation

## PM Approval Checklist

Present to PM:

1. **Demo**: Show wind rose generation with real NREL data
2. **Data Source**: Point out "Data Source: NREL Wind Toolkit (2023)" label
3. **Chain of Thought**: Show sub-agent reasoning in expandable panel
4. **No Synthetic Data**: Confirm no mock data fallbacks
5. **Error Handling**: Show clear error messages (no silent failures)
6. **Workshop Match**: Confirm implementation matches workshop code

## Next Steps After Approval

1. Document deployment in project wiki
2. Update user documentation with NREL data source info
3. Monitor CloudWatch logs for any NREL API issues
4. Consider adding NREL API rate limit monitoring
5. Plan for caching layer (future enhancement)

## Quick Reference Commands

```bash
# Check deployment status
bash tests/check-nrel-deployment-simple.sh

# Restart sandbox
npx ampx sandbox

# Run full validation
bash tests/deploy-and-validate-nrel.sh

# Test specific component
node tests/test-simulation-nrel-integration.js
node tests/test-terrain-nrel-integration.js
node tests/test-nrel-data-source-ui.js
node tests/test-nrel-chain-of-thought.js
node tests/test-nrel-integration-e2e.js

# Check Lambda environment variables
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant--RenewableSimulationToolF-* \
  --query "Environment.Variables.NREL_API_KEY"
```

## Important Notes

- **NO SYNTHETIC DATA**: If NREL API fails, return error (not mock data)
- **MATCH WORKSHOP**: Implementation matches workshop code exactly
- **NO SHORTCUTS**: Proper implementation only
- **TEST THOROUGHLY**: Verify no synthetic data exists anywhere

## Contact

For issues or questions:
- Check CloudWatch logs first
- Review this deployment guide
- Run validation scripts
- Check NREL API status: https://developer.nrel.gov/docs/wind/wind-toolkit/

---

**Last Updated**: 2025-01-17
**Status**: Ready for deployment
**Next Action**: Restart sandbox to deploy NREL_API_KEY
