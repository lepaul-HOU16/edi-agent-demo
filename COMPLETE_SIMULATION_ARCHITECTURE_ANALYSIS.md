# Complete Simulation Architecture Analysis

## Current Architecture

### Two Separate Simulation Implementations:

1. **Python Simulation Agent** (Full-featured)
   - Location: `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agents/simulation_agent.py`
   - Features:
     - Full PyWake simulation
     - Generates 8 PNG chart files
     - Uses `generate_charts` tool
     - Saves charts to S3
   - **Status**: ✅ NOW FIXED - Returns S3 URLs in visualizations object

2. **CDK Lambda Handler** (Lightweight)
   - Location: `cdk/lambda-functions/renewable-tools/handler.py`
   - Features:
     - Simple energy calculations
     - No PyWake
     - No chart generation
     - Fast response
   - **Status**: ❌ Currently being called by orchestrator, doesn't generate charts

## The Problem

The renewable orchestrator is calling the **lightweight CDK Lambda** (option 2), not the **Python simulation agent** (option 1).

```typescript
// In orchestrator handler.ts line 1975:
case 'wake_simulation':
  functionName = process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME || 'renewable-simulation-simple';
```

This Lambda returns:
```python
{
    'visualizations': {
        'wake_heat_map': None  # No charts!
    }
}
```

## Solutions

### Option A: Update CDK Lambda to Generate Charts (Quick Fix)

Update `cdk/lambda-functions/renewable-tools/handler.py` to:
1. Generate simple matplotlib charts
2. Save to S3
3. Return S3 URLs in visualizations object

**Pros**: Quick, works with current architecture
**Cons**: Duplicate chart generation logic, not using PyWake

### Option B: Call Python Simulation Agent from CDK Lambda (Proper Fix)

Update CDK Lambda to invoke the Python simulation agent Lambda and return its results.

**Pros**: Uses full PyWake simulation, proper charts
**Cons**: Requires Python agent to be deployed as Lambda

### Option C: Deploy Python Agent as Lambda (Complete Solution)

1. Package Python simulation agent as Lambda
2. Update CDK stack to deploy it
3. Point `RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME` to it
4. Remove lightweight simulation from CDK Lambda

**Pros**: Full functionality, proper architecture
**Cons**: More complex deployment, larger Lambda

## What I Fixed

✅ Updated `storage_utils.py`:
- Added `get_s3_presigned_url()` function
- Added `get_file_url()` function to get URLs for saved files

✅ Updated `simulation_tools.py`:
- Modified `generate_charts()` to return S3 URLs
- Returns visualizations object with:
  ```python
  {
      "visualizations": {
          "performance_charts": [url1, url2, ...],  # 7 charts
          "wind_rose": wind_rose_url  # Separate wind rose
      }
  }
  ```

## Recommended Next Steps

1. **Immediate**: Update CDK Lambda to generate basic charts (Option A)
2. **Short-term**: Deploy Python agent as separate Lambda (Option C)
3. **Long-term**: Consolidate to single simulation implementation

## Files Modified

1. `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agents/tools/storage_utils.py`
   - Added S3 presigned URL generation
   
2. `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agents/tools/simulation_tools.py`
   - Updated `generate_charts()` to return S3 URLs

## Files That Need Updates

1. `cdk/lambda-functions/renewable-tools/handler.py`
   - `wake_simulation()` function needs to generate charts or call Python agent
   
2. OR deploy Python simulation agent as Lambda and update CDK stack

## Testing

Once charts are generated and URLs returned:
1. Run wake simulation
2. Check orchestrator logs for visualizations object
3. Verify WakeAnalysisArtifact displays charts
4. Confirm all 8 charts are visible in UI
