# 🔧 Fix "Renewable energy features are currently disabled" Message

**Issue**: Getting "disabled" message even though environment variables are set  
**Root Cause**: Backend Lambda hasn't been deployed with the environment variables  
**Solution**: Deploy the backend

---

## Quick Fix

The environment variables are set in `.env.local`:
```bash
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=arn:aws:bedrock-agentcore:us-east-1:484907533441:agent-runtime/wind_farm_layout_agent-7DnHlIBg3o
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=renewable-energy-artifacts-484907533441
NEXT_PUBLIC_RENEWABLE_REGION=us-east-1
```

But the Lambda function needs to be deployed to pick them up.

### Deploy Now:

```bash
npx ampx sandbox
```

This will:
1. ✅ Deploy Python Lambda proxy
2. ✅ Update TypeScript Lambda with environment variables
3. ✅ Enable renewable features

**Time**: 3-5 minutes

---

## Why This Happens

The Lambda function checks `process.env.NEXT_PUBLIC_RENEWABLE_ENABLED` which is configured in `amplify/data/resource.ts`:

```typescript
environment: {
  NEXT_PUBLIC_RENEWABLE_ENABLED: process.env.NEXT_PUBLIC_RENEWABLE_ENABLED || 'false',
  NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT: process.env.NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT || '',
  // ...
}
```

These values are read from `.env.local` during deployment and baked into the Lambda environment.

---

## Verification

After deployment, check Lambda environment variables:

```bash
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant--lightweightAgent \
  --query 'Environment.Variables' \
  | grep RENEWABLE
```

You should see:
```json
{
  "NEXT_PUBLIC_RENEWABLE_ENABLED": "true",
  "NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT": "arn:aws:bedrock-agentcore:...",
  "NEXT_PUBLIC_RENEWABLE_S3_BUCKET": "renewable-energy-artifacts-484907533441"
}
```

---

## Test After Deployment

Try a renewable query:
```
Analyze wind farm potential at coordinates 35.067482, -101.395466
```

You should see:
- ✅ Real wind farm analysis
- ✅ No "disabled" message
- ✅ Real data (not mock)

---

## If Still Disabled After Deployment

1. **Check Lambda logs**:
```bash
aws logs tail /aws/lambda/amplify-digitalassistant--lightweightAgent --follow
```

Look for:
```
✅ AgentRouter: Renewable energy integration enabled
```

Or:
```
ℹ️ AgentRouter: Renewable energy integration disabled via config
```

2. **Check environment variables in Lambda**:
```bash
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant--lightweightAgent \
  --query 'Environment.Variables.NEXT_PUBLIC_RENEWABLE_ENABLED'
```

Should return: `"true"`

3. **Restart dev server** (if testing locally):
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Summary

**Problem**: Lambda doesn't have environment variables yet  
**Solution**: Deploy with `npx ampx sandbox`  
**Expected Result**: Renewable features enabled, real data flowing  

---

**🚀 Deploy now:**

```bash
npx ampx sandbox
```
