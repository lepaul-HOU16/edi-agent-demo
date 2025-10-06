# Why You're Not Seeing Data (And How to Fix It)

## The Problem

You're not seeing data populate in the renewable energy templates because **the backend hasn't been deployed yet**. The integration layer is complete, but there's no actual AgentCore endpoint to connect to.

## Current State

### What's Built ✅

1. **Frontend Integration Layer** - Complete
   - `RenewableClient` - HTTP client for AgentCore
   - `ResponseTransformer` - Transforms responses to artifacts
   - `RenewableProxyAgent` - Bridges frontend and backend
   - UI Components - Terrain, Layout, Simulation, Report

2. **Configuration** - Complete
   - Environment variables defined
   - Amplify backend configured
   - IAM permissions set up

3. **Testing Framework** - Complete
   - Integration tests
   - Validation scripts
   - Manual test procedures

4. **Documentation** - Complete
   - Architecture docs
   - Deployment guides
   - Sample queries
   - Troubleshooting

### What's Missing ❌

**The Renewable Energy Backend (AgentCore Runtime)**

The Python-based multi-agent system needs to be deployed to AWS Bedrock AgentCore. This is what actually:
- Analyzes terrain
- Designs layouts
- Runs simulations
- Generates reports

## Why Mock Data?

Look at `src/services/renewable-integration/renewableClient.ts` line 150:

```typescript
// TODO: Implement actual AWS Bedrock AgentCore invocation
// This requires AWS SDK and proper authentication

// For now, return a mock response to allow frontend development
console.warn('RenewableClient: Using mock response (AWS SDK integration pending)');

return this.getMockResponse(request);
```

The `getMockResponse()` function returns fake data so you can:
- Develop the UI
- Test the integration layer
- Validate the data flow

But it's not real analysis - just placeholder data.

## The Solution

You need to deploy the actual renewable energy backend. Here's how:

### Quick Fix (30 minutes)

1. **Run the automated deployment script**:
   ```bash
   python scripts/deploy-renewable-backend-automated.py
   ```

2. **Complete the AgentCore deployment**:
   ```bash
   cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/
   jupyter notebook lab3_agentcore_tutorial.ipynb
   # Run all cells
   ```

3. **Save the endpoint URL** from the notebook output

4. **Update .env.local**:
   ```bash
   NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=<your-endpoint-url>
   ```

5. **Replace mock data with real AWS SDK call**:
   
   Update `src/services/renewable-integration/renewableClient.ts`:
   
   ```typescript
   // Replace the mock response with actual AWS SDK call
   private async makeRequest(request: AgentCoreRequest): Promise<AgentCoreResponse> {
     const bedrockAgentRuntime = new BedrockAgentRuntimeClient({
       region: this.region
     });
     
     const command = new InvokeAgentCommand({
       agentId: '<your-agent-id>',
       agentAliasId: '<your-alias-id>',
       sessionId: request.sessionId,
       inputText: request.prompt
     });
     
     const response = await bedrockAgentRuntime.send(command);
     return this.parseAgentCoreResponse(response);
   }
   ```

6. **Redeploy**:
   ```bash
   npx ampx sandbox
   npm run dev
   ```

7. **Test with real data**:
   ```
   Analyze terrain for wind farm at 35.067482, -101.395466
   ```

### Detailed Guide

See [DEPLOY_RENEWABLE_BACKEND_NOW.md](./DEPLOY_RENEWABLE_BACKEND_NOW.md) for complete step-by-step instructions.

## What You'll See After Deployment

### Before (Mock Data)
```json
{
  "message": "Mock terrain analysis",
  "artifacts": [{
    "type": "terrain",
    "data": {
      "mapHtml": "<div>Mock Folium Map</div>",
      "metrics": {
        "suitabilityScore": 85
      }
    }
  }]
}
```

### After (Real Data)
```json
{
  "message": "Terrain analysis completed. Site shows excellent potential...",
  "artifacts": [{
    "type": "terrain",
    "data": {
      "mapHtml": "<html>...actual Folium map with USGS data...</html>",
      "metrics": {
        "suitabilityScore": 87.3,
        "exclusionZones": [
          {"type": "Water Bodies", "area": 2.5, "description": "..."},
          {"type": "Protected Areas", "area": 1.2, "description": "..."}
        ],
        "riskAssessment": {
          "environmental": 12,
          "regulatory": 8,
          "technical": 15,
          "overall": 11.7
        }
      }
    }
  }],
  "thoughtSteps": [
    {"title": "Fetching USGS elevation data", "status": "complete"},
    {"title": "Analyzing terrain features", "status": "complete"},
    {"title": "Identifying exclusion zones", "status": "complete"},
    {"title": "Calculating suitability score", "status": "complete"}
  ]
}
```

## Verification

After deployment, verify real data is flowing:

1. **Check browser console**:
   ```
   ✓ Should NOT see: "Using mock response"
   ✓ Should see: "Connected to renewable energy service"
   ```

2. **Check thought steps**:
   ```
   ✓ Should see: Multiple detailed steps from Python agents
   ✓ Should NOT see: Generic "Processing" steps
   ```

3. **Check artifacts**:
   ```
   ✓ Maps should be interactive with real USGS tiles
   ✓ Suitability scores should vary by location
   ✓ Exclusion zones should be specific to the site
   ```

4. **Check response time**:
   ```
   ✓ Mock data: < 1 second
   ✓ Real data: 10-30 seconds (actual analysis)
   ```

## Why This Approach?

We built the integration layer first (frontend-first development) because:

1. **Parallel Development**: Frontend and backend can be developed simultaneously
2. **Early Testing**: UI can be tested without waiting for backend
3. **Clear Contracts**: API contracts defined upfront
4. **Faster Iteration**: UI changes don't require backend redeployment

This is a common pattern in modern web development.

## Summary

**Current State**: Integration layer complete, using mock data  
**Missing**: Deployed AgentCore backend  
**Solution**: Deploy backend using provided scripts  
**Time Required**: ~30 minutes  
**Result**: Real terrain analysis, layout design, and simulations

---

**Ready to deploy?** Follow [DEPLOY_RENEWABLE_BACKEND_NOW.md](./DEPLOY_RENEWABLE_BACKEND_NOW.md)

