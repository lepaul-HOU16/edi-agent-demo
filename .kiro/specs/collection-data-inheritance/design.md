# Design Document

## Overview

The Collection Data Inheritance system completes the data flow from catalog searches to reusable collections to canvas workspaces. The design focuses on three core components: a Session REST API for persistence, a context loading service for data inheritance, and UI components for displaying collection context.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CatalogPage ──► CollectionDetailPage ──► CreateNewChatPage     │
│       │                    │                       │             │
│       │                    │                       │             │
│       ▼                    ▼                       ▼             │
│  Create Collection    View Collection      Create Canvas        │
│                                                    │             │
│                                                    ▼             │
│                                              ChatPage            │
│                                                    │             │
│                                                    ▼             │
│                                          Load Collection         │
│                                              Context             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API Calls
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                         API Gateway                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌───────────────────────────┐   ┌──────────────────────────┐
│  Collections Lambda       │   │  Sessions Lambda         │
│  (Existing)               │   │  (NEW)                   │
├───────────────────────────┤   ├──────────────────────────┤
│ - Create collection       │   │ - Create session         │
│ - List collections        │   │ - Get session            │
│ - Get collection          │   │ - Update session         │
│ - Update collection       │   │ - Delete session         │
│ - Delete collection       │   │ - List sessions          │
│ - Query collection        │   │                          │
└───────────────────────────┘   └──────────────────────────┘
                │                           │
                │                           │
                ▼                           ▼
┌───────────────────────────────────────────────────────────┐
│                    DynamoDB Tables                         │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  Collections Table          Sessions Table                │
│  ─────────────────          ──────────────                │
│  PK: collectionId           PK: sessionId                 │
│  - name                     - name                        │
│  - description              - linkedCollectionId ◄────┐   │
│  - dataSourceType           - collectionContext       │   │
│  - dataItems                - createdAt                   │
│  - previewMetadata          - updatedAt                   │
│  - createdAt                - owner                       │
│  - owner                                                  │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Session REST API (NEW)

**File**: `cdk/lambda-functions/sessions/handler.ts`

**Purpose**: Manage canvas sessions with collection linking support

**Endpoints**:

```typescript
POST   /api/sessions/create
GET    /api/sessions/{id}
PUT    /api/sessions/{id}
DELETE /api/sessions/{id}
GET    /api/sessions/list
```

**Interface**:

```typescript
interface Session {
  id: string;
  name: string;
  linkedCollectionId?: string;
  collectionContext?: CollectionContext;
  createdAt: string;
  updatedAt: string;
  owner: string;
}

interface CollectionContext {
  collectionId: string;
  name: string;
  wellCount: number;
  dataSourceType: string;
  dataItems: DataItem[];
  previewMetadata: any;
}

interface CreateSessionRequest {
  name: string;
  linkedCollectionId?: string;
}

interface UpdateSessionRequest {
  name?: string;
  linkedCollectionId?: string;
  collectionContext?: CollectionContext;
}
```

**Storage Strategy**:
- Use DynamoDB for persistent storage
- Table name: `Sessions-{environment}`
- Primary key: `sessionId` (string)
- GSI: `owner-createdAt-index` for listing user sessions
- TTL: Optional, set to 90 days for auto-cleanup

### 2. Session API Client (NEW)

**File**: `src/lib/api/sessions.ts`

**Purpose**: Frontend client for session REST API

**Functions**:

```typescript
export async function createSession(data: CreateSessionRequest): Promise<{
  success: boolean;
  session: Session;
  sessionId: string;
}>;

export async function getSession(sessionId: string): Promise<{
  success: boolean;
  session: Session;
}>;

export async function updateSession(
  sessionId: string,
  data: UpdateSessionRequest
): Promise<{
  success: boolean;
  session: Session;
}>;

export async function deleteSession(sessionId: string): Promise<{
  success: boolean;
  message: string;
}>;

export async function listSessions(): Promise<{
  sessions: Session[];
  count: number;
}>;
```

### 3. Collection Context Loader (UPDATE)

**File**: `src/services/collectionContextLoader.ts`

**Purpose**: Load and cache collection context for canvases

**Changes**:
- Remove `console.warn()` placeholders
- Implement actual session API calls
- Add proper error handling
- Enable context caching

**Key Functions**:

```typescript
// Load context for a canvas
async loadCanvasContext(
  chatSessionId: string,
  collectionId?: string
): Promise<CollectionContext | null>;

// Validate data access within collection scope
validateDataAccess(
  requestedDataIds: string[],
  context: CollectionContext | null
): DataAccessValidation;

// Invalidate cache when collection updates
invalidateCache(collectionId: string): void;
```

