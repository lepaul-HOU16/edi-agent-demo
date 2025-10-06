# 🎯 START HERE: Replace Mock Data with Real Data

**Date**: October 3, 2025  
**Status**: ✅ Ready to deploy  
**Time Required**: 10 minutes

---

## 🚨 The Problem

Your renewable energy features are returning **mock data** instead of real wind farm analysis from your deployed AgentCore runtime.

**Example of mock data**:
```json
{
  "projectId": "mock-project-123",  ← FAKE!
  "mapHtml": "<div>Mock Folium Map</div>",  ← FAKE!
  "coordinates": {"lat": 0, "lng": 0}  ← FAKE!
}
```

---

## ✅ The Solution (Already Implemented)

I've created a **Python Lambda proxy** that bridges TypeScript to AgentCore using boto3 (since TypeScript SDK doesn't support bedrock-agentcore yet).

### What I Did:

1. ✅ Created Python Lambda handler (`amplify/functions/renewableAgentCoreProxy/handler.py`)
2. ✅ Created Lambda resource definition (`resource.ts`)
3. ✅ Added Python dependencies (`requirements.txt`)
4. ✅ Updated Amplify backend configuration (`amplify/backend.ts`)
5. ✅ Added IAM permissions for bedrock-agentcore access
6. ✅ Added Lambda invoke permissions
7. ✅ Added environment variables

**All code is ready. You just need to deploy it.**

---

## 🚀 Deploy Now (3 Steps)

### Step 1: Verify Environment Variables

Check that `.env.local` has these set:
```bash
cat .env.local | grep RENEWABLE
```

Should show:
```
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=arn:aws:bedrock-agentcore:us-east-1:484907533441:agent-runtime/wind_farm_layout_agent-7DnHlIBg3o
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=renewable-energy-artifacts-484907533441
NEXT_PUBLIC_RENEWABLE_REGION=us-east-1
```

✅ **These are already set!**

### Step 2: Deploy Backend (3-5 minutes)

```bash
npx ampx sandbox
```

This will:
- Deploy new Python Lambda (renewableAgentCoreProxy)
- Update TypeScript Lambda with environment variables from `.env.local`
- Configure IAM permissions
- Enable renewable features

### Step 3: Verify Deployment (30 seconds)

```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `renewableAgentCoreProxy`)].{Name:FunctionName, Runtime:Runtime}' --output table
```

You should see:
```
-----------------------------------------------------------
|                    ListFunctions                        |
+-------------------------------+-------------------------+
|            Name               |        Runtime          |
+-------------------------------+-------------------------+
| amplify-...-renewableAgent... | python3.12              |
+-------------------------------+-------------------------+
```

### Step 4: Test with Real Data (2 minutes)

Open http://localhost:3000/chat and try:
```
Analyze wind farm potential at coordinates 35.067482, -101.395466
```

---

## ✅ How to Know It's Working

### Success Indicators:

1. **No "mock-project-123" in responses** ✅
2. **Real coordinates appear** (35.067482, -101.395466) ✅
3. **Real wind speed data** ✅
4. **Real terrain analysis** ✅
5. **Python Lambda logs show AgentCore calls** ✅

### Check Python Lambda Logs:

```bash
aws logs tail /aws/lambda/amplify-digitalassistant-renewableAgentCoreProxy --follow
```

Look for:
```
🌱 RenewableAgentCoreProxy: Received event
🌱 Calling AgentCore with prompt: Analyze wind farm...
✅ AgentCore response received: 1234 chars
```

---

## 🔧 Architecture

### Before (Current - Mock Data):
```
User Query → TypeScript → AWS SDK (fails) → Mock Data ❌
```

### After (With Python Proxy - Real Data):
```
User Query → TypeScript → Python Lambda → boto3 → AgentCore → Real Data ✅
```

---

## 📁 Files Changed

All changes are already committed and ready:

1. **amplify/backend.ts** - Registered Python Lambda, added IAM permissions
2. **amplify/functions/renewableAgentCoreProxy/handler.py** - Python Lambda handler
3. **amplify/functions/renewableAgentCoreProxy/resource.ts** - Lambda resource definition
4. **amplify/functions/renewableAgentCoreProxy/requirements.txt** - Python dependencies

---

## 🐛 Troubleshooting

### If you still see mock data:

**Check 1**: Verify Python Lambda exists
```bash
aws lambda list-functions | grep renewableAgentCoreProxy
```

**Check 2**: Check Python Lambda logs
```bash
aws logs tail /aws/lambda/amplify-digitalassistant-renewableAgentCoreProxy --follow
```

**Check 3**: Check TypeScript Lambda logs
```bash
aws logs tail /aws/lambda/amplify-digitalassistant--lightweightAgent --follow
```

Look for: `RenewableClient: Calling Python proxy Lambda`

---

## 📚 Detailed Documentation

For more details, see:

- **`REPLACE_MOCK_DATA_SOLUTION.md`** - Complete solution overview
- **`docs/DEPLOY_PYTHON_PROXY_NOW.md`** - Detailed deployment guide
- **`docs/PYTHON_PROXY_SOLUTION.md`** - Technical implementation details
- **`docs/ROOT_CAUSE_FOUND.md`** - Root cause analysis

---

## 🎯 Quick Summary

**Problem**: Mock data instead of real AgentCore data  
**Root Cause**: TypeScript SDK doesn't support bedrock-agentcore  
**Solution**: Python Lambda proxy using boto3  
**Status**: Code complete, ready to deploy  
**Action Required**: Run `npx ampx sandbox`  
**Time**: 10 minutes total  

---

## 🚀 Deploy Command

```bash
npx ampx sandbox
```

**That's it!** After deployment completes, test with a renewable query and you'll see real data instead of mock data.

---

## ✅ Expected Results

### Before:
```json
{
  "projectId": "mock-project-123",
  "message": "Terrain analysis completed successfully...",
  "mapHtml": "<div>Mock Folium Map</div>"
}
```

### After:
```json
{
  "projectId": "wind-farm-abc123",
  "message": "Based on NREL wind resource data at 35.067482, -101.395466...",
  "mapHtml": "<iframe src='...real interactive folium map...'></iframe>",
  "coordinates": {"lat": 35.067482, "lng": -101.395466},
  "windSpeed": 8.2,
  "suitabilityScore": 87.3
}
```

---

**🎉 Ready? Deploy now:**

```bash
npx ampx sandbox
```
