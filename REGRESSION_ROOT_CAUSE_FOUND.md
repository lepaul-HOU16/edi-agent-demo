# Regression Root Cause: Missing Environment Variable in Deployed Lambda

## The Regression

**Before**: Clear button worked
**After Migration**: Clear button doesn't work
**Root Cause**: Deployed Lambda missing `SESSION_CONTEXT_TABLE` environment variable

## Evidence from Logs

```
2025-12-02T16:28:46 ERROR ValidationException: 1 validation error detected: 
Value null at 'tableName' failed to satisfy constraint: Member must not be null
```

The Lambda is trying to use SessionContextManager but `process.env.SESSION_CONTEXT_TABLE` is undefined/null.

## Why This Happened

During the CDK migration, the chat Lambda was configured with:
- ✅ `AMPLIFY_DATA_SESSIONCONTEXT_TABLE_NAME` 
- ❌ `SESSION_CONTEXT_TABLE` (MISSING)

But the code looks for `SESSION_CONTEXT_TABLE`:

```typescript
// SessionContextManager constructor
this.tableName = tableName || process.env.SESSION_CONTEXT_TABLE || 'RenewableSessionContext';
```

When `SESSION_CONTEXT_TABLE` is undefined, it falls back to the string `'RenewableSessionContext'`, but something is passing `null` explicitly, causing the validation error.

## The Fix (Already Applied to Code)

**File**: `cdk/lib/main-stack.ts`

```typescript
environment: {
  // ... other vars ...
  SESSION_CONTEXT_TABLE: sessionContextTable.tableName, // ← ADDED
  // ... other vars ...
},
```

## Why It's Not Fixed Yet

**The CDK change hasn't been deployed to production.**

The code fix is in the repo, but the deployed Lambda still has the old configuration without `SESSION_CONTEXT_TABLE`.

## What Needs to Happen

1. Commit the CDK changes
2. Push to main branch  
3. CI/CD deploys the updated Lambda with the environment variable
4. Clear button will work again

## Files Changed

- ✅ `cdk/lib/main-stack.ts` - Added SESSION_CONTEXT_TABLE env var
- ✅ `vite.config.ts` - Added proxy for localhost testing

## Summary

This IS a regression caused by the migration:
- Migration changed infrastructure (Amplify → CDK)
- CDK configuration was incomplete (missing env var)
- Deployed Lambda crashes when trying to use SessionContextManager
- Clear button (and OSDU search, and other features) fail

**The fix is ready, it just needs to be deployed.**