### 4. Collection Inheritance Utils (UPDATE)

**File**: `src/utils/collectionInheritance.ts`

**Purpose**: Utility functions for collection context

**Changes**:
- Implement `getCanvasCollectionContext()` using session API
- Remove placeholder returns
- Add error handling

**Key Functions**:

```typescript
// Load collection for canvas
export async function loadCollectionForCanvas(
  collectionId: string
): Promise<CollectionData | null>;

// Get canvas collection context
export async function getCanvasCollectionContext(
  chatSessionId: string
): Promise<CollectionData | null>;

// Get well file paths
export function getWellFilePaths(collection: CollectionData): string[];

// Get collection summary
export function getCollectionSummary(collection: CollectionData): string;
```

### 5. ChatPage Updates (UPDATE)

**File**: `src/pages/ChatPage.tsx`

**Purpose**: Display collection context in canvas

**Changes**:
- Load collection context on mount
- Display collection alert
- Show breadcrumb navigation
- Pass context to AI agents

**UI Components**:

```typescript
// Collection Context Alert
{collectionContext && (
  <Alert
    type="info"
    header={`Collection: ${collectionContext.name}`}
    action={
      <Button
        variant="link"
        onClick={() => navigate(`/collections/${collectionContext.id}`)}
      >
        View Collection
      </Button>
    }
  >
    <SpaceBetween direction="vertical" size="xs">
      <Box>{getCollectionSummary(collectionContext)}</Box>
      {collectionContext.dataSourceType === 'S3' && (
        <Box>
          📁 All {collectionContext.dataItems?.length || 0} well files 
          accessible in Session Files panel
        </Box>
      )}
    </SpaceBetween>
  </Alert>
)}

// Breadcrumb Navigation
{collectionContext && (
  <BreadcrumbGroup
    items={[
      {
        text: collectionContext.name,
        href: `/collections/${collectionContext.id}`
      },
      {
        text: activeChatSession?.name || 'Canvas',
        href: '#'
      }
    ]}
  />
)}
```

### 6. CreateNewChatPage Updates (UPDATE)

**File**: `src/pages/CreateNewChatPage.tsx`

**Purpose**: Create canvas with collection link

**Changes**:
- Accept `collectionId` query parameter
- Pass `linkedCollectionId` to session creation
- Load and cache collection context

**Flow**:

```typescript
// Get collectionId from URL params
const [searchParams] = useSearchParams();
const collectionId = searchParams.get('collectionId');

// Create session with collection link
const sessionData = {
  name: `Canvas - ${new Date().toLocaleString()}`,
  linkedCollectionId: collectionId || undefined
};

const newSession = await createSession(sessionData);

// Load collection context if linked
if (collectionId) {
  const context = await loadCanvasContext(newSession.sessionId, collectionId);
  if (context) {
    // Cache context for immediate use
    await updateSession(newSession.sessionId, {
      collectionContext: context
    });
  }
}

// Navigate to canvas
navigate(`/chat/${newSession.sessionId}`);
```

### 7. CollectionDetailPage Updates (UPDATE)

**File**: `src/pages/CollectionDetailPage.tsx`

**Purpose**: Display linked canvases

**Changes**:
- Load linked canvases using session API
- Display canvas cards
- Show canvas count in header

**Query**:

```typescript
// Load canvases linked to this collection
const loadLinkedCanvases = async () => {
  const allSessions = await listSessions();
  const linkedCanvases = allSessions.sessions.filter(
    s => s.linkedCollectionId === collectionId
  );
  setCanvases(linkedCanvases);
};
```

## Data Models

### Session Model

```typescript
interface Session {
  // Primary key
  id: string;
  
  // Basic info
  name: string;
  owner: string;
  
  // Collection linking
  linkedCollectionId?: string;
  collectionContext?: {
    collectionId: string;
    name: string;
    wellCount: number;
    dataSourceType: string;
    dataItems: DataItem[];
    previewMetadata: any;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Optional TTL for auto-cleanup
  ttl?: number;
}
```

### Collection Model (Existing)

```typescript
interface Collection {
  id: string;
  name: string;
  description: string;
  dataSourceType: string;
  previewMetadata: any;
  dataItems: DataItem[];
  createdAt: string;
  lastAccessedAt: string;
  owner: string;
}
```

### DataItem Model

