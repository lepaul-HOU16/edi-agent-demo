# Collection Data Inheritance - Architecture

## System Overview

The Collection Data Inheritance system enables automatic data flow from catalog searches to reusable collections to canvas workspaces. This document describes the architecture, data flow, and component interactions.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│                      (React + TypeScript)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │ CatalogPage  │───▶│CollectionDetail  │───▶│CreateNewChat  │ │
│  │              │    │Page              │    │Page           │ │
│  └──────────────┘    └──────────────────┘    └───────┬───────┘ │
│                                                        │         │
│                                                        ▼         │
│                                              ┌─────────────────┐│
│                                              │   ChatPage      ││
│                                              │                 ││
│                                              │ - Load Context  ││
│                                              │ - Display Alert ││
│                                              │ - FileDrawer    ││
│                                              │ - AI Integration││
│                                              └─────────────────┘│
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ HTTPS / REST API
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                         API Gateway                                │
│                    (AWS API Gateway)                               │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
┌───────────────────────────┐       ┌──────────────────────────┐
│  Collections Lambda       │       │  Sessions Lambda         │
│  (Node.js/TypeScript)     │       │  (Node.js/TypeScript)    │
├───────────────────────────┤       ├──────────────────────────┤
│ - Create collection       │       │ - Create session         │
│ - List collections        │       │ - Get session            │
│ - Get collection          │       │ - Update session         │
│ - Update collection       │       │ - Delete session         │
│ - Delete collection       │       │ - List sessions          │
└───────────┬───────────────┘       └──────────┬───────────────┘
            │                                  │
            │                                  │
            ▼                                  ▼
┌───────────────────────────────────────────────────────────────┐
│                    DynamoDB Tables                             │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────┐    ┌─────────────────────────┐  │
│  │  Collections Table      │    │  Sessions Table         │  │
│  ├─────────────────────────┤    ├─────────────────────────┤  │
│  │ PK: collectionId        │    │ PK: sessionId           │  │
│  │ - name                  │    │ - name                  │  │
│  │ - description           │    │ - linkedCollectionId ◄──┼──┤
│  │ - dataSourceType        │    │ - collectionContext     │  │
│  │ - dataItems[]           │    │ - createdAt             │  │
│  │ - previewMetadata       │    │ - updatedAt             │  │
│  │ - owner                 │    │ - owner                 │  │
│  │ - createdAt             │    │ - ttl (optional)        │  │
│  │                         │    │                         │  │
│  │ GSI: owner-index        │    │ GSI: owner-createdAt    │  │
│  └─────────────────────────┘    └─────────────────────────┘  │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---


## Component Details

### Frontend Components

#### 1. CatalogPage
**Purpose**: Search and browse data from catalog

**Responsibilities**:
- Display search interface
- Show search results
- Allow data item selection
- Trigger collection creation

**Key Functions**:
```typescript
- handleSearch(query: string)
- handleSelectItem(itemId: string)
- handleCreateCollection(selectedItems: DataItem[])
```

#### 2. CollectionDetailPage
**Purpose**: View collection details and linked canvases

**Responsibilities**:
- Display collection metadata
- Show data items in collection
- List linked canvases
- Provide "Create Canvas" action

**Key Functions**:
```typescript
- loadCollection(collectionId: string)
- loadLinkedCanvases(collectionId: string)
- handleCreateCanvas()
- handleDeleteCollection()
```

#### 3. CreateNewChatPage
**Purpose**: Create new canvas with optional collection link

**Responsibilities**:
- Accept collectionId from URL params
- Create session with linkedCollectionId
- Load and cache collection context
- Navigate to new canvas

**Key Functions**:
```typescript
- createCanvasFromCollection(collectionId: string)
- loadAndCacheContext(sessionId: string, collectionId: string)
```

#### 4. ChatPage
**Purpose**: Main canvas workspace with AI interaction

**Responsibilities**:
- Load collection context on mount
- Display collection alert
- Show breadcrumb navigation
- Pass context to AI agents
- Handle broken collection links

**Key Functions**:
```typescript
- loadCollectionContext()
- displayCollectionAlert()
- handleBrokenLink()
- passContextToAI(message: string)
```

#### 5. FileDrawer
**Purpose**: Display and manage accessible files

**Responsibilities**:
- Show collection well files
- Allow file selection
- Load file contents
- Pass files to AI agents

**Key Functions**:
```typescript
- loadCollectionFiles(collectionContext: CollectionContext)
- handleFileSelect(filePath: string)
- loadFileContent(s3Key: string)
```

---

