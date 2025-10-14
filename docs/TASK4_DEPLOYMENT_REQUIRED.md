# Task 4: Deployment Required

## Current Status

✅ **Frontend Fix Complete**: Added `selectionSet` to ChatBox queries to retrieve artifacts
❌ **Backend Not Deployed**: Renewable Lambda functions don't exist

## Problem

The timeout error is occurring because:

1. User sends query: "Analyze terrain for wind farm at 40.7128, -74.0060"
2. Frontend calls `invokeLightweightAgent` mutation
3. LightweightAgent Lambda tries to invoke `renewableOrchestrator` Lambda
4. **renewableOrchestrator Lambda doesn't exist** (not deployed)
5. Request times out after 30 seconds
6. User sees: "Execution timed out"

## Missing Lambda Functions

According to `scripts/check-lambda-exists.js`, these functions are missing:

- ❌ `renewableOrchestrator` - Main orchestrator for renewable queries
- ❌ `renewableTerrain` - Terrain analysis tool
- ❌ `renewableLayout` - Layout optimization tool
- ❌ `renewableSimulation` - Simulation tool
- ❌ `renewableReport` - Report generation tool
- ❌ `renewableAgentCoreProxy` - Proxy for bedrock-agentcore

## Deployment Options

### Option 1: Full Sandbox Deployment (Recommended for Testing)

```bash
npx ampx sandbox --stream-function-logs
```

**Pros:**
- Deploys all functions
- Streams logs in real-time
- Easy to debug
- Hot-reload on code changes

**Cons:**
- Keeps terminal occupied
- Requires keeping process running

### Option 2: One-Time Deployment

```bash
npx ampx sandbox --once
```

**Pros:**
- Deploys and exits
- Frees up terminal

**Cons:**
- No log streaming
- No hot-reload
- Need to redeploy for changes

### Option 3: Production Deployment

```bash
npx ampx pipeline-deploy --branch main --app-id <app-id>
```

**Pros:**
- Production-ready
- Persistent deployment

**Cons:**
- Slower
- More complex
- Requires app-id

## Recommended Next Steps

1. **Deploy the backend** using Option 1:
   ```bash
   npx ampx sandbox --stream-function-logs
   ```

2. **Wait for deployment to complete** (usually 2-5 minutes)

3. **Test the query again**: "Analyze terrain for wind farm at 40.7128, -74.0060"

4. **Check console logs** to verify artifacts are now retrieved

5. **Verify visualization renders** with terrain map

## What Will Happen After Deployment

Once deployed, the flow will be:

1. ✅ User sends query
2. ✅ LightweightAgent receives query
3. ✅ LightweightAgent invokes renewableOrchestrator (now exists!)
4. ✅ renewableOrchestrator invokes renewableTerrain
5. ✅ renewableTerrain fetches OSM data and creates artifacts
6. ✅ Artifacts are saved to database
7. ✅ Frontend retrieves artifacts (with our selectionSet fix!)
8. ✅ TerrainMapArtifact component renders the map
9. ✅ User sees visualization with 151 features

## Files Modified (Ready for Deployment)

- ✅ `src/components/ChatBox.tsx` - Added selectionSet to queries
- ✅ `amplify/functions/renewableOrchestrator/handler.ts` - Orchestrator logic
- ✅ `amplify/functions/renewableTools/terrain/handler.py` - Terrain tool
- ✅ `utils/amplifyUtils.ts` - Artifact processing
- ✅ `utils/s3ArtifactStorage.ts` - Feature preservation fix

## Current Task Status

- ✅ Task 4.1: Audit artifact creation
- ✅ Task 4.2: Update amplifyUtils.ts artifact handling
- ✅ Task 4.3: Update ChatMessage.tsx artifact deserialization
- ✅ Task 4.4: Frontend selectionSet fix (THIS FIX)
- ⏳ **Task 4.5: Deploy and test** (NEXT STEP)

## Action Required

**Please run the deployment command:**

```bash
npx ampx sandbox --stream-function-logs
```

Then test the query again once deployment completes.