```typescript
interface DataItem {
  id: string;
  name: string;
  type: string;
  dataSource: string;
  s3Key?: string;
  osduId?: string;
  location?: string;
  operator?: string;
  depth?: string;
  curves?: string[];
  coordinates?: [number, number];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Session-Collection Link Persistence

*For any* session created with a linkedCollectionId, retrieving that session should return the same linkedCollectionId

**Validates: Requirements 1.1, 1.2, 1.3, 5.1, 5.2, 5.4**

### Property 2: Collection Context Completeness

*For any* collection linked to a canvas, the collection context should include all data items from the original collection

**Validates: Requirements 2.1, 2.2, 3.1, 3.2**

### Property 3: Multiple Canvas Independence

*For any* collection, creating multiple canvases from it should result in each canvas having independent session data but identical collection context

**Validates: Requirements 7.1, 7.2**

### Property 4: Cache Invalidation Consistency

*For any* collection that is updated, all cached contexts for that collection should be invalidated within the cache TTL period

**Validates: Requirements 9.3, 9.4**

### Property 5: Broken Link Handling

*For any* session with a linkedCollectionId pointing to a deleted collection, the session should remain functional but display a broken link warning

**Validates: Requirements 1.5, 10.1**

### Property 6: File Path Accessibility

*For any* collection with S3 data items, all s3Key values should be accessible as file paths in the FileDrawer

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: API Error Recovery

*For any* failed API call to session or collection endpoints, the system should return a clear error message and maintain canvas functionality

**Validates: Requirements 10.2, 10.3, 10.4**

### Property 8: Session List Filtering

*For any* user, listing sessions should return only sessions owned by that user

**Validates: Requirements 8.5**

### Property 9: Context Loading Idempotency

*For any* canvas, loading collection context multiple times should return the same data (from cache or API)

**Validates: Requirements 9.1, 9.2, 9.5**

### Property 10: Breadcrumb Navigation Consistency

*For any* canvas with a linked collection, the breadcrumb should always show the current collection name and canvas name

**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

### Session API Errors

```typescript
// Session not found
{
  statusCode: 404,
  body: {
    success: false,
    error: 'Session not found',
    sessionId: 'session_123'
  }
}

// Invalid request
{
  statusCode: 400,
  body: {
    success: false,
    error: 'Invalid request',
    details: 'name is required'
  }
}

// Storage failure
{
  statusCode: 500,
  body: {
    success: false,
    error: 'Failed to create session',
    message: 'DynamoDB unavailable'
  }
}
```

### Collection Context Errors

```typescript
// Collection deleted
{
  success: false,
  error: 'Collection not found',
  collectionId: 'collection_123',
  suggestion: 'The linked collection may have been deleted'
}

// Context load failure
{
  success: false,
  error: 'Failed to load collection context',
  fallback: true,
  message: 'Canvas will function without collection context'
}
```

### UI Error Display

```typescript
// Broken collection link
<Alert type="warning" header="Collection Unavailable">
  The collection linked to this canvas is no longer available.
  The canvas will continue to function, but collection data is not accessible.
  <Button onClick={handleUnlinkCollection}>Remove Link</Button>
</Alert>

// Context load failure
<Alert type="error" header="Failed to Load Collection Context">
  Unable to load collection data. 
  <Button onClick={handleRetry}>Retry</Button>
