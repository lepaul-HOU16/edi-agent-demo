# Hardcoded Values & Mock Data Audit

## Summary

Found **16 hardcoded bucket names** and **1 hardcoded function name** in Lambda functions that should use environment variables instead.

## Critical Issues

### 1. Hardcoded Function Name
**File**: `amplify/functions/shared/renewableConfig.ts`
```typescript
const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 
  'amplify-digitalassistant--renewableOrchestratorlam-jBcrYHDFlPXd';  // ❌ Hardcoded
```

**Impact**: If orchestrator function name changes, this fallback uses old name
**Fix**: Remove fallback - environment variable is now set in backend.ts

### 2. Hardcoded S3 Bucket Names (16 instances)

#### TypeScript Lambda Functions:
1. `amplify/functions/tools/comprehensiveMultiWellCorrelationTool.ts`
2. `amplify/functions/tools/comprehensiveShaleAnalysisTool.ts`
3. `amplify/functions/tools/petrophysicsTools.ts`
4. `amplify/functions/tools/comprehensivePorosityAnalysisTool.ts`
5. `amplify/functions/tools/enhancedPetrophysicsTools.ts`
6. `amplify/functions/enhancedStrandsAgent/handler.ts`
7. `amplify/functions/agents/handler.ts`
8. `amplify/functions/maintenanceAgent/handler.ts`
9. `amplify/functions/catalogMapData/index.ts`

**Pattern**:
```typescript
const S3_BUCKET = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
```

#### Python Lambda Functions:
10. `amplify/functions/renewableAgents/lambda_handler.py`
11. `amplify/functions/renewableTools/layout/simple_handler.py`
12. `amplify/functions/renewableTools/simulation/simple_handler.py`
13. `amplify/functions/renewableTools/terrain/simple_handler.py`

**Pattern**:
```python
S3_BUCKET = os.environ.get('S3_BUCKET', 'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy')
```

#### Python Visualization Config:
14. `amplify/functions/renewableTools/simulation/visualization_config.py`
15. `amplify/functions/renewableTools/visualization_config.py`

**Pattern**:
```python
S3_BUCKET = os.environ.get('RENEWABLE_S3_BUCKET', 'renewable-energy-artifacts')
```

**Impact**: 
- If bucket name changes, fallbacks use old bucket
- Different hardcoded values across files (inconsistent)
- Frontend might use different bucket than backend

## Mock Data Fallbacks

### Found in `amplify/functions/shared/wellDataService.ts`:
```typescript
// Fallback to mock data if database is unavailable
// Fallback to mock data
// Fallback to filtering mock data
```

**Status**: These are acceptable fallbacks for development/testing

### Found in `amplify/functions/catalogSearch/index.ts` & `catalogMapData/index.ts`:
```typescript
// Fallback coordinates for offshore Brunei/Malaysia if no CSV data
```

**Status**: Acceptable - provides default coordinates when data unavailable

## Recommended Fixes

### Priority 1: Remove Hardcoded Function Name
```typescript
// amplify/functions/shared/renewableConfig.ts
// BEFORE:
const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 
  'amplify-digitalassistant--renewableOrchestratorlam-jBcrYHDFlPXd';

// AFTER:
const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
if (!orchestratorFunctionName) {
  throw new Error('RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable not set');
}
```

### Priority 2: Remove Hardcoded S3 Bucket Fallbacks

**For TypeScript files**:
```typescript
// BEFORE:
const S3_BUCKET = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';

// AFTER:
const S3_BUCKET = process.env.S3_BUCKET;
if (!S3_BUCKET) {
  throw new Error('S3_BUCKET environment variable not set');
}
```

**For Python files**:
```python
# BEFORE:
S3_BUCKET = os.environ.get('S3_BUCKET', 'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy')

# AFTER:
S3_BUCKET = os.environ.get('S3_BUCKET')
if not S3_BUCKET:
    raise ValueError('S3_BUCKET environment variable not set')
```

## Why This Matters

1. **Deployment Consistency**: Hardcoded fallbacks mean code uses old values even after redeployment
2. **Environment Isolation**: Can't easily switch between dev/staging/prod buckets
3. **Debugging Difficulty**: Hard to know which bucket is actually being used
4. **Frontend/Backend Mismatch**: Frontend might use different bucket than backend

## Current Status

✅ **FIXED**: CloudFormation outputs now export actual deployed names
✅ **FIXED**: Environment variables set dynamically in backend.ts
❌ **NOT FIXED**: Hardcoded fallback values still exist in Lambda functions

## Next Steps

1. Remove hardcoded fallback in `renewableConfig.ts` (highest priority)
2. Remove hardcoded S3 bucket fallbacks in all Lambda functions
3. Add validation to ensure environment variables are set
4. Test that functions fail fast with clear error messages if env vars missing

## Testing After Fix

```bash
# 1. Deploy
npx ampx sandbox

# 2. Verify environment variables are set
aws lambda get-function-configuration \
  --function-name <function-name> \
  --query 'Environment.Variables'

# 3. Test that functions use correct bucket
# Check CloudWatch logs for actual bucket being used

# 4. Verify no fallback to hardcoded values
# Temporarily unset env var and verify function fails with clear error
```

## Files to Update

1. `amplify/functions/shared/renewableConfig.ts` - Remove hardcoded function name
2. All 9 TypeScript Lambda handlers - Remove hardcoded S3 bucket
3. All 4 Python Lambda handlers - Remove hardcoded S3 bucket
4. 2 Python visualization config files - Remove hardcoded S3 bucket

Total: **16 files** need updates
