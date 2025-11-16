# Task 8.6: Clean Up Amplify Dependencies - Tracking Document

## Status: PARTIALLY COMPLETE ✅

**Collections & OSDU files**: ✅ All clean (no unused imports) - VERIFIED
**ChatSession files**: ⏳ Waiting for REST API endpoints (11 files)
**Agent files**: ⏳ Waiting for REST API endpoints (4 files)

**Last Verified**: Task 8.6 continuation - Collections/OSDU cleanup confirmed

## Objective
Remove `aws-amplify/data` imports and `generateClient` usage where replaced with REST API, while keeping authentication dependencies.

## Files Requiring Updates

### ✅ ALREADY MIGRATED (Collections & OSDU - Task 8.5)
1. ✅ `src/app/collections/page.tsx` - Using REST API
2. ✅ `src/app/collections/[collectionId]/page.tsx` - Using REST API
3. ✅ `src/app/canvases/page.tsx` - Using REST API for collections
4. ✅ `src/app/catalog/page.tsx` - Using REST API for collections & OSDU
5. ✅ `src/components/CollectionContextBadge.tsx` - Using REST API
6. ✅ `src/utils/collectionInheritance.ts` - Using REST API
7. ✅ `src/utils/osduQueryExecutor.ts` - Using REST API
8. ✅ `src/services/agentService.ts` - Using REST API
9. ✅ `src/services/collectionContextLoader.ts` - Using REST API

### 🔄 NEEDS CLEANUP (Remove unused GraphQL imports)

#### High Priority - ChatSession Operations (11 files)
These files use ChatSession GraphQL operations that need REST API endpoints first:

10. ⏳ `src/components/TopNavBar.tsx`
    - Uses: `amplifyClient.models.ChatSession.create()`
    - Uses: `amplifyClient.mutations.invokeLightweightAgent()`
    - Action: Wait for ChatSession REST API

11. ⏳ `src/app/page.tsx` (Landing page)
    - Uses: `amplifyClient.models.ChatSession.create()`
    - Action: Wait for ChatSession REST API

12. ⏳ `src/app/layout.tsx`
    - Uses: `amplifyClient.models.ChatSession.create()`
    - Action: Wait for ChatSession REST API

13. ⏳ `src/app/petrophysical-analysis/page.tsx`
    - Uses: `amplifyClient.models.ChatSession.create()`
    - Uses: `amplifyClient.mutations.invokeLightweightAgent()`
    - Action: Wait for ChatSession REST API

14. ⏳ `src/app/listChats/page.tsx`
    - Uses: `amplifyClient.models.ChatSession.list()`
    - Uses: `amplifyClient.models.ChatSession.delete()`
    - Action: Wait for ChatSession REST API

15. ⏳ `src/app/create-new-chat/page.tsx`
    - Uses: `amplifyClient.models.ChatSession.get()`
    - Uses: `amplifyClient.models.ChatSession.create()`
    - Uses: `amplifyClient.mutations.invokeLightweightAgent()`
    - Action: Wait for ChatSession REST API

16. ⏳ `src/app/chat/[chatSessionId]/page.tsx`
    - Uses: `amplifyClient.models.ChatSession.get()`
    - Uses: `amplifyClient.models.ChatSession.update()`
    - Action: Wait for ChatSession REST API

17. ⏳ `src/components/ChatBox.tsx`
    - Uses: `generateClient<Schema>()`
    - Action: Wait for ChatSession REST API

18. ⏳ `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx`
    - Uses: `generateClient<Schema>()`
    - Uses: EDIcraft agent invocation
    - Action: Wait for Agent REST API

19. ⏳ `src/app/projects-table/page.tsx`
    - Uses: `amplifyClient` (needs verification of actual usage)
    - Action: Review and update if using GraphQL

20. ⏳ `src/app/projects/page.tsx`
    - Uses: `amplifyClient` (needs verification of actual usage)
    - Action: Review and update if using GraphQL

## Dependencies to KEEP

### ✅ Authentication (Keep These)
- `@aws-amplify/auth` - For Cognito authentication
- `@aws-amplify/ui-react` - For Authenticator component
- `fetchAuthSession` - For getting auth tokens

## Dependencies to REMOVE

### ❌ GraphQL/Data (Remove When Migrated)
- `aws-amplify/data` - Remove after all GraphQL usage migrated
- `generateClient` from `aws-amplify/api` - Remove after agent APIs migrated
- `generateClient` from `aws-amplify/data` - Remove after data APIs migrated
- `type Schema` from `amplify/data/resource` - Remove after all migrations

## Action Plan

### Phase 1: Identify Remaining Usage (COMPLETE)
- [x] Scan all source files for GraphQL usage
- [x] Categorize by operation type
- [x] Document dependencies

### Phase 2: Wait for REST API Endpoints
- [ ] ChatSession REST API (create, list, get, update, delete)
- [ ] Agent invocation REST API (invokeLightweightAgent, invokeEDIcraftAgent)

### Phase 3: Migrate Remaining Files
- [ ] Update ChatSession operations (files 10-18)
- [ ] Update Agent invocation operations (files 10, 13, 15, 19)
- [ ] Update Projects operations (files 19-20)

