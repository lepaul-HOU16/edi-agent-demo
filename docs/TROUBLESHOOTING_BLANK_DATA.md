# Troubleshooting: Blank Template with No Data

## Issue
The renewable energy template loads but all data and map fields are blank.

## What This Means
✅ Frontend configuration is working
✅ Renewable agent is being invoked
✅ Backend is responding
❌ Backend response is empty or malformed

## Likely Causes

### 1. Backend Runtime Error
The AgentCore runtime is responding but failing to process the request.

**Check CloudWatch Logs:**
```bash
aws logs tail /aws/bedrock/agentcore/wind_farm_layout_agent --follow --region us-east-1
```

### 2. Mock Response from RenewableClient
The RenewableClient has a mock response for testing. If the actual backend call fails, it returns an empty mock response.

**Location:** `src/services/renewable-integration/renewableClient.ts` line ~120

### 3. Backend Not Fully Deployed
The backend might not be fully functional yet (we only deployed the layout agent, not the full multi-agent system).

## Debugging Steps

### Step 1: Check Browser Console
Open browser DevTools (F12) and look for:
- Network requests to the backend
- Console errors
- Response data

### Step 2: Check Server Logs
In your terminal where `npm run dev` is running, look for:
```
🌱 RenewableProxyAgent: Processing query
🌱 RenewableProxyAgent: Invoking AgentCore
✅ RenewableProxyAgent: Query processed successfully
```

### Step 3: Check Backend Response
Add this to see what the backend is returning:

1. Open browser console (F12)
2. Look for logs starting with "🌱 RenewableProxyAgent"
3. Check if there are any error messages

### Step 4: Test Backend Directly
```bash
python3 scripts/test-renewable-integration.py
```

This will show if the backend is actually working.

## Quick Fixes

### Fix 1: The Backend Isn't Deployed Yet
**Problem:** We configured the frontend but haven't deployed the actual multi-agent backend.

**Solution:** Deploy the backend using Jupyter notebooks:
```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
source .venv/bin/activate
jupyter notebook
```

Then run: `agent_core/03_host_agent_to_runtime/03_host_agent_to_runtime.ipynb`

### Fix 2: Wrong Endpoint
**Problem:** The endpoint in the config points to the layout agent only, not the multi-agent system.

**Current endpoint:**
```
arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/wind_farm_layout_agent-7DnHlIBg3o
```

**This is only the layout agent!** We need the multi-agent orchestration endpoint.

**Solution:** Deploy the full multi-agent system and update the endpoint.

### Fix 3: Backend Returns Mock Data
**Problem:** The RenewableClient is returning mock data because the real backend call fails.

**Check:** Look in `src/services/renewable-integration/renewableClient.ts` around line 120 for the mock response.

**Solution:** Fix the backend deployment so it returns real data.

## Expected vs Actual

### Expected Response Structure:
```json
{
  "message": "Terrain analysis complete",
  "artifacts": [
    {
      "type": "terrain",
      "data": {
        "mapHtml": "<html>...</html>",
        "metrics": {
          "coordinates": { "lat": 35.067482, "lng": -101.395466 },
          "suitabilityScore": 85,
          "exclusionZones": [...]
        }
      },
      "metadata": {
        "projectId": "project_123",
        "timestamp": "2025-10-03T...",
        "s3Url": "s3://..."
      }
    }
  ],
  "thoughtSteps": [...],
  "projectId": "project_123",
  "status": "success"
}
```

### Actual Response (Likely):
```json
{
  "message": "Renewable energy analysis initiated",
  "artifacts": [],
  "thoughtSteps": [...],
  "projectId": "project_123",
  "status": "success"
}
```

Notice: `artifacts` array is empty!

## Most Likely Issue

**The backend agent isn't fully deployed or isn't working.**

The endpoint we're using (`wind_farm_layout_agent-7DnHlIBg3o`) is just the layout agent, not the full multi-agent orchestration system that includes:
- Terrain analysis agent
- Layout optimization agent
- Simulation agent
- Report generation agent

## Recommended Next Steps

1. **Check what the backend is actually returning:**
   - Open browser console
   - Look for the response data
   - Share what you see

2. **Deploy the full multi-agent system:**
   - Use the Jupyter notebook deployment
   - Get the correct multi-agent endpoint
   - Update the configuration

3. **Test the backend directly:**
   ```bash
   python3 scripts/test-renewable-integration.py
   ```

## Temporary Workaround

To verify the frontend is working, we can create a mock response with actual data. This will confirm the UI components work correctly while we fix the backend.

Would you like me to:
A) Help you check what the backend is returning?
B) Create a mock response to test the UI?
C) Guide you through deploying the full backend?