### Backend Services

#### 1. Sessions Lambda
**File**: `cdk/lambda-functions/sessions/handler.ts`

**Purpose**: Manage canvas sessions with collection linking

**Endpoints**:
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions/{id}` - Get session by ID
- `PUT /api/sessions/{id}` - Update session
- `DELETE /api/sessions/{id}` - Delete session
- `GET /api/sessions/list` - List user sessions

**Key Operations**:
```typescript
- createSession(name, linkedCollectionId)
- getSession(sessionId)
- updateSession(sessionId, updates)
- deleteSession(sessionId)
- listUserSessions(userId)
```

**DynamoDB Operations**:
- PutItem - Create session
- GetItem - Retrieve session
- UpdateItem - Update session
- DeleteItem - Delete session
- Query - List sessions by owner

#### 2. Collections Lambda
**File**: `cdk/lambda-functions/collections/handler.ts`

**Purpose**: Manage collections and data items

**Endpoints**:
- `POST /api/collections/create` - Create collection
- `GET /api/collections/{id}` - Get collection
- `PUT /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection
- `GET /api/collections/list` - List collections

**Key Operations**:
```typescript
- createCollection(name, dataItems)
- getCollection(collectionId)
- updateCollection(collectionId, updates)
- deleteCollection(collectionId)
- listUserCollections(userId)
```

---

### Data Storage

#### DynamoDB Tables

**Sessions Table**:
```
Table Name: Sessions-{environment}
Primary Key: id (String)
GSI: owner-createdAt-index
  - Partition Key: owner (String)
  - Sort Key: createdAt (String)
TTL Attribute: ttl (Number, optional)
```

**Collections Table**:
```
Table Name: Collections-{environment}
Primary Key: id (String)
GSI: owner-index
  - Partition Key: owner (String)
```

---

## Data Flow Diagrams

### Flow 1: Create Canvas from Collection

```
User                CatalogPage         CollectionDetail    CreateNewChat       Sessions API        DynamoDB
 │                      │                      │                  │                  │                 │
 │  Search catalog      │                      │                  │                  │                 │
 ├─────────────────────▶│                      │                  │                  │                 │
 │                      │                      │                  │                  │                 │
 │  Select wells        │                      │                  │                  │                 │
 ├─────────────────────▶│                      │                  │                  │                 │
 │                      │                      │                  │                  │                 │
 │  Create collection   │                      │                  │                  │                 │
 ├─────────────────────▶│                      │                  │                  │                 │
 │                      │  POST /collections   │                  │                  │                 │
 │                      ├─────────────────────────────────────────▶                  │                 │
 │                      │                      │                  │                  │  PutItem        │
 │                      │                      │                  │                  ├────────────────▶│
 │                      │  ◀────────────────────────────────────────                 │                 │
 │                      │  collectionId        │                  │                  │                 │
 │                      │                      │                  │                  │                 │
 │  View collection     │                      │                  │                  │                 │
 ├──────────────────────┼─────────────────────▶│                  │                  │                 │
 │                      │                      │                  │                  │                 │
 │  Create canvas       │                      │                  │                  │                 │
 ├──────────────────────┼─────────────────────▶│                  │                  │                 │
 │                      │                      │  Navigate with   │                  │                 │
 │                      │                      │  collectionId    │                  │                 │
 │                      │                      ├─────────────────▶│                  │                 │
 │                      │                      │                  │  POST /sessions  │                 │
 │                      │                      │                  │  {linkedCollectionId}              │
 │                      │                      │                  ├─────────────────▶│                 │
 │                      │                      │                  │                  │  PutItem        │
 │                      │                      │                  │                  ├────────────────▶│
 │                      │                      │                  │  ◀────────────────                 │
 │                      │                      │                  │  sessionId       │                 │
 │                      │                      │                  │                  │                 │
 │                      │                      │  Navigate to     │                  │                 │
 │                      │                      │  /chat/{id}      │                  │                 │
 │                      │                      ├─────────────────▶│                  │                 │
```

### Flow 2: Load Collection Context in Canvas

