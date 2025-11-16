# API Routes Structure

This document defines all REST API endpoints that will replace the AppSync GraphQL API.

## Route Naming Convention

- All routes prefixed with `/api/`
- RESTful naming: plural nouns for collections, singular for specific resources
- Use kebab-case for multi-word endpoints
- HTTP methods: GET (read), POST (create/action), PUT (update), DELETE (remove)

## Authentication

All routes require Cognito JWT token in `Authorization: Bearer <token>` header unless marked as public.

---

## 1. Chat & Agent Routes

### POST /api/chat/message
**Purpose**: Send a message and invoke the main agent  
**Replaces**: `invokeLightweightAgent` mutation  
**Lambda**: `agentFunction`  
**Auth**: Required

**Request Body**:
```json
{
  "chatSessionId": "uuid",
  "message": "string",
  "foundationModelId": "string (optional)",
  "userId": "string (optional)",
  "agentType": "auto|petrophysics|maintenance|renewable (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "string",
  "artifacts": [],
  "thoughtSteps": []
}
```

### POST /api/chat/maintenance
**Purpose**: Invoke maintenance agent  
**Replaces**: `invokeMaintenanceAgent` mutation  
**Lambda**: `maintenanceAgentFunction`  
**Auth**: Required

**Request Body**:
```json
{
  "chatSessionId": "uuid",
  "message": "string",
  "foundationModelId": "string (optional)",
  "userId": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "string",
  "artifacts": [],
  "thoughtSteps": [],
  "workflow": {},
  "auditTrail": {}
}
```

### POST /api/chat/edicraft
**Purpose**: Invoke EDIcraft agent  
**Replaces**: `invokeEDIcraftAgent` mutation  
**Lambda**: `edicraftAgentFunction`  
**Auth**: Required

**Request Body**:
```json
{
  "chatSessionId": "uuid",
  "message": "string",
  "foundationModelId": "string (optional)",
  "userId": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "string",
  "artifacts": [],
  "thoughtSteps": [],
  "connectionStatus": "string"
}
```

### GET /api/agent/progress/{requestId}
**Purpose**: Poll agent execution progress  
**Replaces**: `getAgentProgress` query  
**Lambda**: `agentProgressFunction`  
**Auth**: Required

**Response**:
```json
{
  "success": true,
  "requestId": "string",
  "steps": [],
  "status": "pending|in_progress|completed|failed",
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "error": "string (optional)"
}
```

### POST /api/chat/stream-chunk
**Purpose**: Publish streaming response chunk  
**Replaces**: `publishResponseStreamChunk` mutation  
**Lambda**: Custom handler  
**Auth**: Required

**Request Body**:
```json
{
  "chunkText": "string",
  "index": 123,
  "chatSessionId": "uuid"
}
```

---

## 2. Renewable Energy Project Routes

### POST /api/projects/delete
**Purpose**: Delete a renewable energy project  
**Replaces**: `deleteRenewableProject` mutation  
**Lambda**: `renewableToolsFunction`  
**Auth**: Required

**Request Body**:
```json
{
  "projectId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Project deleted successfully",
  "projectId": "string"
}
```

### POST /api/projects/rename
**Purpose**: Rename a renewable energy project  
**Replaces**: `renameRenewableProject` mutation  
**Lambda**: `renewableToolsFunction`  
**Auth**: Required

**Request Body**:
```json
{
  "projectId": "string",
  "newName": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Project renamed successfully",
  "projectId": "string",
  "newName": "string"
}
```

### POST /api/projects/export
**Purpose**: Export a renewable energy project  
**Replaces**: `exportRenewableProject` mutation  
**Lambda**: `renewableToolsFunction`  
**Auth**: Required

**Request Body**:
```json
{
  "projectId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Project exported successfully",
  "projectId": "string",
  "downloadUrl": "https://..."
}
```

### GET /api/projects/{projectId}
**Purpose**: Get renewable project details  
**Replaces**: `getRenewableProjectDetails` query  
**Lambda**: `renewableToolsFunction`  
**Auth**: Required

