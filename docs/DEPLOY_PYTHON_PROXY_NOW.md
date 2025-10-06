# 🚀 Deploy Python Proxy Lambda - Replace Mock Data with Real Data

**Date**: October 3, 2025  
**Status**: Ready to deploy  
**Goal**: Deploy Python Lambda proxy to connect TypeScript to AgentCore and get real data

---

## ✅ What Was Done

### 1. Python Lambda Created
- **File**: `amplify/functions/renewableAgentCoreProxy/handler.py`
- Uses boto3 to call bedrock-agentcore service
- Processes streaming responses from AgentCore
- Returns data in EDI Platform format

### 2. Backend Configuration Updated
- **File**: `amplify/backend.ts`
- Imported and registered Python proxy Lambda
- Added IAM permissions for bedrock-agentcore access
- Added Lambda invoke permissions for TypeScript → Python calls
- Added environment variable with proxy function name

### 3. Dependencies Configured
- **File**: `amplify/functions/renewableAgentCoreProxy/requirements.txt`
- boto3 and botocore specified

---

## 🎯 What This Fixes

### Before (Current State):
```
User Query → TypeScript Lambda → Tries AWS SDK → Fails → Returns Mock Data ❌
```

### After (With Python Proxy):
```
User Query → TypeScript Lambda → Python Proxy → boto3 → AgentCore → Real Data ✅
```

---

## 🚀 Deploy Now

### Step 1: Verify Environment Variables

Make sure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT="arn:aws:bedrock-agentcore:us-east-1:484907533441:agent-runtime/wind_farm_layout_agent-7DnHlIBg3o"
NEXT_PUBLIC_RENEWABLE_S3_BUCKET="renewable-energy-artifacts-484907533441"
NEXT_PUBLIC_RENEWABLE_REGION="us-east-1"
```

### Step 2: Deploy Backend

```bash
npx ampx sandbox
```

This will:
- ✅ Deploy new Python Lambda (renewableAgentCoreProxy)
- ✅ Update TypeScript Lambda with proxy function name
- ✅ Configure IAM permissions
- ✅ Takes 3-5 minutes

### Step 3: Verify Deployment

Check that the Python Lambda was created:

```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `renewableAgentCoreProxy`)].{Name:FunctionName, Runtime:Runtime}' --output table
```

Expected output:
```
-----------------------------------------------------------
|                    ListFunctions                        |
+-------------------------------+-------------------------+
|            Name               |        Runtime          |
+-------------------------------+-------------------------+
| amplify-...-renewableAgent... | python3.12              |
+-------------------------------+-------------------------+
```

### Step 4: Test with Real Data

Open http://localhost:3000/chat and try:

```
Analyze wind farm potential at coordinates 35.067482, -101.395466
```

---

## ✅ Success Indicators

### In Python Lambda Logs:
```bash
aws logs tail /aws/lambda/amplify-digitalassistant-renewableAgentCoreProxy --follow
```

You should see:
```
🌱 RenewableAgentCoreProxy: Received event
🌱 Calling AgentCore with prompt: Analyze wind farm...
🌱 Runtime ARN: arn:aws:bedrock-agentcore:...
✅ AgentCore response received: 1234 chars
```

### In Chat Response:
- ✅ Real wind data analysis
- ✅ Actual terrain information  
- ✅ Real coordinates (35.067482, -101.395466)
- ✅ Authentic energy estimates
- ❌ NO "mock-project-123" references
- ❌ NO "Mock Folium Map" text

---

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Query                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         TypeScript Lambda (lightweightAgent)             │
│         - RenewableProxyAgent                            │
│         - RenewableClient                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│      Python Lambda (renewableAgentCoreProxy) ← NEW!     │
│      - Uses boto3 for bedrock-agentcore                  │
│      - Processes streaming responses                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         AWS Bedrock AgentCore Runtime                    │
│         - Your deployed wind farm agent                  │
│         - Strands multi-agent system                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Real Wind Farm Analysis                     │
│              - NREL wind data                            │
│              - Terrain analysis                          │
│              - Turbine layout                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: Python Lambda not deployed

**Check**:
```bash
aws lambda list-functions | grep renewable
```

**Solution**: Make sure you ran `npx ampx sandbox` and it completed successfully.

---

### Issue: Permission denied errors

**Check Python Lambda logs**:
```bash
aws logs tail /aws/lambda/amplify-digitalassistant-renewableAgentCoreProxy --follow
```

**Solution**: The IAM permissions are configured in `amplify/backend.ts`. If you see permission errors, verify the Lambda role has:
- `bedrock-agentcore:InvokeAgentRuntime`
- `bedrock-agentcore:InvokeAgent`

---

### Issue: Still seeing mock data

**Check TypeScript Lambda logs**:
```bash
aws logs tail /aws/lambda/amplify-digitalassistant--lightweightAgent --follow
```

Look for:
```
RenewableClient: Invoking Python proxy Lambda
```

If you don't see this, the TypeScript code might not be finding the Python Lambda.

**Solution**: Verify environment variable is set:
```bash
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant--lightweightAgent \
  --query 'Environment.Variables.RENEWABLE_PROXY_FUNCTION_NAME'