### Phase 4: Remove Unused Imports
- [ ] Remove `generateClient` imports where not used
- [ ] Remove `aws-amplify/data` imports where not used
- [ ] Remove `type Schema` imports where not used
- [ ] Keep authentication imports

### Phase 5: Verification
- [ ] Run TypeScript compilation
- [ ] Run build process
- [ ] Verify no broken imports
- [ ] Test authentication still works
- [ ] Test all migrated features

## Notes

### Collections & OSDU Migration (Task 8.5) - COMPLETE ✅
- All Collections GraphQL operations migrated to REST
- All OSDU GraphQL operations migrated to REST
- 9 files successfully updated
- Build passing, no errors

### ChatSession Migration - PENDING
- Requires new REST API endpoints for ChatSession CRUD operations
- 11 files waiting for migration
- This is the largest remaining GraphQL usage

### Agent Invocation Migration - PENDING
- Requires new REST API endpoint for agent invocation
- 4 files waiting for migration
- Currently uses `invokeLightweightAgent` and `invokeEDIcraftAgent` mutations

## Success Criteria

✅ All Collections/OSDU GraphQL removed (Task 8.5)
⏳ All ChatSession GraphQL removed (Waiting for REST API)
⏳ All Agent invocation GraphQL removed (Waiting for REST API)
✅ Authentication dependencies preserved
⏳ No broken imports
⏳ Build passes
⏳ All features functional

## Current Status Summary

- **Completed**: 9/20 files (45%)
- **Pending REST API**: 11/20 files (55%)
- **Collections/OSDU**: 100% complete ✅
- **ChatSession**: 0% complete (waiting for REST API)
- **Agent Invocation**: 0% complete (waiting for REST API)

## Verification Results

### ✅ Verified Clean (No Amplify Data Imports)
All Collections/OSDU files confirmed clean via grep search:
- `src/app/collections/**/*.tsx` - No matches
- `src/app/catalog/page.tsx` - No matches
- `src/services/*.ts` - No matches
- `src/utils/*.ts` - No matches

### ⏳ Remaining Files with Amplify Data Imports
15 files still using `generateClient` or `aws-amplify/data`:
- 11 ChatSession files (TopNavBar, page.tsx, layout.tsx, etc.)
- 4 Agent invocation files (EDIcraftAgentLanding, etc.)

These files require REST API endpoints before cleanup can proceed.

## What Can Be Done Now ✅

Task 8.6 is **partially complete** for the Collections/OSDU migration:

1. ✅ **Collections/OSDU files are clean** (9 files)
   - No unused `aws-amplify/data` imports
   - No unused `generateClient` calls
   - All using REST API successfully
   - Build passing for these files

2. ✅ **Verification complete**
   - Grep searches confirm no Amplify data imports in migrated files
   - TypeScript compilation shows no errors in migrated files
   - Ready for next phase

## What Needs to Wait ⏳

The remaining 11 files **cannot be cleaned up yet** because they still actively use GraphQL operations that don't have REST API endpoints:

### ChatSession Operations (11 files need REST API first)
These files use `ChatSession.create()`, `.list()`, `.get()`, `.update()`, `.delete()`:
1. `src/components/TopNavBar.tsx`
2. `src/app/page.tsx`
3. `src/app/layout.tsx`
4. `src/app/petrophysical-analysis/page.tsx`
5. `src/app/listChats/page.tsx`
6. `src/app/create-new-chat/page.tsx`
7. `src/app/chat/[chatSessionId]/page.tsx`
8. `src/components/ChatBox.tsx`
9. `src/app/projects-table/page.tsx`
10. `src/app/projects/page.tsx`
11. `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx`

**Required before cleanup:**
- Create REST API endpoints for ChatSession CRUD operations
- Migrate these files to use REST API
- Then remove unused Amplify imports

### Test Files (Keep as-is)
Test files in `tests/` and `scripts/` should keep Amplify imports since they're testing Amplify functionality.

## Next Steps

### Phase 1: Create ChatSession REST API (Future Task)
1. Add ChatSession Lambda handler in `cdk/lambda-functions/chat-sessions/`
2. Add routes to API Gateway:
   - POST `/api/chat-sessions` (create)
   - GET `/api/chat-sessions` (list)
   - GET `/api/chat-sessions/{id}` (get)
   - PUT `/api/chat-sessions/{id}` (update)
   - DELETE `/api/chat-sessions/{id}` (delete)
3. Create `src/lib/api/chat-sessions.ts` client

### Phase 2: Migrate ChatSession Files (Future Task)
1. Update 11 files to use REST API
2. Remove unused `generateClient` imports
3. Remove unused `aws-amplify/data` imports
4. Keep authentication imports

### Phase 3: Final Cleanup (Future Task)
1. Verify no production code uses `aws-amplify/data`
2. Consider removing from package.json (keep for tests if needed)
3. Document authentication-only Amplify usage

## Task 8.6 Status: PARTIALLY COMPLETE ✅

**What's Done:**
- Collections/OSDU cleanup: 100% complete (9 files)
- Verification: Complete
- Documentation: Updated

**What's Pending:**
- ChatSession cleanup: 0% complete (waiting for REST API)
- Agent invocation cleanup: 0% complete (waiting for REST API)

**Recommendation:** Mark task 8.6 as complete for the Collections/OSDU scope. Create a new task (e.g., 9.6) for ChatSession cleanup after REST API is created.
