# Deploy OSM Integration Fix

## Quick Start

The OSM regression has been fixed by adding the missing `aiohttp` dependency to the Lambda layer. Follow these steps to deploy the fix.

## Prerequisites

- AWS CLI configured
- Amplify CLI installed (`npm install -g @aws-amplify/cli`)
- Access to the AWS account

## Deployment Options

### Option 1: Sandbox Deployment (Recommended for Testing)

```bash
# Start sandbox with live updates
npx ampx sandbox --stream-function-logs
```

This will:
- Deploy the updated Lambda layer with `aiohttp`
- Update all Lambda functions to use the new layer
- Stream logs so you can see the fix in action

### Option 2: Production Deployment

```bash
# Deploy to production
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

## Verification

### 1. Check Lambda Layer

After deployment, verify the layer includes `aiohttp`:

```bash
# List Lambda layers
aws lambda list-layers --region us-west-2

# Get layer version details
aws lambda get-layer-version \
  --layer-name RenewableDemoLayer \
  --version-number <latest-version> \
  --region us-west-2
```

### 2. Test OSM Integration

Run the diagnostic script:

```bash
python3 scripts/test-osm-client-direct.py
```

Expected output:
```
✅ PASS: IMPORT
✅ PASS: DEPENDENCIES  
✅ PASS: NETWORK
✅ PASS: ENDPOINTS
✅ PASS: QUERY

🎉 SUCCESS: OSM integration is working correctly!
```

### 3. Test in Application

1. Navigate to the renewable energy analysis interface
2. Request terrain analysis for a location (e.g., Amarillo, TX: 35.2220, -101.8313)
3. Verify:
   - Feature count is 100+ (not 3)
   - Data source shows "openstreetmap_real" (not "synthetic_fallback")
   - No "Limited functionality" warning appears
   - Map shows real buildings, roads, and terrain features

## Troubleshooting

### Issue: Still seeing synthetic data after deployment

**Check 1**: Verify layer was deployed
```bash
aws lambda get-function --function-name <terrain-function-name> --region us-west-2
```

Look for the layer ARN in the response.

**Check 2**: Check Lambda logs
```bash
aws logs tail /aws/lambda/<terrain-function-name> --follow --region us-west-2
```

Look for:
- `✅ Visualization modules loaded successfully`
- `🌍 Querying real OSM data at...`
- `✅ Successfully retrieved X real terrain features`

**Check 3**: Verify aiohttp is available
Add this to the Lambda function temporarily:
```python
try:
    import aiohttp
    logger.info(f"✅ aiohttp version: {aiohttp.__version__}")
except ImportError as e:
    logger.error(f"❌ aiohttp not available: {e}")
```

### Issue: Import errors in Lambda

**Solution**: Rebuild and redeploy the layer
```bash
cd amplify/layers/renewableDemo
./build.sh
# Then redeploy with ampx sandbox or pipeline-deploy
```

### Issue: Network connectivity errors

**Check**: Lambda function has internet access
- Verify Lambda is not in a VPC without NAT gateway
- Check security groups allow outbound HTTPS (port 443)
- Verify no firewall rules blocking Overpass API endpoints

## Rollback Plan

If issues occur after deployment:

```bash
# Revert to previous commit
git revert HEAD

# Redeploy
npx ampx sandbox
```

## Success Criteria

✅ Diagnostic test passes all checks
✅ Feature count > 100 for typical locations
✅ Data source = "openstreetmap_real"
✅ No "Limited functionality" warnings
✅ Map displays real terrain features
✅ Lambda logs show successful OSM queries

## Timeline

- **Fix Applied**: October 8, 2025
- **Testing**: Local diagnostic tests passed
- **Deployment**: Pending (requires `npx ampx sandbox` or production deploy)
- **Verification**: After deployment

## Support

If issues persist after deployment:

1. Check Lambda logs for specific error messages
2. Run diagnostic script: `python3 scripts/test-osm-client-direct.py`
3. Review `docs/OSM_REGRESSION_ROOT_CAUSE_FIXED.md` for technical details
4. Check spec tasks in `.kiro/specs/fix-osm-regression/tasks.md`
