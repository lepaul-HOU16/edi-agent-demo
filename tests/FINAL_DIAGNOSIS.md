# Final Diagnosis - Amplify Gen 2 Not Deploying Code Changes

## The Situation

- Code changes made to `amplify/functions/renewableTools/handler.ts`
- Sandbox restarted multiple times
- Lambda shows recent update time (15:10:48 UTC)
- But old code is still executing

## What We Know

1. **Lambda IS being updated** - LastModified: 2025-11-12T15:10:48.000+0000
2. **But code changes aren't included** - Old deletion logic still runs
3. **No build errors** - TypeScript compiles fine
4. **Permissions are correct** - S3 DeleteObject permission exists
5. **Duplicate function definition removed** - Only one definition now

## The Real Problem

**Amplify Gen 2's `defineFunction` with TypeScript is not including source changes in the deployment bundle.**

This is likely because:
- The function is defined in `amplify/data/resource.ts` with `entry: '../functions/renewableTools/handler.ts'`
- Amplify uses esbuild or similar to bundle the code
- The bundle is being cached somewhere
- File changes aren't triggering a rebuild

## Possible Solutions

### Solution 1: Force Complete Rebuild

```bash
# Stop sandbox
# Delete ALL caches
rm -rf .amplify
rm -rf node_modules/.cache
rm -rf .next
rm -rf out

# Reinstall (in case there's a corrupted package)
npm install

# Start fresh
npx ampx sandbox
```

### Solution 2: Change Function Definition Location

Move the function definition from `amplify/data/resource.ts` to a separate file:

```typescript
// Create: amplify/functions/renewableTools/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const renewableToolsFunction = defineFunction({
  name: 'renewableToolsV2',  // ← Change name to force new deployment
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
});
```

Then import it in `amplify/backend.ts` instead of from `data/resource.ts`.

### Solution 3: Manual Lambda Update (Immediate Fix)

Bypass Amplify entirely and update the Lambda directly:

```bash
bash tests/manual-lambda-update.sh
```

This will:
- Bundle the handler with esbuild
- Upload directly to Lambda
- Bypass Amplify's caching

### Solution 4: Add Explicit Build Step

Add a build script to package.json:

```json
{
  "scripts": {
    "build:renewableTools": "esbuild amplify/functions/renewableTools/handler.ts --bundle --platform=node --outfile=amplify/functions/renewableTools/dist/index.js"
  }
}
```

Then modify the function definition to use the built file:

```typescript
export const renewableToolsFunction = defineFunction({
  name: 'renewableTools',
  entry: '../functions/renewableTools/dist/index.js',  // ← Use built file
  ...
});
```

## Recommended Immediate Action

**Use Solution 3 (Manual Update) to fix the deletion issue NOW:**

```bash
chmod +x tests/manual-lambda-update.sh
bash tests/manual-lambda-update.sh
```

This will:
1. Bundle your current handler.ts code
2. Upload it directly to the Lambda
3. Bypass all Amplify caching issues
4. Fix deletion immediately

Then you can investigate the Amplify deployment issue separately.

## Long-Term Fix

The Amplify Gen 2 deployment issue needs to be resolved. Possible causes:

1. **Bug in Amplify Gen 2** - The sandbox watch/rebuild might be broken
2. **Configuration issue** - Something in the project setup is preventing rebuilds
3. **Cache corruption** - Build caches are stale and not being invalidated

## Verification After Manual Update

After running the manual update script:

```bash
# 1. Check version
bash tests/check-lambda-version.sh
# Should show: ✅ NEW CODE v3.0 IS DEPLOYED

# 2. Delete a project in UI

# 3. Check logs
aws logs tail /aws/lambda/amplify-digitalassistant--renewableToolslambda2531-0hD8aJyAkObh \
  --since 1m --format short | grep "NEW CODE v2.0"

# 4. Verify S3 deletion
aws s3 ls "s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/renewable/projects/" \
  --recursive | grep "project.json" | wc -l
# Should be one less than before
```

## Summary

- **Problem**: Amplify Gen 2 not deploying TypeScript changes
- **Immediate Fix**: Manual Lambda update script
- **Long-term**: Need to fix Amplify deployment process
- **Next Step**: Run `bash tests/manual-lambda-update.sh`
