# OSDU API Configuration Guide

## Overview

The OSDU Search API integration requires two environment variables to be configured:
- `OSDU_API_URL`: The endpoint URL for OSDU search queries
- `OSDU_API_KEY`: The API key for authentication (kept secret)

## Configuration Files Updated

### 1. Backend Configuration (`amplify/backend.ts`)

Added environment variables to the `osduProxyFunction`:

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

### 2. Environment Variables (`.env.local`)

Added OSDU Search API configuration:

```bash
# OSDU Search API Configuration
# Used by the osduProxy Lambda function for external OSDU data queries
OSDU_API_URL=https://osdu.vavourak.people.aws.dev/api/search/v2/query
OSDU_API_KEY=your-osdu-api-key-here
```

### 3. Example File (`.env.local.example`)

Updated the example file to document both variables:

```bash
# OSDU Search API URL - The endpoint for OSDU search queries
# Example: https://api.osdu.example.com/search
OSDU_API_URL=https://api.osdu.example.com/search

# OSDU Search API Key - NEVER commit the real key to version control
OSDU_API_KEY=your-osdu-api-key-here
```

## How It Works

### Security Flow

1. **Frontend**: User enters query with "OSDU" keyword
2. **GraphQL**: Query routed to `osduSearch` resolver
3. **Lambda Proxy**: `osduProxyFunction` receives request
4. **Environment Variables**: Lambda reads `OSDU_API_URL` and `OSDU_API_KEY` from environment
5. **OSDU API**: Lambda makes authenticated request to OSDU API
6. **Response**: Results returned to frontend (API key never exposed)

### Environment Variable Flow

```
.env.local (local development)
    ↓
process.env.OSDU_API_KEY
    ↓
amplify/backend.ts
    ↓
Lambda Environment Variables
    ↓
osduProxy handler.ts
    ↓
OSDU API Request
```

## Setting the API Key

### For Local Development

1. Open `.env.local` file
2. Replace `your-osdu-api-key-here` with your actual API key
3. Save the file
4. Restart the Amplify sandbox: `npx ampx sandbox`

### For Production Deployment

The API key will be automatically set from your local `.env.local` file when you deploy via Amplify sandbox. The environment variables are read at build time and injected into the Lambda function.

**Important**: Never commit the actual API key to version control. The `.env.local` file is gitignored.

## Obtaining the OSDU API Key

To get your OSDU API key:

1. Contact your OSDU platform administrator
2. Request API access for the search endpoint
3. Receive your API key (typically 40+ character string)
4. Add it to `.env.local` file

## Testing the Configuration

### 1. Verify Environment Variables

After setting the variables, verify they're loaded:

```bash
# Check if variables are set
echo $OSDU_API_URL
echo $OSDU_API_KEY
```

### 2. Deploy to Sandbox

```bash
npx ampx sandbox
```

Wait for deployment to complete (look for "Deployed" message).

### 3. Test OSDU Search

In the catalog interface, try a query:

```
Show me OSDU wells
```

Expected behavior:
- Loading message: "Searching OSDU data..."
- Results display with AI answer and record table
- No errors in console

### 4. Check CloudWatch Logs

If there are issues, check the Lambda logs:

```bash
# Find the osduProxy function name
aws lambda list-functions | grep osduProxy

# View logs
aws logs tail /aws/lambda/[function-name] --follow
```

Look for:
- ✅ "OSDU Proxy: Received request"
- ✅ "Calling OSDU API"
- ✅ "OSDU API response"

## Troubleshooting

### Error: "OSDU API is not configured"

**Cause**: Environment variables not set in Lambda

**Solution**:
1. Verify `.env.local` has both `OSDU_API_URL` and `OSDU_API_KEY`
2. Restart Amplify sandbox: `npx ampx sandbox`
3. Wait for full deployment
4. Test again

### Error: "OSDU API request failed: 401"

**Cause**: Invalid or expired API key

**Solution**:
1. Verify API key is correct in `.env.local`
2. Contact OSDU administrator to verify key is active
3. Request new API key if needed
4. Update `.env.local` and redeploy

### Error: "OSDU API request failed: 404"

**Cause**: Incorrect API URL

**Solution**:
1. Verify `OSDU_API_URL` points to correct endpoint
2. Check with OSDU administrator for correct URL
3. Update `.env.local` and redeploy

### No Results Returned

**Cause**: Query doesn't match any OSDU records

**Solution**:
1. Try different search queries
2. Verify OSDU platform has data
3. Check CloudWatch logs for API response details

## Security Best Practices

### ✅ DO:
- Store API key in `.env.local` (gitignored)
- Use environment variables for configuration
- Keep API key secret and secure
- Rotate API keys periodically
- Use proxy Lambda to hide API key from frontend

### ❌ DON'T:
- Commit API key to version control
- Hardcode API key in source code
- Expose API key in frontend code
- Share API key in documentation
- Log API key in CloudWatch logs

## Current Configuration

Based on your existing OSDU platform setup:

```bash
OSDU_API_URL=https://osdu.vavourak.people.aws.dev/api/search/v2/query
OSDU_API_KEY=your-osdu-api-key-here  # Replace with actual key
```

The URL is derived from your existing `EDI_PLATFORM_URL` with the standard OSDU search endpoint path.

## Next Steps

1. **Obtain API Key**: Contact OSDU administrator for search API key
2. **Update .env.local**: Replace `your-osdu-api-key-here` with actual key
3. **Deploy**: Run `npx ampx sandbox` to deploy with new configuration
4. **Test**: Try OSDU search query in catalog interface
5. **Verify**: Check CloudWatch logs for successful API calls

## Support

If you encounter issues:
1. Check CloudWatch logs for detailed error messages
2. Verify environment variables are set correctly
3. Test API key with curl/Postman directly
4. Contact OSDU platform administrator for API access issues

---

**Status**: ✅ Configuration Complete
**Next Action**: Obtain OSDU API key and update `.env.local`
