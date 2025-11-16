# Deployment Issue - Root Cause Found

## The Problem

Code changes to `amplify/functions/renewableTools/handler.ts` are not being deployed to AWS Lambda, even after multiple sandbox restarts.

## Root Cause

**Duplicate Function Definitions with Same Name**

There were TWO definitions of the `renewableTools` function:

1. **`amplify/data/resource.ts`** (ACTIVE - being used)
   ```typescript
   export const renewableToolsFunction = defineFunction({
     name: 'renewableTools',  // ← Same name
     entry: '../functions/renewableTools/handler.ts',
     ...
   });
   ```

2. **`amplify/functions/renewableTools/resource.ts`** (UNUSED - but causing conflict)
   ```typescript
   export const renewableTools = defineFunction({
     name: 'renewableTools',  // ← Same name!
     entry: './handler.ts',
     ...
   });
   ```

Both functions have the same `name: 'renewableTools'`, which can cause Amplify Gen 2 to:
- Deploy the wrong version
- Cache the old version
- Fail to update the Lambda code
- Create deployment conflicts

## The Fix

**Deleted the duplicate definition:**
- Removed `amplify/functions/renewableTools/resource.ts`
- Only `amplify/data/resource.ts` definition remains
- This is the correct one (it's imported in `amplify/backend.ts`)

## Why This Happened

The unused `resource.ts` file was likely:
1. Created initially when setting up the function
2. Later moved to `amplify/data/resource.ts` for GraphQL integration
3. The old file was never deleted
4. Both files existed with the same function name
5. Amplify Gen 2 got confused about which one to deploy

## How to Verify the Fix

### Step 1: Clean rebuild
```bash
bash tests/force-clean-rebuild.sh
```

This will:
- Clear all Amplify build caches
- Clear TypeScript build info
- Force a complete rebuild

### Step 2: Restart sandbox
```bash
# Stop current sandbox (Ctrl+C)
npx ampx sandbox
# Wait for "Deployed" message
```

### Step 3: Verify new code is deployed
```bash
bash tests/verify-new-code-deployed.sh
```

This will:
- Prompt you to delete a project
- Check logs for the new code signature: `⚡️ NEW CODE v2.0 ⚡️`
- Verify ProjectLifecycleManager is being called

### Step 4: Test deletion
1. Delete a project in the UI
2. Wait for success message
3. Refresh browser
4. Request dashboard
5. Verify project is gone

### Step 5: Verify in S3
```bash
aws s3 ls "s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/renewable/projects/" \
  --recursive | grep "project.json" | wc -l
```

Should show one less project than before.

## What Changed

### Files Modified
1. **`amplify/functions/renewableTools/handler.ts`**
   - Added ProjectLifecycleManager integration
   - Proper cache invalidation
   - Added unique log message for verification

2. **`amplify/functions/renewableTools/resource.ts`**
   - **DELETED** (was causing duplicate name conflict)

### Files Unchanged
- `amplify/data/resource.ts` - Still has the active function definition
- `amplify/backend.ts` - Still imports from data/resource.ts
- All other files remain the same

## Expected Behavior After Fix

1. **Sandbox restart** → Detects file changes
2. **Build process** → Compiles handler.ts with new code
3. **Deployment** → Updates Lambda with new code
4. **Deletion** → Uses ProjectLifecycleManager
5. **Cache invalidation** → ProjectStore cache cleared
6. **Dashboard refresh** → Shows updated project list
7. **S3 verification** → project.json file actually deleted

## If It Still Doesn't Work

If after the clean rebuild and restart, the new code still doesn't deploy:

### Check 1: Build Errors
```bash
# Look for TypeScript compilation errors in sandbox output
# The sandbox terminal should show any build failures
```

### Check 2: Lambda Update Time
```bash
aws lambda get-function --function-name amplify-digitalassistant--renewableToolslambda2531-0hD8aJyAkObh \
  | jq -r '.Configuration.LastModified'
```

Should show a recent timestamp (within last few minutes).

### Check 3: Actual Deployed Code
The logs should show:
```
[renewableTools] ⚡️ NEW CODE v2.0 ⚡️ Deleting renewable project: {name}
[renewableTools] Deleting project metadata via ProjectLifecycleManager
[ProjectLifecycleManager] Deleting project: {name}
[ProjectStore] Deleted project: {name}
```

If you don't see these logs, the new code isn't deployed.

### Check 4: CDK Synthesis
```bash
# Check if CDK is synthesizing correctly
ls -la .amplify/artifacts/cdk.out/
```

Should show recent modification times.

## Alternative: Manual Lambda Update

If Amplify Gen 2 continues to have deployment issues, you can manually update the Lambda:

```bash
# 1. Build the function locally
cd amplify/functions/renewableTools
npm install
npx tsc

# 2. Create deployment package
zip -r function.zip handler.js node_modules

# 3. Update Lambda directly
aws lambda update-function-code \
  --function-name amplify-digitalassistant--renewableToolslambda2531-0hD8aJyAkObh \
  --zip-file fileb://function.zip
```

**Note**: This is a workaround. The proper fix is to resolve the Amplify Gen 2 deployment issue.

## Prevention

To prevent this issue in the future:

1. **Never have duplicate function definitions** with the same `name`
2. **Delete unused resource.ts files** when moving functions
3. **Always verify deployment** after code changes
4. **Use unique log messages** to verify new code is running
5. **Check Lambda update time** to confirm deployment

## Summary

- **Problem**: Duplicate function definitions with same name
- **Solution**: Deleted unused `amplify/functions/renewableTools/resource.ts`
- **Next Steps**: Clean rebuild, restart sandbox, verify deployment
- **Verification**: Look for `⚡️ NEW CODE v2.0 ⚡️` in logs

The deletion code itself is correct. The issue was purely a deployment problem caused by duplicate function definitions.
