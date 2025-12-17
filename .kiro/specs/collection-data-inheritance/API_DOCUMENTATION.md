# Collection Data Inheritance - API Documentation

## Overview

The Collection Data Inheritance system provides REST APIs for managing sessions (canvas workspaces) and their links to collections. This enables automatic data inheritance from collections to canvases.

## Base URL

```
Production: https://api.your-domain.com
Localhost: http://localhost:3000/api
```

## Authentication

All API endpoints require authentication via AWS Cognito. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

---

## Sessions API

### POST /api/sessions/create

Create a new session (canvas workspace) with optional collection link.

**Request Body:**
```json
{
  "name": "My Analysis Canvas",
  "linkedCollectionId": "collection_abc123"  // Optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "session": {
    "id": "session_xyz789",
    "name": "My Analysis Canvas",
    "linkedCollectionId": "collection_abc123",
    "owner": "user@example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "sessionId": "session_xyz789"
}
```

**Error Responses:**

400 Bad Request - Invalid input
```json
{
  "success": false,
  "error": "Invalid request",
  "details": "name is required"
}
```

500 Internal Server Error - Storage failure
```json
{
  "success": false,
  "error": "Failed to create session",
  "message": "DynamoDB unavailable"
}
```

---

### GET /api/sessions/{id}

Retrieve a session by ID.

**Path Parameters:**
- `id` (string, required) - Session ID

