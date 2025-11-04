# OSDU Search Integration - Deployment Instructions

## Deployment Status: ✅ COMPLETE

The OSDU search integration has been successfully deployed to the sandbox environment.

## Deployment Summary

### 1. Lambda Function Deployed
- **Function Name**: `amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x`
- **Runtime**: Node.js 20.x
- **Timeout**: 30 seconds
- **State**: Active
- **Last Update**: Successful

### 2. Environment Variables Configured
- ✅ `OSDU_API_URL`: `https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search`
- ✅ `OSDU_API_KEY`: Set (40 characters)

### 3. GraphQL Schema Updated
- ✅ `osduSearch` query added to schema
- ✅ Query accepts: `query` (required), `dataPartition` (optional), `maxResults` (optional)
- ✅ Query returns: JSON with `answer`, `recordCount`, and `records`

### 4. Frontend Integration Complete
- ✅ Intent detection implemented in catalog page
- ✅ OSDU query execution integrated
- ✅ Loading states configured
- ✅ Error handling with fallback
- ✅ Result formatting with markdown and tables

## Verification Results

### Deployment Verification
```bash
$ bash scripts/verify-osdu-deployment.sh

✅ Lambda function found
✅ OSDU_API_URL is set
✅ OSDU_API_KEY is set (length: 40)
✅ Lambda state: Active
✅ Last update status: Successful
✅ CloudWatch log group exists
✅ amplify_outputs.json exists
✅ osduSearch query found in schema
```

### Integration Tests
```bash
$ node tests/test-osdu-catalog-integration.js

✅ Intent Detection: 5/5 tests passed
✅ Message Format: Passed
✅ Loading State: Passed
✅ Error Handling: Passed
```

## CloudWatch Logs

### Log Group
- **Name**: `/aws/lambda/amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x`
- **Status**: Active
- **Recent Errors**: None (previous error was before API key was set)

### Monitoring Commands
```bash
# Tail logs in real-time
aws logs tail /aws/lambda/amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x --follow

# Check for errors in last hour
aws logs filter-log-events \
  --log-group-name /aws/lambda/amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --filter-pattern "ERROR"
```

## Testing the Integration

### 1. Test via Catalog Interface
1. Open the catalog page: `http://localhost:3000/catalog`
2. Enter an OSDU query: `"Show me OSDU wells"`
3. Verify loading indicator: "🔍 Searching OSDU data..."
4. Verify results display with:
   - AI-generated answer
   - Record count
   - Table of records (if available)

### 2. Test Intent Detection
- **OSDU queries** (should route to OSDU API):
  - "Show me OSDU wells"
  - "Search OSDU data for wells"
  - "osdu search"
  
- **Catalog queries** (should route to catalog):
  - "Show me wells in Texas"
  - "Find wells with depth > 10000"

### 3. Test Error Handling
To test error handling, temporarily remove the API key:
```bash
aws lambda update-function-configuration \
  --function-name amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x \
  --environment 'Variables={OSDU_API_URL=https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search,OSDU_API_KEY="",AMPLIFY_SSM_ENV_CONFIG="{}"}'
```

Then test with an OSDU query and verify the error message displays.

**Remember to restore the API key after testing!**

## Deployment Architecture

```
User Query (Catalog Page)
    ↓
Intent Detection (Frontend)
    ↓
    ├─→ [OSDU Intent] → osduSearch GraphQL Query
    │                        ↓
    │                   OSDU Proxy Lambda
    │                        ↓
    │                   External OSDU API
    │                        ↓
    │                   Response with artifacts
    │
    └─→ [Catalog Intent] → catalogSearch GraphQL Query
                                ↓
                           Catalog Lambda
                                ↓
                           Response with map data
```

## Security Verification

### ✅ API Key Security Checklist
- [x] API key stored in Lambda environment variables only
- [x] API key NOT in frontend code
- [x] API key NOT in version control
- [x] API key NOT logged in CloudWatch
- [x] Error messages sanitized (no key exposure)
- [x] `.env.local` in `.gitignore`
- [x] `.env.local.example` has placeholder only

### Environment Variable Verification
```bash
# Verify API key is set (but not displayed)
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x \
  --query "Environment.Variables.OSDU_API_KEY" \
  --output text | wc -c
# Should output: 40 (length of API key)
```

## Troubleshooting

### Issue: OSDU search returns error
**Solution**: Check CloudWatch logs for specific error message
```bash
aws logs tail /aws/lambda/amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x --follow
```

### Issue: API key not set
**Solution**: Set the API key using AWS CLI
```bash
aws lambda update-function-configuration \
  --function-name amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x \
  --environment 'Variables={OSDU_API_URL=https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search,OSDU_API_KEY=<your-osdu-api-key-here>,AMPLIFY_SSM_ENV_CONFIG="{}"}'
```

### Issue: Query not routing to OSDU
**Solution**: Verify intent detection by checking browser console logs
- Should see: `🔍 OSDU search intent detected`

### Issue: Results not displaying
**Solution**: Check browser console for errors and verify artifact structure

## Maintenance

### Updating the API Key
If the OSDU API key needs to be rotated:
```bash
# 1. Update Lambda environment variable
aws lambda update-function-configuration \
  --function-name amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x \
  --environment 'Variables={OSDU_API_URL=https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search,OSDU_API_KEY=NEW_API_KEY_HERE,AMPLIFY_SSM_ENV_CONFIG="{}"}'

# 2. Verify update
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x \
  --query "Configuration.LastUpdateStatus"
```

### Monitoring Performance
```bash
# Check Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum
```

## Next Steps

1. ✅ Deploy to sandbox - **COMPLETE**
2. ✅ Set OSDU_API_KEY - **COMPLETE**
3. ✅ Verify Lambda deployment - **COMPLETE**
4. ✅ Check CloudWatch logs - **COMPLETE**
5. ⏭️ **User validation** - Test in actual UI
6. ⏭️ **End-to-end testing** - Verify complete workflow

## Deployment Date
- **Date**: November 3, 2025
- **Time**: 6:20 PM EST
- **Environment**: Sandbox
- **Status**: ✅ Successfully Deployed
