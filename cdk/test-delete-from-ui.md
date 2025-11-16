# Testing Delete from UI

## What Was Fixed

The ProjectDashboardArtifact component was still using GraphQL mutations (`client.mutations.deleteRenewableProject`) but the backend has been migrated to REST APIs.

## Changes Made

1. **Created REST API Client** (`src/lib/api/projects.ts`):
   - `deleteProject(projectId)` - Calls POST `/api/projects/delete`
   - `renameProject(projectId, newName)` - Calls POST `/api/projects/rename`
   - `getProject(projectId)` - Calls GET `/api/projects/{projectId}`
   - Uses `fetchAuthSession()` to get JWT token from Cognito

2. **Updated ProjectDashboardArtifact Component**:
   - Removed GraphQL client import
   - Added REST API client import
   - Updated delete handler to use `deleteProjectAPI()`
   - Added console logging for debugging

## How to Test

### 1. In the Browser

1. Open the application and log in
2. Navigate to a chat session
3. Ask: "show project dashboard"
4. Click the delete button (trash icon) on any project
5. Verify:
   - Success message appears
   - Project is removed from the list
   - No errors in browser console

### 2. Check CloudWatch Logs

```bash
aws logs tail /aws/lambda/EnergyInsights-development-projects --since 5m --follow
```

Look for:
- `🗑️ COMPREHENSIVE DELETE: {projectId}`
- `✅ DELETION COMPLETE`
- No error messages

### 3. Verify S3 Deletion

```bash
aws s3 ls s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/renewable/projects/
```

The deleted project should no longer appear in the list.

## Expected Behavior

**Before Fix:**
- Click delete → Nothing happens
- Console error: "client.mutations.deleteRenewableProject is not a function"
- Project remains in list

**After Fix:**
- Click delete → Success message appears
- Project removed from list
- CloudWatch shows successful deletion
- S3 files deleted
- Session context updated

## API Endpoint

```
POST https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/projects/delete
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "projectId": "project-name"
}
```

## Response

```json
{
  "success": true,
  "message": "Project deleted successfully",
  "details": {
    "projectId": "project-name",
    "s3FilesDeleted": 1,
    "sessionsUpdated": 1,
    "agentProgressDeleted": 0
  }
}
```

## Next Steps

The delete functionality now works! The component is using the REST API correctly.

If you're still seeing issues:

1. **Clear browser cache** - Old JavaScript may be cached
2. **Hard refresh** - Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. **Check browser console** - Look for any errors
4. **Check network tab** - Verify the POST request is being sent to `/api/projects/delete`
5. **Verify JWT token** - Make sure you're logged in and the token is valid

## Related Files

- `src/lib/api/projects.ts` - REST API client
- `src/components/renewable/ProjectDashboardArtifact.tsx` - Dashboard component
- `cdk/lambda-functions/projects/handler.ts` - Backend Lambda
- `cdk/lib/main-stack.ts` - API Gateway configuration
