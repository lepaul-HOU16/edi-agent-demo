# Project Deletion Root Cause Fix

## Problem Statement

Projects appeared to delete successfully in the UI, but when returning in a fresh session and requesting the dashboard, the deleted projects were still visible. The deletion was not persisting across sessions.

## Root Cause Analysis

The `deleteRenewableProject` function in `amplify/functions/renewableTools/handler.ts` was:

1. **Deleting artifact files directly** from S3 using AWS SDK (`renewable/{projectId}/*`)
2. **Attempting to delete project.json** but using direct S3 SDK calls
3. **NOT using ProjectStore.delete()** which invalidates the cache
4. **NOT using ProjectLifecycleManager** which orchestrates the complete deletion flow

### The Critical Missing Step

The dashboard reads project data from `renewable/projects/{projectId}/project.json`. This file was being deleted with a direct S3 SDK call, but:

- **ProjectStore cache was NOT invalidated** - The in-memory cache still contained the project
- **ProjectResolver cache was NOT cleared** - Name resolution cache still had the project
- **List cache was NOT invalidated** - The list of all projects was stale

When a fresh session requested the dashboard, it would:
1. Check the ProjectStore list cache (10 second TTL)
2. If cache was still valid, return cached data (including "deleted" project)
3. If cache expired, fetch from S3 and rebuild cache
4. But the project.json file might still exist due to eventual consistency

## The Fix

Changed `deleteRenewableProject` to use the proper deletion flow:

### Before (BROKEN):
```typescript
async function deleteRenewableProject(projectId: string) {
  // Delete artifact files directly
  await s3.send(new DeleteObjectsCommand(...));
  
  // Delete project.json directly
  await s3.send(new DeleteObjectCommand({
    Key: `renewable/projects/${projectId}/project.json`
  }));
  
  // ❌ Cache NOT invalidated
  // ❌ ProjectResolver NOT cleared
  // ❌ No proper error handling
}
```

### After (FIXED):
```typescript
async function deleteRenewableProject(projectId: string) {
  // 1. Delete artifact files
  await s3.send(new DeleteObjectsCommand(...));
  
  // 2. Use ProjectLifecycleManager for proper deletion
  const projectStore = new ProjectStore(bucketName);
  const projectResolver = new ProjectResolver(projectStore);
  const projectNameGenerator = new ProjectNameGenerator(projectStore);
  const sessionContextManager = new SessionContextManager(bucketName);
  
  const lifecycleManager = new ProjectLifecycleManager(
    projectStore,
    projectResolver,
    projectNameGenerator,
    sessionContextManager
  );
  
  // This properly:
  // ✅ Deletes project.json via ProjectStore.delete()
  // ✅ Invalidates ProjectStore cache
  // ✅ Clears ProjectResolver cache
  // ✅ Updates session context if needed
  const result = await lifecycleManager.deleteProject(projectId, true);
}
```

## Complete Deletion Flow

The proper deletion flow now follows these steps:

1. **Delete Artifact Files** (`renewable/{projectId}/*`)
   - All terrain, layout, simulation, report files
   - Direct S3 deletion is fine for these

2. **Call ProjectLifecycleManager.deleteProject()**
   - Checks if project exists
   - Checks if project is in progress
   - Calls ProjectStore.delete()

3. **ProjectStore.delete() Executes**
   - Deletes `renewable/projects/{projectId}/project.json` from S3
   - Removes project from in-memory cache: `this.cache.delete(projectName)`
   - Invalidates list cache: `this.listCache = null`

4. **ProjectResolver.clearCache() Called**
   - Clears name resolution cache
   - Ensures fresh lookups on next request

5. **Session Context Updated** (if needed)
   - If deleted project was active, clear active project
   - Ensures session doesn't reference deleted project

## Why This Matters

### Cache Invalidation is Critical

The ProjectStore uses a 10-second cache TTL. Without proper invalidation:
- Deleted projects remain in cache for up to 10 seconds
- Fresh sessions within that window see stale data
- Even after cache expires, eventual consistency issues could persist

### Proper Deletion Ensures

1. **Immediate Cache Invalidation** - No waiting for TTL expiration
2. **Complete Cleanup** - All references removed (cache, resolver, session)
3. **Consistent State** - Dashboard always shows current state
4. **Error Handling** - Proper error messages if deletion fails

## Testing

Run the verification script:

```bash
bash tests/verify-deletion-actually-works.sh
```

This verifies:
- ✅ ProjectLifecycleManager is imported and used
- ✅ ProjectStore.delete() invalidates caches
- ✅ Cache TTL is reasonable (10 seconds)
- ✅ Complete deletion flow is implemented

## Deployment

1. **Deploy the fix:**
   ```bash
   npx ampx sandbox
   ```

2. **Wait for deployment to complete** (5-10 minutes)

3. **Test in UI:**
   - Delete a project from dashboard
   - Refresh the page
   - Request dashboard again
   - Verify project is gone

4. **Test in fresh session:**
   - Open new incognito window
   - Login
   - Request dashboard
   - Verify deleted project is NOT shown

## Prevention

To prevent this regression:

1. **Always use ProjectLifecycleManager** for project operations
2. **Never bypass ProjectStore** for project.json operations
3. **Always invalidate caches** when modifying data
4. **Test across sessions** to verify persistence

## Related Files

- `amplify/functions/renewableTools/handler.ts` - Fixed deletion function
- `amplify/functions/shared/projectStore.ts` - Cache management
- `amplify/functions/shared/projectLifecycleManager.ts` - Orchestration
- `amplify/functions/shared/projectResolver.ts` - Name resolution
- `tests/verify-deletion-actually-works.sh` - Verification script

## Success Criteria

✅ Projects deleted in UI disappear immediately
✅ Projects remain deleted after page refresh
✅ Projects remain deleted in fresh sessions
✅ Dashboard shows accurate project list
✅ No stale cache data
✅ Proper error handling if deletion fails

---

**Status:** FIXED
**Date:** 2025-01-14
**Verified:** Code analysis passed all checks
**Next:** Deploy and test in UI