```
ChatPage            Sessions API        Collections API      DynamoDB           Cache
   │                     │                     │                 │                │
   │  componentDidMount  │                     │                 │                │
   │                     │                     │                 │                │
   │  GET /sessions/{id} │                     │                 │                │
   ├────────────────────▶│                     │                 │                │
   │                     │  GetItem            │                 │                │
   │                     ├────────────────────────────────────────▶               │
   │                     │  ◀───────────────────────────────────────              │
   │  ◀─────────────────┤  session with       │                 │                │
   │  session            │  linkedCollectionId │                 │                │
   │                     │                     │                 │                │
   │  Check cache        │                     │                 │                │
   ├─────────────────────────────────────────────────────────────────────────────▶│
   │  ◀────────────────────────────────────────────────────────────────────────────│
   │  Cache miss         │                     │                 │                │
   │                     │                     │                 │                │
   │  GET /collections/{id}                    │                 │                │
   ├──────────────────────────────────────────▶│                 │                │
   │                     │                     │  GetItem        │                │
   │                     │                     ├────────────────▶│                │
   │                     │                     │  ◀───────────────                │
   │  ◀─────────────────────────────────────────                 │                │
   │  collectionContext  │                     │                 │                │
   │                     │                     │                 │                │
   │  Store in cache     │                     │                 │                │
   ├─────────────────────────────────────────────────────────────────────────────▶│
   │                     │                     │                 │                │
   │  Display context    │                     │                 │                │
   │  alert              │                     │                 │                │
```

### Flow 3: AI Agent with Collection Context

```
User        ChatPage        AI Agent        Collections API      FileDrawer
 │              │               │                  │                  │
 │  Type msg    │               │                  │                  │
 ├─────────────▶│               │                  │                  │
 │              │               │                  │                  │
 │              │  Build prompt │                  │                  │
 │              │  with context │                  │                  │
 │              ├──────────────▶│                  │                  │
 │              │               │                  │                  │
 │              │               │  Prompt includes:│                  │
 │              │               │  - Well list     │                  │
 │              │               │  - Collection    │                  │
 │              │               │    name          │                  │
 │              │               │  - Data source   │                  │
 │              │               │                  │                  │
 │              │               │  Process query   │                  │
 │              │               │  with context    │                  │
 │              │               │                  │                  │
 │              │               │  Need file?      │                  │
 │              │               │  Request s3Key   │                  │
 │              │               ├─────────────────────────────────────▶│
 │              │               │                  │                  │
 │              │               │  ◀────────────────────────────────────│
 │              │               │  File content    │                  │
 │              │               │                  │                  │
 │              │  ◀─────────────                  │                  │
 │  ◀───────────│  AI response  │                  │                  │
 │  Response    │  with analysis│                  │                  │
```

---


## Caching Strategy

### Collection Context Cache

**Purpose**: Reduce API calls and improve performance

**Implementation**:
```typescript
interface CacheEntry {
  data: CollectionContext;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

function getFromCache(collectionId: string): CollectionContext | null {
  const entry = cache.get(collectionId);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(collectionId);
    return null;
  }
  
  return entry.data;
}

function setCache(collectionId: string, data: CollectionContext): void {
  cache.set(collectionId, {
    data,
    timestamp: Date.now(),
    ttl: 30 * 60 * 1000 // 30 minutes
  });
}

function invalidateCache(collectionId: string): void {
  cache.delete(collectionId);
}
```

**Cache Invalidation**:
- On collection update
- On collection delete
- After TTL expires (30 minutes)
- Manual invalidation via API

**Cache Metrics**:
- Hit ratio: % of requests served from cache
- Miss ratio: % of requests requiring API call
- Eviction rate: # of cache entries expired

---

## Security Architecture

### Authentication Flow

```
User Browser        Cognito         API Gateway        Lambda          DynamoDB
     │                 │                 │                │                │
     │  Login          │                 │                │                │
     ├────────────────▶│                 │                │                │
     │                 │                 │                │                │
     │  ◀───────────────                 │                │                │
     │  JWT Token      │                 │                │                │
     │                 │                 │                │                │
     │  API Request    │                 │                │                │
     │  + JWT Token    │                 │                │                │
     ├─────────────────────────────────▶│                │                │
     │                 │                 │                │                │
     │                 │                 │  Verify JWT    │                │
     │                 │                 │  Extract userId│                │
     │                 │                 │                │                │
     │                 │                 │  Invoke Lambda │                │
     │                 │                 │  + userId      │                │
     │                 │                 ├───────────────▶│                │
     │                 │                 │                │                │
     │                 │                 │                │  Query with    │
     │                 │                 │                │  userId filter │
     │                 │                 │                ├───────────────▶│
     │                 │                 │                │                │
     │                 │                 │                │  ◀──────────────
     │                 │                 │                │  User's data   │
     │                 │                 │  ◀──────────────                │
     │  ◀──────────────────────────────────               │                │
     │  Response       │                 │                │                │
```

### Authorization Model

**Resource Ownership**:
- Sessions owned by creator (userId)
- Collections owned by creator (userId)
- Users can only access their own resources

