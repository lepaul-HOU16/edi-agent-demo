# Task 4 Deployment Guide

## Quick Deployment Steps

### 1. Deploy Changes

```bash
# Stop any running sandbox
pkill -f "ampx sandbox" 2>/dev/null || true

# Start sandbox with streaming logs
npx ampx sandbox --stream-function-logs
```

Wait for the "Deployed" message (may take 5-10 minutes).

### 2. Configure NREL API Key

**Option A: Environment Variable (Recommended for testing)**

```bash
# Get your free API key from: https://developer.nrel.gov/signup/

# Set in Lambda environment (after deployment)
aws lambda update-function-configuration \
  --function-name <terrain-lambda-name> \
  --environment "Variables={NREL_API_KEY=your_api_key_here}"
```

**Option B: AWS Secrets Manager (Recommended for production)**

```bash
# Create secret
aws secretsmanager create-secret \
  --name nrel/api_key \
  --secret-string '{"api_key":"your_api_key_here"}' \
  --region us-west-2

# Grant Lambda access to secret (IAM policy)
```

### 3. Test Integration

```bash
# Run integration test
node tests/test-terrain-nrel-integration.js
```

Expected output:
```
✅ ALL TESTS PASSED
📋 Summary:
   ✅ Terrain handler invoked successfully
   ✅ Response structure correct
   ✅ Wind data integration working
   ✅ Data source metadata correct
   ✅ No synthetic data fallbacks
   ✅ Terrain data still working
```

### 4. Test in UI

1. Open chat interface
2. Enter query: "Analyze terrain at 35.067482, -101.395466"
3. Verify:
   - ✅ Terrain map displays
   - ✅ Wind data shows in response
   - ✅ Data source shows "NREL Wind Toolkit"
   - ✅ No synthetic data warnings

## Troubleshooting

### Issue: "NREL_API_KEY_MISSING" error

**Solution:** Configure NREL API key (see step 2 above)

### Issue: "NREL_API_TIMEOUT" error

**Solution:** 
- Check NREL API status: https://developer.nrel.gov/
- Retry request
- Increase Lambda timeout if needed

### Issue: "NREL_API_RATE_LIMIT" error

**Solution:**
- Wait 5 minutes
- Retry request
- Consider upgrading NREL API plan if frequent

### Issue: Terrain Lambda not found

**Solution:**
- Ensure sandbox is running
- Wait for "Deployed" message
- Check CloudWatch logs for deployment errors

## Verification Checklist

- [ ] Sandbox deployed successfully
- [ ] NREL API key configured
- [ ] Integration test passes
- [ ] Terrain map displays in UI
- [ ] Wind data present in response
- [ ] Data source is "NREL Wind Toolkit"
- [ ] No synthetic data warnings
- [ ] Error handling works (test without API key)

## Next Task

Once Task 4 is verified working, proceed to:

**Task 5:** Add NREL API key configuration
- Set environment variable in Lambda configuration
- Update backend.ts to add NREL_API_KEY to terrain Lambda
- Document API key setup in deployment guide