</Alert>
```

## Testing Strategy

### Unit Tests

**Session API Handler**:
- Test session creation with and without linkedCollectionId
- Test session retrieval
- Test session update
- Test session deletion
- Test session listing with filtering
- Test error cases (not found, invalid input)

**Session API Client**:
- Test all API functions
- Test error handling
- Test request/response parsing

**Collection Context Loader**:
- Test context loading with valid collectionId
- Test context loading with invalid collectionId
- Test cache hit/miss scenarios
- Test cache invalidation
- Test data access validation

**Collection Inheritance Utils**:
- Test getCanvasCollectionContext with valid session
- Test getCanvasCollectionContext with invalid session
- Test getWellFilePaths with various data items
- Test getCollectionSummary formatting

### Property-Based Tests

**Property 1: Session-Collection Link Persistence**
```typescript
// Generate random sessions with collection links
// Create session, retrieve it, verify linkedCollectionId matches
test('session collection link persists', async () => {
  const collectionId = generateRandomCollectionId();
  const session = await createSession({
    name: 'Test Canvas',
    linkedCollectionId: collectionId
  });
  
  const retrieved = await getSession(session.sessionId);
  expect(retrieved.session.linkedCollectionId).toBe(collectionId);
});
```

**Property 2: Collection Context Completeness**
```typescript
// Generate random collections with data items
// Link to canvas, verify all data items present in context
test('collection context includes all data items', async () => {
  const collection = generateRandomCollection();
  const session = await createSession({
    name: 'Test Canvas',
    linkedCollectionId: collection.id
  });
  
  const context = await loadCanvasContext(session.sessionId);
  expect(context.dataItems.length).toBe(collection.dataItems.length);
  expect(context.dataItems).toEqual(collection.dataItems);
});
```

**Property 3: Multiple Canvas Independence**
```typescript
// Create multiple canvases from same collection
// Verify each has independent session but same context
test('multiple canvases have independent sessions', async () => {
  const collectionId = generateRandomCollectionId();
  
  const session1 = await createSession({
    name: 'Canvas 1',
    linkedCollectionId: collectionId
  });
  
  const session2 = await createSession({
    name: 'Canvas 2',
    linkedCollectionId: collectionId
  });
  
  expect(session1.sessionId).not.toBe(session2.sessionId);
  expect(session1.linkedCollectionId).toBe(session2.linkedCollectionId);
});
```

### Integration Tests

**End-to-End Flow**:
1. Create collection from catalog
2. Create canvas from collection
3. Verify canvas has collection context
4. Verify FileDrawer shows collection files
5. Send message to AI agent
6. Verify agent receives collection context
7. Close and reopen canvas
8. Verify collection context persists

**Multiple Canvas Flow**:
1. Create collection
2. Create Canvas A from collection
3. Create Canvas B from collection
4. Verify both show same collection context
5. Update collection
6. Verify both canvases reflect update

**Broken Link Flow**:
1. Create collection
2. Create canvas from collection
3. Delete collection
4. Open canvas
5. Verify broken link warning displayed
6. Verify canvas still functional

## Performance Considerations

### Caching Strategy

- **Collection Context**: Cache for 30 minutes
- **Session Data**: No caching (always fetch fresh)
- **Collection List**: Cache for 5 minutes

### DynamoDB Optimization

- Use consistent reads for session retrieval
- Use eventually consistent reads for session listing
- Batch get operations when loading multiple sessions
- Use GSI for efficient owner-based queries

### Lambda Cold Start

- Keep session handler warm with CloudWatch Events
- Minimize dependencies in session handler
- Use Lambda layers for shared code

### Frontend Performance

- Load collection context asynchronously
- Show loading state while fetching
- Cache context in React state
- Debounce context refresh calls

## Security Considerations

### Authorization

- Verify user owns session before retrieval/update/delete
- Verify user owns collection before linking
- Use Cognito user ID for ownership checks
- Implement IAM policies for Lambda execution

### Data Validation

- Validate session name length and format
- Validate collectionId format
- Sanitize user input
- Prevent injection attacks

### API Security

- Use API Gateway authorization
- Implement rate limiting
- Log all API calls
- Monitor for suspicious activity

## Deployment Strategy

### Phase 1: Backend Infrastructure
1. Create DynamoDB Sessions table
2. Deploy Sessions Lambda function
3. Configure API Gateway routes
4. Test API endpoints

### Phase 2: Frontend Integration
1. Implement session API client
2. Update CreateNewChatPage
3. Update ChatPage
4. Update CollectionDetailPage

### Phase 3: Context Loading
1. Update collectionContextLoader
2. Update collectionInheritance utils
3. Implement caching
4. Add error handling

### Phase 4: Testing & Validation
1. Run unit tests
2. Run property-based tests
3. Run integration tests
4. User acceptance testing

### Phase 5: Production Deployment
1. Deploy to staging
2. Smoke test
3. Deploy to production
4. Monitor logs and metrics

## Monitoring and Observability

### CloudWatch Metrics

- Session creation rate
- Session retrieval latency
- Collection context load time
- Cache hit/miss ratio
- API error rate

### CloudWatch Logs

- Session API requests/responses
- Collection context loading
- Cache operations
- Error messages with stack traces

### Alarms

- High API error rate (> 5%)
- High latency (> 1 second)
- DynamoDB throttling
- Lambda errors

## Future Enhancements

### Phase 2 Features

- Collection sharing with other users
- Collection versioning
- Collection analytics (usage tracking)
- Collection templates
- Bulk canvas creation

### Phase 3 Features

- Collection permissions (read/write/admin)
- Collection folders/organization
- Collection search and filtering
- Collection export/import
- Collection collaboration features
