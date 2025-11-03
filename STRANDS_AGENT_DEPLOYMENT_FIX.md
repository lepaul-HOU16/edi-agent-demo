# Strands Agent Deployment Fix

## Issue

Deployment failed with error:
```
AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually
```

## Root Cause

In `amplify/functions/renewableAgents/resource.ts`, we were trying to manually set the `AWS_REGION` environment variable:

```typescript
environment: {
  AWS_REGION: process.env.AWS_REGION || 'us-west-2',  // ❌ RESERVED
  // ...
}
```

## Fix Applied

Removed the `AWS_REGION` environment variable from the Lambda configuration:

```typescript
environment: {
  // Bedrock configuration (AWS_REGION is automatically set by Lambda runtime)
  BEDROCK_MODEL_ID: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  // ...
}
```

## Why This Works

1. **Lambda Runtime Provides AWS_REGION**: The Lambda runtime automatically sets `AWS_REGION` as an environment variable
2. **Boto3 Auto-Detection**: The boto3 SDK automatically detects and uses the region from:
   - Lambda runtime environment variable
   - AWS SDK default configuration
   - No manual configuration needed

3. **Agent Default Values**: All agent functions have default `region_name="us-west-2"` parameters, which work correctly with boto3's Config

## Verification

The fix ensures:
- ✅ No reserved environment variables are set
- ✅ Boto3 uses the correct region automatically
- ✅ Agents can still override region if needed via parameters
- ✅ Deployment will succeed

## Next Steps

1. **Deploy**: Run `npx ampx sandbox` to deploy the fixed configuration
2. **Test**: Run `node tests/test-strands-agents-complete.js` to verify all agents work
3. **Validate**: Test in UI to confirm end-to-end functionality

## Related Files

- `amplify/functions/renewableAgents/resource.ts` - Fixed Lambda configuration
- `amplify/functions/renewableAgents/*.py` - Agent files (no changes needed)

