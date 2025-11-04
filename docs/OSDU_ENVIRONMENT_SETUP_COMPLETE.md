# OSDU Environment Variables Setup - COMPLETE ✅

## Summary

I've successfully configured the OSDU API environment variables for the Lambda function. The configuration is now ready for deployment once you provide the actual OSDU API key.

## What Was Done

### 1. Backend Configuration (`amplify/backend.ts`)

✅ Added `OSDU_API_URL` environment variable to osduProxyFunction
✅ Added `OSDU_API_KEY` environment variable to osduProxyFunction
✅ Both variables are read from `process.env` at build time

```typescript
backend.osduProxyFunction.addEnvironment(
  'OSDU_API_URL',
  process.env.OSDU_API_URL || 'https://api.osdu.example.com/search'
);

backend.osduProxyFunction.addEnvironment(
  'OSDU_API_KEY',
  process.env.OSDU_API_KEY || ''
);
```

### 2. Local Environment (`.env.local`)

✅ Added OSDU Search API configuration section
✅ Set `OSDU_API_URL` to your OSDU platform endpoint
⚠️  `OSDU_API_KEY` is set to placeholder (needs actual key)

```bash
# OSDU Search API Configuration
OSDU_API_URL=https://osdu.vavourak.people.aws.dev/api/search/v2/query
OSDU_API_KEY=your-osdu-api-key-here  # ⚠️ Replace with actual key
```

### 3. Example File (`.env.local.example`)

✅ Updated with OSDU API configuration documentation
✅ Includes both `OSDU_API_URL` and `OSDU_API_KEY`
✅ Clear instructions for developers

### 4. Documentation

✅ Created comprehensive guide: `docs/OSDU_API_CONFIGURATION.md`
✅ Includes setup instructions, troubleshooting, and security best practices

### 5. Verification Script

✅ Created verification script: `scripts/verify-osdu-config.sh`
✅ Checks if environment variables are properly configured
✅ Provides actionable feedback

## Current Status

### Configuration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend Config | ✅ Complete | Environment variables added to Lambda |
| .env.local | ⚠️ Needs API Key | URL configured, key is placeholder |
| .env.local.example | ✅ Complete | Documented for other developers |
| Documentation | ✅ Complete | Comprehensive setup guide created |
| Verification Script | ✅ Complete | Ready to check configuration |

### Verification Results

```
✅ .env.local file exists
✅ OSDU_API_URL is configured
   URL: https://osdu.vavourak.people.aws.dev/api/search/v2/query

❌ OSDU_API_KEY is not set or using placeholder
   Current: your-osdu-api-key-here
   Update with your actual OSDU API key
```

## Next Steps

### 1. Obtain OSDU API Key

You need to get the actual OSDU API key from your OSDU platform administrator.

**How to get it:**
- Contact your OSDU platform administrator
- Request API access for the search endpoint
- Receive your API key (typically 40+ character string)

**Expected format:**
```
OSDU_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### 2. Update .env.local

Once you have the API key:

```bash
# Open .env.local
vim .env.local

# Find this line:
OSDU_API_KEY=your-osdu-api-key-here

# Replace with actual key:
OSDU_API_KEY=your-actual-api-key-from-administrator

# Save and close
```

### 3. Verify Configuration

Run the verification script:

```bash
./scripts/verify-osdu-config.sh
```

Expected output when complete:
```
✅ All OSDU configuration looks good!
```

### 4. Deploy to Sandbox

Deploy the updated configuration:

```bash
npx ampx sandbox
```

Wait for "Deployed" message (may take 5-10 minutes).

### 5. Test OSDU Search

In the catalog interface, test with:

```
Show me OSDU wells
```

Expected behavior:
- Loading message appears: "Searching OSDU data..."
- Results display with AI answer and record table
- No errors in browser console

### 6. Verify in CloudWatch

Check Lambda logs to confirm API calls:

```bash
# Find the function name
aws lambda list-functions | grep osduProxy

# View logs
aws logs tail /aws/lambda/[function-name] --follow
```

Look for:
- ✅ "OSDU Proxy: Received request"
- ✅ "Calling OSDU API"
- ✅ "OSDU API response"

## Security Notes

### ✅ Secure Configuration

- API key stored in `.env.local` (gitignored)
- Never committed to version control
- Only accessible to Lambda function
- Not exposed to frontend
- Sanitized in error messages

### ⚠️ Important Reminders

1. **Never commit** the actual API key to Git
2. **Never hardcode** the API key in source code
3. **Never log** the API key in CloudWatch
4. **Rotate keys** periodically for security
5. **Use proxy** to keep key server-side only

## Troubleshooting

### If OSDU Search Fails

1. **Check environment variables**
   ```bash
   ./scripts/verify-osdu-config.sh
   ```

2. **Check CloudWatch logs**
   ```bash
   aws logs tail /aws/lambda/[osduProxy-function] --follow
   ```

3. **Test API key directly**
   ```bash
   curl -X POST https://osdu.vavourak.people.aws.dev/api/search/v2/query \
     -H "Content-Type: application/json" \
     -H "x-api-key: your-api-key" \
     -d '{"query": "wells", "dataPartition": "osdu", "maxResults": 10}'
   ```

4. **Verify deployment**
   - Ensure sandbox is fully deployed
   - Check Lambda function has environment variables
   - Verify no TypeScript errors

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "OSDU API is not configured" | Env vars not set | Update .env.local and redeploy |
| "OSDU API request failed: 401" | Invalid API key | Verify key with administrator |
| "OSDU API request failed: 404" | Wrong URL | Check OSDU_API_URL endpoint |
| No results | Query doesn't match | Try different search terms |

## Files Modified

```
✅ amplify/backend.ts                    - Added environment variables
✅ .env.local                            - Added OSDU configuration
✅ .env.local.example                    - Updated documentation
✅ docs/OSDU_API_CONFIGURATION.md        - Created setup guide
✅ scripts/verify-osdu-config.sh         - Created verification script
```

## Integration Complete

The OSDU API environment variables are now properly configured in the Lambda function. The integration is ready for deployment once you provide the actual API key.

### What Works Now

✅ Backend reads environment variables from `.env.local`
✅ Lambda function receives `OSDU_API_URL` and `OSDU_API_KEY`
✅ API key is never exposed to frontend
✅ Secure proxy pattern implemented
✅ Error messages sanitized
✅ Comprehensive documentation provided

### What You Need to Do

1. ⚠️ Obtain actual OSDU API key from administrator
2. ⚠️ Update `OSDU_API_KEY` in `.env.local`
3. ⚠️ Run verification script to confirm
4. ⚠️ Deploy to sandbox
5. ⚠️ Test OSDU search functionality

---

**Status**: ✅ Configuration Complete
**Waiting for**: Actual OSDU API key
**Ready for**: Deployment and testing
