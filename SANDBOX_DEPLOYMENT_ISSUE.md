# Sandbox Deployment Issue - Hanging at amplify_outputs.json

## Problem
Amplify sandbox hangs at "File written: amplify_outputs.json" and never completes deployment.

## Root Cause
The sandbox is hanging during the Python Lambda function build process. After writing `amplify_outputs.json`, it attempts to build Lambda functions, and one of the Python functions is causing the build to hang indefinitely.

## What We've Tried
1. ✅ Disabled `renewableAgentsFunction` (complex Python dependencies)
2. ✅ Disabled `renewableSimulationTool` (Docker-based Lambda)
3. ✅ Disabled `renewableDemoLayer` (Python layer with dependencies)
4. ❌ Still hanging - issue persists

## Remaining Python Functions
The following Python Lambda functions are still enabled and could be causing the hang:
- `renewableTerrainTool` - Python 3.12 Lambda
- `renewableLayoutTool` - Python 3.12 Lambda  
- `renewableReportTool` - Python 3.12 Lambda

## Likely Cause
One of these three Python functions has a `requirements.txt` with dependencies that are:
- Taking too long to build
- Failing to build silently
- Causing the build process to hang

## Recommended Next Steps

### Option 1: Disable All Python Functions Temporarily
Comment out all three remaining Python tool functions to get a clean deployment, then add them back one at a time to identify the problematic one.

### Option 2: Check Python Requirements
Inspect the `requirements.txt` files for each Python function:
- `amplify/functions/renewableTools/terrain/requirements.txt`
- `amplify/functions/renewableTools/layout/requirements.txt`
- `amplify/functions/renewableTools/report/requirements.txt`

Look for:
- Large packages (numpy, scipy, pandas, matplotlib)
- Packages that require compilation
- Conflicting dependencies

### Option 3: Use Docker for All Python Functions
Convert all Python functions to use Docker (like the simulation tool) to have more control over the build process.

### Option 4: Simplify Python Dependencies
Create minimal `requirements.txt` files with only essential packages, then add dependencies incrementally.

## Immediate Action
**Disable the remaining Python tool functions to get a working deployment:**

1. Comment out imports in `amplify/backend.ts`:
   ```typescript
   // import { renewableTerrainTool } from './functions/renewableTools/terrain/resource';
   // import { renewableLayoutTool } from './functions/renewableTools/layout/resource';
   // import { renewableReportTool } from './functions/renewableTools/report/resource';
   ```

2. Comment out from `defineBackend()`:
   ```typescript
   // renewableTerrainTool,
   // renewableLayoutTool,
   // renewableReportTool,
   ```

3. Comment out all references to these functions in permissions and environment variables

4. Restart sandbox - it should deploy successfully with just Node.js functions

5. Add Python functions back one at a time to identify the problematic one

## Success Criteria
- Sandbox completes deployment and shows "Deployed" message
- Can then incrementally add Python functions back
- Identify which specific function/dependency is causing the hang
- Fix that specific issue rather than debugging blindly

---
*Created: 2025-01-XX*
*Status: Awaiting user decision on next steps*
