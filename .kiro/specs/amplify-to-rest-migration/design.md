# Design Document: Amplify SDK to REST API Migration

## Overview

This design outlines the systematic replacement of AWS Amplify SDK calls with REST API calls across the frontend codebase. The migration preserves all functionality while removing Amplify and Next.js dependencies.

## Architecture

### Current Architecture (Amplify SDK)
```
Frontend Component
  ↓
generateClient() → Amplify SDK
  ↓
GraphQL/DataStore
  ↓
AWS AppSync
  ↓
DynamoDB/Lambda
```

### Target Architecture (REST API)
```
Frontend Component
  ↓
fetch/axios → REST API Client (src/lib/api/)
  ↓
HTTP REST Endpoints
  ↓
Express/Lambda Backend
  ↓
DynamoDB/Services
```

## Components and Interfaces

### 1. REST API Client Layer (`src/lib/api/`)

**Existing Files:**
- `client.ts` - Base HTTP client with auth
- `sessions.ts` - Chat session operations
- `chat.ts` - Message operations
- `projects.ts` - Project CRUD operations
- `collections.ts` - Collection operations
- `catalog.ts` - Data catalog operations

**Interface Pattern:**
```typescript
// All API functions return promises
export async function operation(params): Promise<Result> {
  const response = await apiClient.method('/endpoint', data);
  return response.data;
}
```

### 2. Page Migration Pattern

**For each page that uses Amplify:**

1. **Identify Amplify Operations**
   - Find all `amplifyClient.models.*` calls
   - Find all `amplifyClient.mutations.*` calls
   - Find all `amplifyClient.graphql()` calls

2. **Map to REST API**
   - `amplifyClient.models.ChatMessage.create()` → `sendMessage()` from `chat.ts`
   - `amplifyClient.models.Project.list()` → `getProjects()` from `projects.ts`
   - `amplifyClient.models.Project.update()` → `updateProject()` from `projects.ts`

3. **Replace Imports**
   ```typescript
   // REMOVE
   import { generateClient } from 'aws-amplify/data';
   import { type Schema } from '@/../amplify/data/resource';
   
   // ADD
   import { sendMessage, getMessages } from '@/lib/api/chat';
   import { createSession, getSession } from '@/lib/api/sessions';
   ```

4. **Replace State Management**
   ```typescript
   // REMOVE
   const [amplifyClient, setAmplifyClient] = useState<any>(null);
   
   // NO REPLACEMENT NEEDED - use API functions directly
   ```

5. **Replace Operations**
   ```typescript
   // BEFORE
   const result = await amplifyClient.models.Project.list();
   
   // AFTER
   const result = await getProjects();
   ```

### 3. Navigation Migration Pattern

**Replace Next.js navigation:**

```typescript
// REMOVE
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/path');

// ADD
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/path');
```

**Replace route parameters:**

```typescript
// REMOVE
import { useParams } from 'next/navigation';
const params = useParams();
const id = params.id;

// ADD
import { useParams } from 'react-router-dom';
const { id } = useParams();
```

### 4. Dynamic Import Migration Pattern

**Replace Next.js dynamic imports:**

```typescript
// REMOVE
import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

// ADD
import React, { Suspense } from 'react';
const Plot = React.lazy(() => import('react-plotly.js'));

// Usage
<Suspense fallback={<div>Loading...</div>}>
  <Plot data={data} layout={layout} />
</Suspense>
```

## Data Models

### Chat Message Flow

**Amplify SDK:**
```typescript
const message: Schema['ChatMessage']['createType'] = {
  role: 'human',
  content: { text: 'Hello' },
  chatSessionId: sessionId
};
await amplifyClient.models.ChatMessage.create(message);
```

**REST API:**
```typescript
const message = {
  role: 'human',
  content: { text: 'Hello' },
  chatSessionId: sessionId
};
await sendMessage(message);
```

### Project Operations Flow

**Amplify SDK:**
```typescript
// List
const result = await amplifyClient.models.Project.list();
const projects = result.data;

// Update
await amplifyClient.models.Project.update({
  id: projectId,
  status: newStatus
});

// Delete
await amplifyClient.models.Project.delete({ id: projectId });
```

**REST API:**
```typescript
// List
const projects = await getProjects();

// Update
await updateProject(projectId, { status: newStatus });

// Delete
await deleteProject(projectId);
```

## Error Handling

### Amplify SDK Error Pattern
```typescript
try {
  const result = await amplifyClient.models.Project.list();
} catch (error) {
  console.error('Amplify error:', error);
}
```

### REST API Error Pattern
```typescript
try {
  const projects = await getProjects();
} catch (error) {
  if (error.response?.status === 401) {
    // Handle auth error
  } else if (error.response?.status === 404) {
    // Handle not found
  } else {
    console.error('API error:', error);
  }
}
```

## Testing Strategy

### Unit Tests
- Test each API client function independently
- Mock HTTP responses
- Verify correct endpoints and payloads

### Integration Tests
- Test page components with mocked API responses
- Verify state updates correctly
- Verify UI renders correctly

### E2E Tests
- Test complete user workflows
- Verify chat message flow
- Verify project CRUD operations
- Verify navigation

## Migration Order

### Phase 1: Core Pages (High Priority)
1. ChatPage - Most critical, uses sessions and messages APIs
2. CreateNewChatPage - Uses sessions API
3. ProjectsPage - Uses projects API

### Phase 2: Supporting Pages
4. ListChatsPage - Uses sessions API
5. CollectionsPage - Uses collections API
6. CatalogPage - Uses catalog API

### Phase 3: Components
7. FileViewer - Replace Amplify Storage with backend API
8. FileExplorer - Replace Amplify Storage with backend API
9. PlotDataToolComponent - Replace Amplify Storage with backend API

### Phase 4: Utilities
10. Remove unused Amplify utility functions
11. Clean up imports across all files
12. Remove Amplify from package.json

## Rollback Strategy

If migration fails:
1. Git checkout specific files that were working
2. Restore Amplify imports for that file only
3. Document why migration failed
4. Fix REST API backend if needed
5. Retry migration

## Success Criteria

- Zero Amplify imports in `src/` directory
- Zero Next.js imports in `src/` directory
- All pages load without errors
- All user workflows function correctly
- Build completes successfully
- No runtime errors in console
