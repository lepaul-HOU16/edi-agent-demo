# Restart Sandbox to Apply OSDU Configuration

## Issue Identified

The CloudWatch logs show:
```
❌ OSDU API configuration missing
Error: OSDU API is not configured
```

This means the Lambda function doesn't have the environment variables yet.

## Root Cause

The Amplify sandbox reads environment variables from `.env.local` **at startup time**. Since we just added the OSDU credentials, the currently running sandbox doesn't have them.

## Solution: Restart the Sandbox

### Step 1: Stop Current Sandbox

In the terminal where the sandbox is running, press:
```
Ctrl + C
```

Wait for the process to fully stop.

### Step 2: Restart Sandbox

```bash
npx ampx sandbox
```

This will:
1. Read the updated `.env.local` file
2. Inject `OSDU_API_URL` and `OSDU_API_KEY` into the Lambda
3. Redeploy with the new configuration

### Step 3: Wait for Deployment

Look for this message:
```
[Sandbox] Deployed
```

This usually takes 2-5 minutes.

### Step 4: Test OSDU Search

Once deployed, test in the catalog interface:
```
Show me OSDU wells
```

## Expected Behavior After Restart

### CloudWatch Logs Should Show:

```
✅ OSDU Proxy: Received request
✅ Calling OSDU API: { query, dataPartition, maxResults }
✅ OSDU API response: { recordCount: X }
```

### Frontend Should Show:

```
🔍 OSDU Search Results

[AI-generated answer from OSDU API]

Found X records

Records:
[Table with OSDU data]
```

## Verification Commands

### Check Lambda Environment Variables

After sandbox restarts, verify the Lambda has the variables:

```bash
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x \
  --query "Environment.Variables" \
  --output json
```

Expected output:
```json
{
  "OSDU_API_URL": "https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search",
  "OSDU_API_KEY": "sF1oCz1F...IvEb"
}
```

### Watch CloudWatch Logs

In a separate terminal:
```bash
aws logs tail /aws/lambda/amplify-digitalassistant-l-osduProxylambda1B527B7B-V45g0C7S5G2x --follow
```

Then test OSDU search and watch the logs in real-time.

## Why This Happens

### Amplify Gen 2 Behavior

1. **Startup**: Sandbox reads `.env.local` and injects variables into Lambda
2. **Runtime**: Lambda uses the injected environment variables
3. **File Changes**: Changes to `.env.local` don't auto-reload
4. **Restart Required**: Must restart sandbox to pick up new variables

### This is Normal

This is expected behavior for Amplify Gen 2. Environment variables are "baked in" at deployment time, not read dynamically.

## Quick Reference

| Action | Command |
|--------|---------|
| Stop sandbox | `Ctrl + C` in sandbox terminal |
| Start sandbox | `npx ampx sandbox` |
| Check logs | `aws logs tail /aws/lambda/[function-name] --follow` |
| Verify env vars | `aws lambda get-function-configuration --function-name [name]` |

## Troubleshooting

### If Still Getting "Not Configured" Error

1. **Verify .env.local has the credentials**
   ```bash
   grep OSDU_API .env.local
   ```

2. **Ensure sandbox fully stopped**
   ```bash
   ps aux | grep "ampx sandbox"
   # Should show no results
   ```

3. **Clear any cached state**
   ```bash
   rm -rf .amplify-hosting
   rm -rf node_modules/.cache
   ```

4. **Restart sandbox fresh**
   ```bash
   npx ampx sandbox
   ```

### If Sandbox Won't Start

1. **Check for port conflicts**
   ```bash
   lsof -i :3000
   ```

2. **Check for TypeScript errors**
   ```bash
   npx tsc --noEmit
   ```

3. **Check Amplify configuration**
   ```bash
   cat amplify/backend.ts | grep osduProxy
   ```

## Summary

✅ **Issue**: Lambda doesn't have environment variables
✅ **Cause**: Sandbox was running before credentials were added
✅ **Solution**: Restart sandbox to pick up new `.env.local` values
✅ **Time**: 2-5 minutes for full redeployment

---

**Next Action**: Stop and restart the sandbox now!