**Response**:
```json
{
  "success": true,
  "projectId": "string",
  "projectName": "string",
  "artifacts": [],
  "metadata": {},
  "completionStatus": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

---

## 3. Catalog Routes

### GET /api/catalog/map-data
**Purpose**: Get catalog map data  
**Replaces**: `getCatalogMapData` query  
**Lambda**: `catalogMapDataFunction`  
**Auth**: Required

**Query Parameters**:
- `type` (required): Type of map data to retrieve

**Response**:
```json
{
  "data": "string (GeoJSON or other format)"
}
```

### POST /api/catalog/search
**Purpose**: Search catalog with AI  
**Replaces**: `catalogSearch` query  
**Lambda**: `catalogSearchFunction`  
**Auth**: Required

**Request Body**:
```json
{
  "prompt": "string",
  "existingContext": {} // optional
}
```

**Response**:
```json
{
  "results": "string (formatted search results)"
}
```

### GET /api/osdu/search
**Purpose**: Search OSDU data  
**Replaces**: `osduSearch` query  
**Lambda**: `osduProxyFunction`  
**Auth**: Required

**Query Parameters**:
- `query` (required): Search query
- `dataPartition` (optional): OSDU data partition
- `maxResults` (optional): Maximum number of results

**Response**:
```json
{
  "results": [],
  "totalCount": 123
}
```

---

## 4. Collection Management Routes

### POST /api/collections
**Purpose**: Create or manage collections  
**Replaces**: `collectionManagement` mutation  
**Lambda**: `collectionServiceFunction`  
**Auth**: Required

**Request Body**:
```json
{
  "operation": "create|update|delete|addItems|removeItems",
  "name": "string (for create)",
  "description": "string (optional)",
  "dataSourceType": "string (optional)",
  "previewMetadata": {} // optional
  "dataItems": [], // optional
  "collectionId": "string (for update/delete)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "string",
  "collectionId": "string",
  "data": {}
}
```

### GET /api/collections/{collectionId}
**Purpose**: Get collection details  
**Replaces**: `collectionQuery` query  
**Lambda**: `collectionServiceFunction`  
**Auth**: Required

**Response**:
```json
{
  "success": true,
  "collection": {
    "id": "string",
    "name": "string",
    "description": "string",
    "dataItems": [],
    "metadata": {}
  }
}
```

### GET /api/collections
**Purpose**: List all collections  
**Replaces**: `collectionQuery` query with operation="list"  
**Lambda**: `collectionServiceFunction`  
**Auth**: Required

**Response**:
```json
{
  "success": true,
  "collections": []
}
```

---

## 5. DynamoDB Model Routes (CRUD)

These routes provide direct access to DynamoDB models (Project, ChatSession, ChatMessage, Well).

### Projects

#### GET /api/models/projects
**Purpose**: List all projects  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### GET /api/models/projects/{id}
**Purpose**: Get project by ID  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### POST /api/models/projects
**Purpose**: Create new project  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### PUT /api/models/projects/{id}
**Purpose**: Update project  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### DELETE /api/models/projects/{id}
**Purpose**: Delete project  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

### Chat Sessions

#### GET /api/models/chat-sessions
**Purpose**: List all chat sessions  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### GET /api/models/chat-sessions/{id}
**Purpose**: Get chat session by ID  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### POST /api/models/chat-sessions
**Purpose**: Create new chat session  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### PUT /api/models/chat-sessions/{id}
**Purpose**: Update chat session  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### DELETE /api/models/chat-sessions/{id}
**Purpose**: Delete chat session  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

### Chat Messages

#### GET /api/models/chat-messages
**Purpose**: List chat messages (with filters)  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

**Query Parameters**:
- `chatSessionId` (optional): Filter by session
- `limit` (optional): Number of messages
- `nextToken` (optional): Pagination token

#### GET /api/models/chat-messages/{id}
**Purpose**: Get chat message by ID  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### POST /api/models/chat-messages
**Purpose**: Create new chat message  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### PUT /api/models/chat-messages/{id}
**Purpose**: Update chat message  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### DELETE /api/models/chat-messages/{id}
**Purpose**: Delete chat message  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

### Wells

#### GET /api/models/wells
**Purpose**: List all wells  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### GET /api/models/wells/{id}
**Purpose**: Get well by ID  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### POST /api/models/wells
**Purpose**: Create new well  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### PUT /api/models/wells/{id}
**Purpose**: Update well  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

#### DELETE /api/models/wells/{id}
**Purpose**: Delete well  
**Lambda**: New Lambda for DynamoDB operations  
**Auth**: Required

---

## 6. Health & Utility Routes

### GET /api/health
**Purpose**: Health check endpoint  
**Lambda**: Simple Lambda or API Gateway mock  
**Auth**: Not required (public)

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "ISO8601",
  "version": "1.0.0"
}
```