**IAM Roles**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/Sessions-*",
        "arn:aws:dynamodb:*:*:table/Collections-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket/*",
        "arn:aws:s3:::your-bucket"
      ]
    }
  ]
}
```

**Data Validation**:
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens

---

## Scalability Considerations

### DynamoDB Capacity

**Read Capacity**:
- Sessions: 10 RCU (on-demand recommended)
- Collections: 10 RCU (on-demand recommended)

**Write Capacity**:
- Sessions: 5 WCU (on-demand recommended)
- Collections: 5 WCU (on-demand recommended)

**Auto-scaling**:
- Target utilization: 70%
- Min capacity: 5 units
- Max capacity: 100 units

### Lambda Concurrency

**Sessions Lambda**:
- Reserved concurrency: 10
- Provisioned concurrency: 2 (keep warm)
- Memory: 512 MB
- Timeout: 30 seconds

**Collections Lambda**:
- Reserved concurrency: 10
- Provisioned concurrency: 2 (keep warm)
- Memory: 512 MB
- Timeout: 30 seconds

### API Gateway Throttling

**Rate Limits**:
- Per user: 100 requests/minute
- Burst: 200 requests
- Global: 10,000 requests/minute

---

## Monitoring and Observability

### CloudWatch Metrics

**Custom Metrics**:
```typescript
// Session metrics
putMetric('SessionCreationRate', 1, 'Count');
putMetric('SessionRetrievalLatency', duration, 'Milliseconds');

// Collection metrics
putMetric('CollectionContextLoadTime', duration, 'Milliseconds');

// Cache metrics
putMetric('CacheHitRatio', hitRatio, 'Percent');

// Error metrics
putMetric('APIErrorRate', errorCount, 'Count');
```

**CloudWatch Dashboards**:
- Session operations dashboard
- Collection operations dashboard
- Cache performance dashboard
- Error tracking dashboard

### Logging Strategy

**Structured Logging**:
```typescript
logger.info('Session created', {
  sessionId,
  userId,
  linkedCollectionId,
  timestamp: new Date().toISOString()
});

logger.error('Failed to load collection', {
  collectionId,
  userId,
  error: error.message,
  stack: error.stack
});
```

**Log Levels**:
- ERROR: Failures requiring attention
- WARN: Potential issues
- INFO: Normal operations
- DEBUG: Detailed debugging info

### Alarms

**Critical Alarms**:
- API error rate > 5%
- Lambda errors > 10/minute
- DynamoDB throttling > 0
- High latency > 1 second

**Warning Alarms**:
- Cache hit ratio < 50%
- Session creation rate spike
- Unusual traffic patterns

---

## Deployment Architecture

### Infrastructure as Code

**CDK Stack**:
```typescript
export class CollectionInheritanceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const sessionsTable = new Table(this, 'SessionsTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl'
    });

    const collectionsTable = new Table(this, 'CollectionsTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST
    });

    // Lambda Functions
    const sessionsLambda = new NodejsFunction(this, 'SessionsHandler', {
      entry: 'lambda-functions/sessions/handler.ts',
      handler: 'handler',
      environment: {
        SESSIONS_TABLE: sessionsTable.tableName
      }
    });

    const collectionsLambda = new NodejsFunction(this, 'CollectionsHandler', {
      entry: 'lambda-functions/collections/handler.ts',
      handler: 'handler',
      environment: {
        COLLECTIONS_TABLE: collectionsTable.tableName
      }
    });

    // API Gateway
    const api = new RestApi(this, 'CollectionInheritanceAPI', {
      restApiName: 'Collection Inheritance API'
    });

    // Routes
    const sessions = api.root.addResource('sessions');
    sessions.addMethod('POST', new LambdaIntegration(sessionsLambda));
    
    const sessionById = sessions.addResource('{id}');
    sessionById.addMethod('GET', new LambdaIntegration(sessionsLambda));
    sessionById.addMethod('PUT', new LambdaIntegration(sessionsLambda));
    sessionById.addMethod('DELETE', new LambdaIntegration(sessionsLambda));
  }
}
```

### Deployment Pipeline

```
Developer       GitHub          GitHub Actions      AWS
    │              │                   │              │
    │  git push    │                   │              │
    ├─────────────▶│                   │              │
    │              │  Trigger workflow │              │
    │              ├──────────────────▶│              │
    │              │                   │              │
    │              │                   │  Run tests   │
    │              │                   │              │
    │              │                   │  Build CDK   │
    │              │                   │              │
    │              │                   │  Deploy      │
    │              │                   ├─────────────▶│
    │              │                   │              │
    │              │                   │  Update      │
    │              │                   │  Lambda      │
    │              │                   │  DynamoDB    │
    │              │                   │  API Gateway │
    │              │                   │              │
    │              │                   │  ◀────────────
    │              │                   │  Success     │
    │              │  ◀─────────────────              │
    │  ◀───────────│  Notification     │              │
