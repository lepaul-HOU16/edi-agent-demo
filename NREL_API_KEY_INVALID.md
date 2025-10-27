# NREL API Key Invalid - Root Cause Found

## Status: 🔴 INVALID API KEY

**The 403 error is NOT because of HTTP vs HTTPS.**
**The 403 error is because the API key is INVALID.**

## Test Results

Tested the NREL API directly with the deployed API key:

```bash
curl "https://developer.nrel.gov/api/wind-toolkit/v2/wind/wtk-bchrrr-v1-0-0-download.csv?api_key=Fkh6pFT1SPsn9SBw8TDMSl7EnjEe&..."
```

**Response:**
```
Error Code,Error Message
"API_KEY_INVALID","An invalid api_key was supplied. Get one at https://developer.nrel.gov/signup/"
HTTP Status: 403
```

## Current API Key

- **Key:** `Fkh6pFT1SPsn9SBw8TDMSl7EnjEe`
- **Status:** ❌ INVALID
- **Source:** Environment variable `NREL_API_KEY`

## What Needs to Happen

### Option 1: Get a Valid API Key
1. Go to: https://developer.nrel.gov/signup/
2. Sign up for a free API key
3. Update the environment variable

### Option 2: Use Existing Valid Key
If you have a valid NREL API key:
1. Update the Lambda environment variable
2. Or update AWS Secrets Manager

## How to Update API Key

### Method 1: Update Lambda Environment Variable Directly
```bash
aws lambda update-function-configuration \
  --function-name $(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text) \
  --environment "Variables={NREL_API_KEY=YOUR_VALID_KEY_HERE}"
```

### Method 2: Update in backend.ts
```typescript
// In amplify/backend.ts
backend.renewableSimulationTool.addEnvironment('NREL_API_KEY', 'YOUR_VALID_KEY_HERE');
```

Then restart sandbox.

### Method 3: Use AWS Secrets Manager
```bash
aws secretsmanager create-secret \
  --name nrel/api_key \
  --secret-string '{"api_key":"YOUR_VALID_KEY_HERE"}'
```

The code already checks Secrets Manager as a fallback.

## Why This Happened

The API key in the environment variable is either:
1. **Expired** - NREL API keys can expire
2. **Invalid** - Never was a valid key
3. **Revoked** - Was valid but got revoked
4. **Demo Key** - Was a placeholder that doesn't work

## Timeline

- 12:30 PM: Deployed with HTTP URL
- 12:45 PM: Fixed to HTTPS URL
- 13:05 PM: Updated Dockerfile to force rebuild
- 13:09 PM: Deployed with HTTPS URL
- 13:10 PM: Still getting 403
- **13:15 PM: Discovered API key is INVALID**

## Next Steps

1. **Get valid API key** from https://developer.nrel.gov/signup/
2. **Update environment variable** using one of the methods above
3. **Test** with: `node tests/test-nrel-https-fix.js`
4. **Verify** in UI

## Important Notes

- The HTTPS fix WAS correct and IS deployed
- The Docker image rebuild WAS successful
- The code is working correctly
- The ONLY problem is the invalid API key

---

**Action Required:** Get valid NREL API key
**Blocker:** Invalid API key
**ETA:** 5 minutes to get key + 2 minutes to update