### GET /test/auth
**Purpose**: Test Cognito authorizer (already implemented)  
**Lambda**: `testAuthFunction`  
**Auth**: Required

---

## Implementation Priority

### Phase 1 (Immediate - Task 3.3)
1. ✅ `/test/auth` - Already implemented
2. `/api/projects/delete` - Critical for current bug fix
3. `/api/projects/rename` - Critical for current bug fix
4. `/api/projects/{projectId}` - For project details

### Phase 2 (Next - Task 5.1-5.4)
5. `/api/chat/message` - Main agent invocation
6. `/api/agent/progress/{requestId}` - Progress polling
7. `/api/catalog/map-data` - Catalog functionality
8. `/api/catalog/search` - Catalog search

### Phase 3 (Later - Task 6.x)
9. All DynamoDB model CRUD routes
10. Collection management routes
11. Maintenance and EDIcraft agent routes
12. Streaming and OSDU routes

---

## Route-to-Lambda Mapping Summary

| Route Pattern | Lambda Function | Status |
|--------------|-----------------|--------|
| `/test/auth` | `testAuthFunction` | ✅ Deployed |
| `/api/chat/message` | `agentFunction` | 📋 Planned |
| `/api/chat/maintenance` | `maintenanceAgentFunction` | 📋 Planned |
| `/api/chat/edicraft` | `edicraftAgentFunction` | 📋 Planned |
| `/api/agent/progress/{requestId}` | `agentProgressFunction` | 📋 Planned |
| `/api/projects/*` | `renewableToolsFunction` | 📋 Planned |
| `/api/catalog/*` | `catalogMapDataFunction` / `catalogSearchFunction` | 📋 Planned |
| `/api/osdu/search` | `osduProxyFunction` | 📋 Planned |
| `/api/collections/*` | `collectionServiceFunction` | 📋 Planned |
| `/api/models/*` | New `crudFunction` | 📋 To Create |
| `/api/health` | Mock or simple Lambda | 📋 Planned |

---

## Notes

### GraphQL to REST Conversion

**GraphQL Mutations → POST requests**
- `invokeLightweightAgent` → `POST /api/chat/message`
- `deleteRenewableProject` → `POST /api/projects/delete`

**GraphQL Queries → GET requests**
- `getAgentProgress` → `GET /api/agent/progress/{requestId}`
- `getCatalogMapData` → `GET /api/catalog/map-data`

**GraphQL Models → CRUD routes**
- `Project` model → `/api/models/projects/*`
- `ChatSession` model → `/api/models/chat-sessions/*`

### API Gateway Configuration

- **CORS**: Enabled for all origins (development), restrict in production
- **Authorization**: Cognito JWT authorizer on all routes except `/api/health`
- **Logging**: CloudWatch access logs enabled
- **Throttling**: Default API Gateway limits (10,000 req/sec)
- **Caching**: Not enabled initially, can add later for GET requests

### Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (valid token, insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Next Steps

1. ✅ Task 3.1: HTTP API Gateway created
2. ✅ Task 3.2: Cognito authorizer created
3. **Task 3.3**: Document routes (this file) ✅
4. **Task 5.1**: Migrate `renewableToolsFunction` and add project routes
5. **Task 5.2**: Migrate agent functions and add chat routes
6. **Task 5.3**: Migrate renewable orchestrator
7. **Task 5.4**: Migrate catalog functions