```

---

## Error Handling Architecture

### Error Propagation

```
Frontend          API Client         Lambda            DynamoDB
   │                  │                 │                 │
   │  User action     │                 │                 │
   ├─────────────────▶│                 │                 │
   │                  │  API call       │                 │
   │                  ├────────────────▶│                 │
   │                  │                 │  Query          │
   │                  │                 ├────────────────▶│
   │                  │                 │                 │
   │                  │                 │  ◀───────────────
   │                  │                 │  Error          │
   │                  │                 │                 │
   │                  │                 │  Log error      │
   │                  │                 │  Emit metric    │
   │                  │                 │                 │
   │                  │  ◀───────────────                 │
   │                  │  Error response │                 │
   │                  │  {success: false}                 │
   │  ◀────────────────                 │                 │
   │  Display error   │                 │                 │
   │  to user         │                 │                 │
```

### Error Categories

**1. Client Errors (4xx)**:
- 400 Bad Request - Invalid input
- 401 Unauthorized - Missing auth
- 403 Forbidden - No permission
- 404 Not Found - Resource missing
- 429 Too Many Requests - Rate limit

**2. Server Errors (5xx)**:
- 500 Internal Server Error - Lambda failure
- 503 Service Unavailable - DynamoDB down
- 504 Gateway Timeout - Lambda timeout

**3. Business Logic Errors**:
- Broken collection link
- Collection deleted
- Session expired
- Data validation failure

---

## Performance Optimization

### Request Optimization

**Parallel Requests**:
```typescript
// Load session and collection in parallel
const [session, collection] = await Promise.all([
  getSession(sessionId),
  getCollection(collectionId)
]);
```

**Request Batching**:
```typescript
// Batch multiple session retrievals
const sessions = await batchGetSessions(sessionIds);
```

**Lazy Loading**:
```typescript
// Only load files when FileDrawer opens
const loadFiles = async () => {
  if (!filesLoaded) {
    const files = await getWellFiles(collectionId);
    setFiles(files);
    setFilesLoaded(true);
  }
};
```

### Database Optimization

**Efficient Queries**:
```typescript
// Use GSI for owner-based queries
const params = {
  TableName: 'Sessions',
  IndexName: 'owner-createdAt-index',
  KeyConditionExpression: 'owner = :owner',
  ExpressionAttributeValues: {
    ':owner': userId
  }
};
```

**Projection Expressions**:
```typescript
// Only fetch needed attributes
const params = {
  TableName: 'Sessions',
  Key: { id: sessionId },
  ProjectionExpression: 'id, name, linkedCollectionId'
};
```

---

## Future Architecture Enhancements

### Phase 2: Collection Sharing

```
┌─────────────────────────────────────┐
│  Add Permissions Table              │
├─────────────────────────────────────┤
│  PK: collectionId + userId          │
│  - permission (read/write/admin)    │
│  - grantedBy                        │
│  - grantedAt                        │
└─────────────────────────────────────┘
```

### Phase 3: Collection Versioning

```
┌─────────────────────────────────────┐
│  Add Versions Table                 │
├─────────────────────────────────────┤
│  PK: collectionId                   │
│  SK: version                        │
│  - dataItems                        │
│  - createdAt                        │
│  - createdBy                        │
└─────────────────────────────────────┘
```

### Phase 4: Real-time Updates

```
┌─────────────────────────────────────┐
│  Add WebSocket API                  │
├─────────────────────────────────────┤
│  - Connection management            │
│  - Real-time notifications          │
│  - Live collaboration               │
└─────────────────────────────────────┘
```

---

## Summary

The Collection Data Inheritance architecture provides:

1. **Scalable storage** with DynamoDB
2. **Serverless compute** with Lambda
3. **RESTful API** via API Gateway
4. **Efficient caching** for performance
5. **Secure authentication** with Cognito
6. **Comprehensive monitoring** with CloudWatch
7. **Infrastructure as Code** with CDK

The system is designed for:
- High availability
- Low latency
- Horizontal scalability
- Cost efficiency
- Easy maintenance

**All components work together to provide seamless data inheritance from collections to canvases.**
