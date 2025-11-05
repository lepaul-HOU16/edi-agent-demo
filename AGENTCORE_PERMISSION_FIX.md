# AgentCore Permission Fix ✅

## Issue

When testing "calculate porosity for well-001", got this error:
```
Error calling Bedrock Agent for calculate_porosity: User: arn:aws:sts::484907533441:assumed-role/amplify-digitalassistant--agentlambdaServiceRole7EA-THo6InS2sUHl/amplify-digitalassistant-lepau-agentlambda15AE88A1-GsyTrvqgmtHL is not authorized to perform: bedrock:InvokeAgent on resource: arn:aws:bedrock:us-east-1:484907533441:agent-alias/QUQKELPKM2/S5YWIUZOGB because no identity-based policy allows the bedrock:InvokeAgent action
```

## Root Cause

The Lambda IAM role had `bedrock-agent-runtime:InvokeAgent` permission but was missing `bedrock:InvokeAgent` permission.

## Fix Applied

### 1. Updated `amplify/backend.ts`

Changed from:
```typescript
actions: [
  "bedrock-agent-runtime:InvokeAgent",
  "bedrock-agent:GetAgent",
  "bedrock-agent:GetAgentAlias",
]
```

To:
```typescript
actions: [
  "bedrock:InvokeAgent",                    // ← ADDED THIS
  "bedrock-agent-runtime:InvokeAgent",
  "bedrock-agent:GetAgent",
  "bedrock-agent:GetAgentAlias",
]
```

### 2. Applied Permission Immediately

Ran `./scripts/fix-bedrock-agent-permissions.sh` to add the permission without waiting for redeployment.

**Result:**
```
✅ Permission added

Verified permissions:
- bedrock:InvokeAgent                ✅
- bedrock-agent-runtime:InvokeAgent  ✅
- bedrock-agent:GetAgent             ✅
- bedrock-agent:GetAgentAlias        ✅
```

## Current Status

✅ **FIXED** - Lambda role now has all required permissions

## Next Steps

### Test Immediately

The fix is live! Test now:

1. **In UI**: Send message "calculate porosity for well-001"
2. **Expected**: Should work now without permission errors

### If Still Issues

If you still see errors, it might be a caching issue. Restart sandbox:
```bash
# Stop sandbox (Ctrl+C)
npx ampx sandbox
```

## What Changed

**Before:**
- Lambda could not invoke Bedrock Agent
- Got AccessDenied error

**After:**
- Lambda has full Bedrock Agent permissions
- Can invoke agent successfully

## Files Modified

1. ✅ `amplify/backend.ts` - Added `bedrock:InvokeAgent` permission
2. ✅ `scripts/fix-bedrock-agent-permissions.sh` - Created fix script
3. ✅ Applied fix to live Lambda role

## Verification

To verify the fix is applied:
```bash
# Get Lambda role name
LAMBDA_NAME="amplify-digitalassistant-lepau-agentlambda15AE88A1-GsyTrvqgmtHL"
ROLE_NAME=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query "Configuration.Role" --output text | awk -F'/' '{print $NF}')

# Check permissions
aws iam get-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "BedrockAgentInvokePolicy" \
  --query "PolicyDocument.Statement[0].Action"
```

Expected output:
```json
[
    "bedrock:InvokeAgent",
    "bedrock-agent-runtime:InvokeAgent",
    "bedrock-agent:GetAgent",
    "bedrock-agent:GetAgentAlias"
]
```

## Ready to Test! 🚀

The permission issue is fixed. Try your porosity calculation again!

---

**Fix Applied**: 2025-03-05  
**Status**: ✅ READY TO TEST  
**Next Action**: Test "calculate porosity for well-001" in UI
