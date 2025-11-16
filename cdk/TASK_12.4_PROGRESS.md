# Task 12.4 Progress: Update Components to Use REST API

## Status: IN PROGRESS

## Completed Files ✅

1. **src/pages/HomePage.tsx** ✅
   - Replaced `amplifyClient.models.ChatSession.create()` with `createSession()`
   - Removed Amplify imports
   - Updated to use `newChatSession.id` instead of `newChatSession.data.id`

2. **src/pages/ListChatsPage.tsx** ✅
   - Replaced `amplifyClient.models.ChatSession.list()` with `listSessions()`
   - Replaced `amplifyClient.models.ChatSession.delete()` with `deleteSession()`
   - Removed Amplify imports
   - Updated filter logic (REST API filters by owner automatically)

3. **src/pages/CreateNewChatPage.tsx** ✅
   - Replaced `amplifyClient.models.ChatSession.get()` with `getSession()`
   - Replaced `amplifyClient.models.ChatSession.create()` with `createSession()`
   - Removed Amplify imports
   - Updated to use direct session object instead of `.data` wrapper

4. **src/app/page.tsx** ✅
   - Replaced `amplifyClient.models.ChatSession.create()` with `createSession()`
   - Removed Amplify imports
   - Updated to use `newChatSession.id` instead of `newChatSession.data.id`

## Remaining Files (7 files)

### 5. src/app/layout.tsx
**Changes needed:**
- Import: `import { createSession } from '@/lib/api/sessions';`
- Remove: `generateClient` and `Schema` imports
- Replace: `amplifyClient.models.ChatSession.create({})` → `createSession({})`
- Update: `newChatSession.data.id` → `newChatSession.id`
- **Locations:** Lines 73, 93

### 6. src/app/petrophysical-analysis/page.tsx
**Changes needed:**
- Import: `import { createSession } from '@/lib/api/sessions';`
- Remove: `generateClient` and `Schema` imports
- Replace: `amplifyClient.models.ChatSession.create({})` → `createSession({})`
- Update: `newChatSession.data.id` → `newChatSession.id`
- **Location:** Line 20

### 7. src/app/create-new-chat/page.tsx
**Changes needed:**
- Import: `import { createSession, getSession } from '@/lib/api/sessions';`
- Remove: `generateClient` and `Schema` imports
- Replace: `amplifyClient.models.ChatSession.get()` → `getSession()`
- Replace: `amplifyClient.models.ChatSession.create()` → `createSession()`
- Update: Remove `.data` wrapper from responses
- **Locations:** Lines 28, 66

### 8. src/app/listChats/page.tsx
**Changes needed:**
- Import: `import { listSessions, deleteSession } from '@/lib/api/sessions';`
- Remove: `generateClient` and `Schema` imports
- Replace: `amplifyClient.models.ChatSession.list()` → `listSessions(100)`
- Replace: `amplifyClient.models.ChatSession.delete()` → `deleteSession()`
- Update: Remove filter logic (REST API filters by owner automatically)
- **Locations:** Lines 24, 60, 130

### 9. src/app/canvases/page.tsx
**Changes needed:**
- Import: `import { listSessions, deleteSession } from '@/lib/api/sessions';`
- Remove: `generateClient` and `Schema` imports
- Replace: `amplifyClient.models.ChatSession.list()` → `listSessions(100)`
- Replace: `amplifyClient.models.ChatSession.delete()` → `deleteSession()`
- Update: Remove filter logic
- **Locations:** Lines 59, 219

### 10. src/app/chat/[chatSessionId]/page.tsx
**Changes needed:**
- Import: `import { getSession, updateSession } from '@/lib/api/sessions';`
- Remove: `generateClient` and `Schema` imports
- Replace: `amplifyClient.models.ChatSession.get()` → `getSession()`
- Replace: `amplifyClient.models.ChatSession.update()` → `updateSession()`
- Update: Remove `.data` wrapper from responses
- **Locations:** Lines 266, 290, 300

### 11. src/components/TopNavBar.tsx
**Changes needed:**
- Import: `import { createSession } from '@/lib/api/sessions';`
- Remove: `generateClient` and `Schema` imports
- Replace: `amplifyClient.models.ChatSession.create({})` → `createSession({})`
- Update: `newChatSession.data.id` → `newChatSession.id`
- **Locations:** Lines 36, 49

### 12. src/pages/CanvasesPage.tsx
**Changes needed:**
- Import: `import { listSessions, deleteSession } from '@/lib/api/sessions';`
- Remove: `generateClient` and `Schema` imports
- Replace: `amplifyClient.models.ChatSession.list()` → `listSessions(100)`
- Replace: `amplifyClient.models.ChatSession.delete()` → `deleteSession()`
- Update: Remove filter logic
- **Locations:** Lines 59, 219

## Pattern for Updates

### Import Changes
```typescript
// REMOVE
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
const amplifyClient = generateClient<Schema>();

// ADD
import { createSession, listSessions, getSession, updateSession, deleteSession } from '@/lib/api/sessions';
```

### API Call Changes
```typescript
// CREATE
// OLD: const session = await amplifyClient.models.ChatSession.create({});
// NEW: const session = await createSession({});

// LIST
// OLD: const result = await amplifyClient.models.ChatSession.list({ filter: {...} });
// NEW: const result = await listSessions(100); // Filters by owner automatically

// GET
// OLD: const { data: session } = await amplifyClient.models.ChatSession.get({ id });
// NEW: const session = await getSession(id);

// UPDATE
// OLD: const { data: updated } = await amplifyClient.models.ChatSession.update({ id, ...updates });
// NEW: const updated = await updateSession(id, updates);

// DELETE
// OLD: await amplifyClient.models.ChatSession.delete({ id });
// NEW: await deleteSession(id);
```

### Response Object Changes
```typescript
// OLD: newChatSession.data.id
// NEW: newChatSession.id

// OLD: result.data (array of sessions)
// NEW: result.data (array of sessions) - same structure

// OLD: { data: session }
// NEW: session (direct object)
```

## Next Steps

1. Complete remaining 7 files
2. Test each updated component
3. Verify no console errors
4. Check that all CRUD operations work
5. Move to Task 12.5 (Remove GraphQL dependencies)

## Testing Checklist

After completing all updates:
- [ ] Create new chat session
- [ ] List chat sessions
- [ ] Open existing chat session
- [ ] Update chat session name
- [ ] Delete chat session
- [ ] Verify canvases page works
- [ ] Verify petrophysical analysis page works
- [ ] Verify TopNavBar "New Chat" button works
- [ ] Check browser console for errors
- [ ] Verify no GraphQL calls in network tab