```

---

### Issue: Lambda timeout

**Symptom**: Request takes > 15 minutes

**Solution**: The timeout is already set to 900 seconds (15 minutes) in `resource.ts`. If you need more time, increase it:

```typescript
timeoutSeconds: 1800, // 30 minutes
```

---

## 📊 Comparison: Before vs After

### Before (Mock Data):
```json
{
  "message": "Terrain analysis completed successfully...",
  "artifacts": [{
    "type": "terrain",
    "data": {
      "mapHtml": "<div>Mock Folium Map</div>",
      "metrics": {
        "suitabilityScore": 85
      }
    },
    "metadata": {
      "projectId": "mock-project-123"  ← MOCK!
    }
  }]
}
```

### After (Real Data):
```json
{
  "message": "Based on NREL wind resource data, the site at 35.067482, -101.395466 shows excellent wind potential...",
  "artifacts": [{
    "type": "terrain",
    "data": {
      "mapHtml": "<iframe src='...real folium interactive map...'></iframe>",
      "metrics": {
        "suitabilityScore": 87.3,
        "windSpeed": 8.2,
        "capacity": 45.6
      }
    },
    "metadata": {
      "projectId": "wind-farm-abc123",  ← REAL!
      "coordinates": {
        "lat": 35.067482,
        "lng": -101.395466
      }
    }
  }]
}
```

---

## 🎉 Expected Results

After deployment, you should see:

✅ Python Lambda deployed with python3.12 runtime  
✅ TypeScript Lambda has RENEWABLE_PROXY_FUNCTION_NAME env var  
✅ IAM permissions configured for bedrock-agentcore  
✅ Lambda invoke permissions configured  
✅ Real coordinates in responses  
✅ Real wind data analysis  
✅ No "mock" references anywhere  
✅ Python Lambda logs show AgentCore calls  
✅ Response time < 30 seconds  

---

## 📞 Quick Commands Reference

```bash
# Deploy everything
npx ampx sandbox

# Check Python Lambda exists
aws lambda list-functions | grep renewableAgentCoreProxy

# View Python Lambda logs (real-time)
aws logs tail /aws/lambda/amplify-digitalassistant-renewableAgentCoreProxy --follow

# View TypeScript Lambda logs (real-time)
aws logs tail /aws/lambda/amplify-digitalassistant--lightweightAgent --follow

# Check environment variables
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant--lightweightAgent \
  --query 'Environment.Variables'

# Test Python Lambda directly
aws lambda invoke \
  --function-name amplify-digitalassistant-renewableAgentCoreProxy \
  --payload '{"prompt":"test wind farm","agentRuntimeArn":"arn:aws:bedrock-agentcore:us-east-1:484907533441:agent-runtime/wind_farm_layout_agent-7DnHlIBg3o"}' \
  response.json && cat response.json
```

---

## 🎯 Next Steps After Deployment

1. **Test the integration** with renewable queries
2. **Verify real data** appears in responses
3. **Check logs** to confirm AgentCore is being called
4. **Monitor performance** and response times
5. **Update documentation** with any findings

---

**🚀 Ready to deploy? Run this now:**

```bash
npx ampx sandbox
```

This will finally connect your UI to the real AgentCore runtime and replace all mock data with real wind farm analysis!