**Response (200 OK):**
```json
{
  "success": true,
  "session": {
    "id": "session_xyz789",
    "name": "My Analysis Canvas",
    "linkedCollectionId": "collection_abc123",
    "collectionContext": {
      "collectionId": "collection_abc123",
      "name": "North Field Wells",
      "wellCount": 24,
      "dataSourceType": "S3",
      "dataItems": [...],
      "previewMetadata": {...}
    },
    "owner": "user@example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Responses:**

404 Not Found - Session doesn't exist
```json
{
  "success": false,
  "error": "Session not found",
  "sessionId": "session_xyz789"
}
```

---

### PUT /api/sessions/{id}

Update a session's properties.

**Path Parameters:**
- `id` (string, required) - Session ID

**Request Body:**
```json
{
  "name": "Updated Canvas Name",           // Optional
  "linkedCollectionId": "collection_new",  // Optional
  "collectionContext": {...}               // Optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "session": {
    "id": "session_xyz789",
    "name": "Updated Canvas Name",
    "linkedCollectionId": "collection_new",
    "owner": "user@example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### DELETE /api/sessions/{id}

Delete a session.

**Path Parameters:**
- `id` (string, required) - Session ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Error Responses:**

404 Not Found
```json
{
  "success": false,
  "error": "Session not found",
  "sessionId": "session_xyz789"
}
```

---

### GET /api/sessions/list

List all sessions for the current user.

**Query Parameters:**
- None (automatically filters by authenticated user)

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "id": "session_xyz789",
      "name": "My Analysis Canvas",
      "linkedCollectionId": "collection_abc123",
      "owner": "user@example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    },
    {
      "id": "session_def456",
      "name": "Another Canvas",
      "linkedCollectionId": null,
      "owner": "user@example.com",
      "createdAt": "2024-01-14T09:00:00Z",
      "updatedAt": "2024-01-14T09:00:00Z"
    }
  ],
  "count": 2
}
```

---

## Collections API

### GET /api/collections/{id}

Retrieve a collection by ID (used for loading collection context).

**Path Parameters:**
- `id` (string, required) - Collection ID

**Response (200 OK):**
```json
{
  "success": true,
  "collection": {
    "id": "collection_abc123",
    "name": "North Field Wells",
    "description": "24 wells from North Field",
    "dataSourceType": "S3",
    "dataItems": [
      {
        "id": "well_001",
        "name": "WELL-001",
        "type": "well",
        "dataSource": "S3",
        "s3Key": "global/well-data/WELL-001.las",
        "location": "North Field",
        "operator": "ABC Energy",
        "depth": "10000 ft",
        "curves": ["DEPT", "GR", "RHOB", "NPHI"],
        "coordinates": [-95.123, 29.456]
      }
    ],
    "previewMetadata": {
      "wellCount": 24,
      "totalDepth": "240000 ft",
      "operators": ["ABC Energy", "XYZ Oil"]
    },
    "owner": "user@example.com",
    "createdAt": "2024-01-10T08:00:00Z",
    "lastAccessedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Responses:**

404 Not Found
```json
{
  "success": false,
  "error": "Collection not found",
  "collectionId": "collection_abc123"
}
```

---

## Frontend API Client

### TypeScript Client Usage

```typescript
import {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  listSessions
} from '@/lib/api/sessions';

// Create a session with collection link
const result = await createSession({
  name: 'My Canvas',
  linkedCollectionId: 'collection_abc123'
});

// Get session details
const session = await getSession('session_xyz789');

// Update session
await updateSession('session_xyz789', {
  name: 'Updated Name',
  collectionContext: {...}
});

// Delete session
await deleteSession('session_xyz789');

// List all user sessions
const sessions = await listSessions();
```

---

## Data Models

### Session

```typescript
interface Session {
  id: string;                    // Unique session identifier
  name: string;                  // User-defined canvas name
  linkedCollectionId?: string;   // Optional collection link
  collectionContext?: CollectionContext;  // Cached collection data
  owner: string;                 // User email/ID
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
  ttl?: number;                 // Optional TTL for auto-cleanup
}
```

### CollectionContext

```typescript
interface CollectionContext {
  collectionId: string;
  name: string;
  wellCount: number;
  dataSourceType: 'S3' | 'OSDU';
  dataItems: DataItem[];
  previewMetadata: any;
}
```

### DataItem

```typescript
interface DataItem {
  id: string;
  name: string;
  type: string;
  dataSource: string;
  s3Key?: string;              // For S3 data
  osduId?: string;             // For OSDU data
  location?: string;
  operator?: string;
  depth?: string;
  curves?: string[];
  coordinates?: [number, number];
}
```

---

## Rate Limits

- **Sessions API**: 100 requests per minute per user
- **Collections API**: 100 requests per minute per user

Exceeding rate limits returns:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Caching

### Collection Context Caching

- **Cache Duration**: 30 minutes
- **Cache Key**: `collection-context-${collectionId}`
- **Invalidation**: Automatic on collection update/delete

### Session Data

- **No caching**: Always fetched fresh from DynamoDB
- **Reason**: Ensures consistency across devices

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": "Additional context"
}
```

### Common Error Codes

| Status Code | Error Type | Description |
|-------------|-----------|-------------|
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | User doesn't own resource |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side failure |
| 503 | Service Unavailable | DynamoDB/AWS service down |

---

## Best Practices

### Creating Sessions

1. **Always provide a descriptive name**
   ```typescript
   const name = `Analysis - ${new Date().toLocaleString()}`;
   ```

2. **Link to collection when creating from catalog**
   ```typescript
   const session = await createSession({
     name: 'North Field Analysis',
     linkedCollectionId: collectionId
   });
   ```

3. **Load and cache context immediately**
   ```typescript
   const context = await loadCanvasContext(session.sessionId);
   if (context) {
     await updateSession(session.sessionId, { collectionContext: context });
   }
   ```

### Handling Errors

1. **Always check success flag**
   ```typescript
   const result = await getSession(sessionId);
   if (!result.success) {
     console.error('Failed to load session:', result.error);
     return;
   }
   ```

2. **Handle broken collection links gracefully**
   ```typescript
   if (session.linkedCollectionId) {
     const collection = await getCollection(session.linkedCollectionId);
     if (!collection.success) {
       // Collection deleted - show warning but continue
       showBrokenLinkWarning();
     }
   }
   ```

3. **Provide user-friendly error messages**
   ```typescript
   try {
     await createSession(data);
   } catch (error) {
     showErrorAlert('Failed to create canvas. Please try again.');
   }
   ```

---

## Performance Tips

1. **Use cached context when available**
   - Check `session.collectionContext` before fetching
   - Only fetch if missing or stale

2. **Batch session listings**
   - Use `listSessions()` once, filter client-side
   - Don't call `getSession()` in a loop

3. **Invalidate cache on updates**
   - Call `invalidateCache(collectionId)` after collection changes
   - Ensures all canvases see fresh data

4. **Minimize API calls**
   - Store session data in React state
   - Only refetch when necessary

---

## Security Considerations

### Authorization

- All endpoints verify user ownership
- Sessions can only be accessed by their owner
- Collections can only be linked if user has access

### Data Validation

- Session names limited to 200 characters
- Collection IDs validated against existing collections
- User input sanitized to prevent injection

### Audit Logging

- All API calls logged to CloudWatch
- Includes user ID, action, timestamp
- Failed auth attempts monitored

---

## Monitoring

### CloudWatch Metrics

- `SessionCreationRate` - Sessions created per minute
- `SessionRetrievalLatency` - Time to fetch session (ms)
- `CollectionContextLoadTime` - Time to load context (ms)
- `CacheHitRatio` - Percentage of cache hits
- `APIErrorRate` - Failed requests per minute

### CloudWatch Alarms

- High error rate (> 5%)
- High latency (> 1 second)
- DynamoDB throttling
- Lambda errors

---

## Support

For issues or questions:
- Check troubleshooting guide
- Review CloudWatch logs
- Contact support team
