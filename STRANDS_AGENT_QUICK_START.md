# Strands Agent Quick Start Guide

## TL;DR - Deploy Now

```bash
# Deploy the fix
./scripts/deploy-strands-agents-fix.sh

# Or manually:
npx ampx sandbox  # Wait 10-15 minutes for Docker build
node tests/test-strands-agent-deployment.js
```

## What Was Fixed

**Problem:** Lambda failing with "undefined is not valid JSON"

**Root Cause:** Importing from `strands` instead of `strands_agents`

**Solution:** Fixed all imports in 6 agent files + removed invalid `@app.entrypoint` code

## Quick Test

```bash
# Find the Lambda
aws lambda list-functions | grep RenewableAgentsFunction

# Test it
node tests/test-strands-agent-deployment.js
```

## Expected Output

```
✅ Found function: amplify-digitalassistant--RenewableAgentsFunction0-XXXXX
✅ Success: true
🤖 Agent: terrain
📝 Response length: 1500 characters
🎨 Artifacts: 2
✅ TERRAIN AGENT TEST PASSED
```

## If It Fails

```bash
# Check logs
aws logs tail /aws/lambda/amplify-digitalassistant--RenewableAgentsFunction0-XXXXX --follow

# Look for:
# ❌ "ModuleNotFoundError: No module named 'strands'" → Still has old imports
# ❌ "Runtime.Unknown" → Initialization failure
# ✅ "Agent initialized successfully" → Working!
```

## Files Changed

- ✅ `terrain_agent.py` - Fixed imports
- ✅ `layout_agent.py` - Fixed imports
- ✅ `simulation_agent.py` - Fixed imports
- ✅ `report_agent.py` - Fixed imports
- ✅ `wind_farm_dev_agent.py` - Fixed imports
- ✅ `multi_agent.py` - Fixed imports
- ✅ `Dockerfile` - Added matplotlib config

## Next Steps

1. Deploy (10-15 min)
2. Test (2 min)
3. Verify in UI (5 min)
4. Move to Task 5 in `.kiro/specs/complete-strands-agent-integration/tasks.md`

## Full Documentation

See `STRANDS_AGENT_DEPLOYMENT_FIX_COMPLETE.md` for complete details.
