# 🔧 Fix: Renewable Energy Features Disabled

**Root Cause Found**: Lambda environment variables not set  
**Solution**: Deploy backend with environment variables exported

---

## 🎯 The Problem

The "disabled" message comes from the **Lambda function**, not the frontend. Here's what's happening:

1. ✅ `.env.local` has `NEXT_PUBLIC_RENEWABLE_ENABLED=true`
2. ✅ Frontend (Next.js) can see this variable
3. ❌ **Lambda function** doesn't have these environment variables
4. ❌ Lambda returns "disabled" message

### Why This Happens

The Lambda function reads from `process.env` at **deployment time**. Simply updating `.env.local` doesn't update the Lambda - you need to **redeploy** with the environment variables exported.

---

## ✅ Solution: Deploy with Environment Variables

### Option 1: Use the Deployment Script (Recommended)

```bash
./scripts/deploy-with-renewable-enabled.sh
```

This script:
1. Exports all renewable environment variables
2. Deploys the Amplify backend
3. Lambda picks up the new configuration

### Option 2: Manual Deployment

```bash
# Export environment variables
export NEXT_PUBLIC_RENEWABLE_ENABLED=true
export NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT="arn:aws:bedrock-agentcore:us-east-1:484907533441:agent-runtime/wind_farm_layout_agent-7DnHlIBg3o"
export NEXT_PUBLIC_RENEWABLE_S3_BUCKET="renewable-energy-artifacts-484907533441"
export NEXT_PUBLIC_RENEWABLE_REGION="us-east-1"
export NEXT_PUBLIC_RENEWABLE_AWS_REGION="us-west-2"

# Deploy
npx ampx sandbox --once
```

---

## ⏱️ Deployment Time

- **Expected Duration**: 2-3 minutes
- **What Happens**: Lambda function is updated with new environment variables
- **Result**: Renewable features will be enabled

---

## 🧪 After Deployment

### 1. Restart Dev Server (if running)

```bash
# Stop with Ctrl+C, then:
npm run dev
```

### 2. Test in Chat

Open http://localhost:3000/chat and try:

```
Analyze wind farm potential at coordinates 35.067482, -101.395466
```

### Expected Result ✅

- No "disabled" message
- Agent processes the query
- Returns wind farm analysis (may be mock data initially)

---

## 🔍 How to Verify Lambda Has Variables

After deployment, check Lambda configuration:

```bash
# Get Lambda function name
aws lambda list-functions --query 'Functions[?contains(FunctionName, `lightweightAgent`)].FunctionName' --output text

# Check environment variables (replace <function-name>)
aws lambda get-function-configuration \
  --function-name <function-name> \
  --query 'Environment.Variables' \
  --output json
```

Should show:
```json
{
  "NEXT_PUBLIC_RENEWABLE_ENABLED": "true",
  "NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT": "arn:aws:bedrock-agentcore:...",
  ...
}
```

---

## 📋 Configuration Flow

### Frontend (Next.js)
```
.env.local → process.env → Frontend code
```
✅ Works immediately after restart

### Backend (Lambda)
```
Shell environment → Amplify deployment → Lambda environment
```
❌ Requires deployment to update

---

## 🛠️ Troubleshooting

### Issue: Still shows "disabled" after deployment

**Check 1**: Verify deployment completed successfully
```bash
# Look for "✅ Deployment complete!" message
```

**Check 2**: Verify Lambda has the variables
```bash
aws lambda get-function-configuration \
  --function-name <your-function-name> \
  --query 'Environment.Variables.NEXT_PUBLIC_RENEWABLE_ENABLED'
```

**Check 3**: Check Lambda logs
```bash
aws logs tail /aws/lambda/<function-name> --follow
# Look for: "✅ AgentRouter: Renewable energy integration enabled"
```

### Issue: Deployment fails

**Solution 1**: Check AWS credentials
```bash
aws sts get-caller-identity
```

**Solution 2**: Check Amplify sandbox status
```bash
npx ampx sandbox list
```

**Solution 3**: Try clean deployment
```bash
npx ampx sandbox delete
npx ampx sandbox --once
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User Query: "Analyze wind farm..."                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js Frontend                                             │
│ ✅ Reads: .env.local                                         │
│ ✅ Has: NEXT_PUBLIC_RENEWABLE_ENABLED=true                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Amplify GraphQL API                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Lambda Function (lightweightAgent)                           │
│ ❌ Reads: Lambda Environment Variables                       │
│ ❌ Needs: NEXT_PUBLIC_RENEWABLE_ENABLED=true                 │
│                                                              │
│ This is where the "disabled" check happens!                  │
│                                                              │
│ Code: amplify/functions/agents/agentRouter.ts               │
│   if (!this.renewableEnabled) {                             │
│     return "features are currently disabled"                 │
│   }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Fix Summary

1. **Run deployment script**:
   ```bash
   ./scripts/deploy-with-renewable-enabled.sh
   ```

2. **Wait 2-3 minutes** for deployment

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

4. **Test in chat**:
   ```
   Analyze wind farm potential at coordinates 35.067482, -101.395466
   ```

---

## ✨ What Happens After Fix

### Lambda Logs Will Show:
```
✅ AgentRouter: Renewable energy integration enabled
🌱 Routing to Renewable Energy Agent
```

### Chat Response Will Show:
- Wind farm analysis (real or mock data)
- No "disabled" message
- Thought steps and artifacts

---

## 📞 Need Help?

If deployment fails or features still disabled:

1. Check deployment logs for errors
2. Verify AWS credentials are configured
3. Check Lambda CloudWatch logs
4. Verify AgentCore runtime is accessible

---

**🚀 Run the deployment script now!**

```bash
./scripts/deploy-with-renewable-enabled.sh
```

This will fix the issue in 2-3 minutes.
