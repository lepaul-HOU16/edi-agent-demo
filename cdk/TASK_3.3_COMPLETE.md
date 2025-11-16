# Task 3.3: Define API Routes Structure - COMPLETE ✅

## Summary

Successfully documented all REST API endpoints that will replace the AppSync GraphQL API. Created comprehensive route structure with clear mapping from GraphQL operations to REST endpoints.

## What Was Documented

### 1. Complete API Routes Documentation
- Created `cdk/API_ROUTES.md` with all endpoint definitions
- Documented 40+ routes across 6 major categories
- Defined request/response formats for each endpoint
- Established route naming conventions and patterns

### 2. Route Categories

#### Chat & Agent Routes (8 endpoints)
- `POST /api/chat/message` - Main agent invocation
- `POST /api/chat/maintenance` - Maintenance agent
- `POST /api/chat/edicraft` - EDIcraft agent
- `GET /api/agent/progress/{requestId}` - Progress polling
- `POST /api/chat/stream-chunk` - Streaming responses

#### Renewable Energy Project Routes (4 endpoints)
- `POST /api/projects/delete` - Delete project
- `POST /api/projects/rename` - Rename project
- `POST /api/projects/export` - Export project
- `GET /api/projects/{projectId}` - Get project details

#### Catalog Routes (3 endpoints)
- `GET /api/catalog/map-data` - Get map data
- `POST /api/catalog/search` - AI-powered search
- `GET /api/osdu/search` - OSDU data search

#### Collection Management Routes (3 endpoints)
- `POST /api/collections` - Create/manage collections
- `GET /api/collections/{collectionId}` - Get collection
- `GET /api/collections` - List collections

#### DynamoDB Model CRUD Routes (20 endpoints)
- Projects: 5 CRUD operations
- Chat Sessions: 5 CRUD operations
- Chat Messages: 5 CRUD operations
- Wells: 5 CRUD operations

#### Health & Utility Routes (2 endpoints)
- `GET /api/health` - Health check
- `GET /test/auth` - Auth testing (already implemented)

### 3. GraphQL to REST Mapping

**Mutations → POST requests**
```
invokeLightweightAgent → POST /api/chat/message
deleteRenewableProject → POST /api/projects/delete
renameRenewableProject → POST /api/projects/rename
```

**Queries → GET requests**
```
getAgentProgress → GET /api/agent/progress/{requestId}
getCatalogMapData → GET /api/catalog/map-data
getRenewableProjectDetails → GET /api/projects/{projectId}
```

**Models → CRUD routes**
```
Project model → /api/models/projects/*
ChatSession model → /api/models/chat-sessions/*
ChatMessage model → /api/models/chat-messages/*
Well model → /api/models/wells/*
```

### 4. Implementation Priority

**Phase 1 (Immediate)** - Task 3.3 ✅
- ✅ Document all routes
- ✅ Define request/response formats
- ✅ Establish naming conventions

**Phase 2 (Next)** - Tasks 5.1-5.4
- Priority 1: Project management routes (delete, rename, get)
- Priority 2: Chat/agent routes (message, progress)
- Priority 3: Catalog routes (map-data, search)

**Phase 3 (Later)** - Tasks 6.x
- DynamoDB CRUD routes
- Collection management
- Maintenance/EDIcraft agents
- Streaming and OSDU

### 5. Route-to-Lambda Mapping

| Route | Lambda | Status |
|-------|--------|--------|
| `/test/auth` | `testAuthFunction` | ✅ Deployed |
| `/api/projects/*` | `renewableToolsFunction` | 📋 Next |
| `/api/chat/message` | `agentFunction` | 📋 Planned |
| `/api/agent/progress/*` | `agentProgressFunction` | 📋 Planned |
| `/api/catalog/*` | `catalogMapDataFunction` / `catalogSearchFunction` | 📋 Planned |
| `/api/collections/*` | `collectionServiceFunction` | 📋 Planned |
| `/api/models/*` | New `crudFunction` | 📋 To Create |

## Files Created/Modified

### Created
- `cdk/API_ROUTES.md` - Complete API routes documentation

### Modified
- `cdk/lib/main-stack.ts` - Added route structure comments

## Route Design Principles

### 1. RESTful Conventions
- Use HTTP methods semantically (GET, POST, PUT, DELETE)
- Plural nouns for collections (`/projects`, `/sessions`)
- Singular for specific resources (`/projects/{id}`)
- Actions as POST to descriptive endpoints (`/projects/delete`)

### 2. Consistent Patterns
- All routes prefixed with `/api/`
- Use kebab-case for multi-word endpoints
- Path parameters for resource IDs: `{id}`, `{projectId}`, `{requestId}`
- Query parameters for filters and options

### 3. Request/Response Format
- All requests/responses use JSON
- Consistent success response: `{ "success": true, "data": {...} }`
- Consistent error response: `{ "success": false, "error": "...", "code": "..." }`
- HTTP status codes follow REST standards

### 4. Authentication
- All routes require Cognito JWT (except `/api/health`)
- Token in `Authorization: Bearer <token>` header
- Authorizer validates token at API Gateway level
- User context available in Lambda event

## Example Route Implementation

### Route Definition (CDK)
```typescript
this.httpApi.addRoutes({
  path: '/api/projects/delete',
  methods: [apigatewayv2.HttpMethod.POST],
  integration: new apigatewayv2_integrations.HttpLambdaIntegration(
    'DeleteProjectIntegration',
    renewableToolsFunction
  ),
  authorizer: this.authorizer,
});
```

### Lambda Handler
```typescript
export const handler = async (event: APIGatewayProxyEventV2) => {
  const { projectId } = JSON.parse(event.body || '{}');
  
  // User info from JWT
  const user = event.requestContext.authorizer?.jwt?.claims;
  
  // Delete project logic
  await deleteProject(projectId, user.sub);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Project deleted',
      projectId
    })
  };
};
```

### Frontend API Call
```typescript
const response = await fetch(`${API_URL}/api/projects/delete`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ projectId: 'abc123' })
});

const result = await response.json();
```

## API Documentation Standards

### Request Documentation
```
POST /api/projects/delete

Purpose: Delete a renewable energy project
Auth: Required (Cognito JWT)

Request Body:
{
  "projectId": "string (required)"
}

Response (200 OK):
{
  "success": true,
  "message": "Project deleted successfully",
  "projectId": "string"
}

Error Response (400/401/500):
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Error Codes
- `INVALID_INPUT` - Missing or invalid request parameters
- `UNAUTHORIZED` - Missing or invalid JWT token
- `FORBIDDEN` - Valid token but insufficient permissions
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

## Migration Benefits

### From GraphQL to REST

**Advantages**:
- ✅ Simpler debugging (standard HTTP tools)
- ✅ Better caching (HTTP caching headers)
- ✅ Easier testing (curl, Postman)
- ✅ More familiar to developers
- ✅ Better API Gateway integration
- ✅ No resolver connection issues

**Trade-offs**:
- ❌ Multiple requests for related data (vs GraphQL single query)
- ❌ No automatic schema validation (vs GraphQL schema)
- ❌ More endpoints to maintain

**Mitigation**:
- Use TypeScript types for validation
- Create composite endpoints where needed
- Document all endpoints clearly

## Next Steps

Ready to proceed to **Phase 2, Task 4: Set Up Lambda Build Process**

This will involve:
- Creating `cdk/lambda-functions/` directory structure
- Setting up esbuild for TypeScript bundling
- Creating reusable Lambda construct helper
- Preparing for Lambda function migration

Then **Task 5.1: Migrate Priority Lambda Functions**:
- Migrate `renewableToolsFunction` first
- Add routes: `/api/projects/delete`, `/api/projects/rename`, `/api/projects/{projectId}`
- Test with real Cognito tokens
- Verify project operations work

## Success Criteria - ALL MET ✅

- [x] All required endpoints documented
- [x] Request/response formats defined for each endpoint
- [x] GraphQL to REST mapping completed
- [x] Route naming conventions established
- [x] Implementation priority defined
- [x] Lambda-to-route mapping documented
- [x] Error handling patterns defined
- [x] Authentication requirements specified
- [x] Example implementations provided
- [x] Documentation complete and comprehensive

## Key Achievements

1. **Complete API Specification** - 40+ endpoints fully documented
2. **Clear Migration Path** - GraphQL operations mapped to REST
3. **Consistent Patterns** - RESTful conventions throughout
4. **Implementation Ready** - Clear priority and next steps
5. **Developer Friendly** - Comprehensive documentation with examples

## Important Notes

### Route Versioning
- Current routes: `/api/*` (implicit v1)
- Future versions: `/api/v2/*` if breaking changes needed
- Maintain backward compatibility when possible

### Rate Limiting
- API Gateway default: 10,000 requests/second
- Per-user throttling: Can add via usage plans
- Monitor CloudWatch metrics for throttling

### Caching Strategy
- GET requests: Can enable API Gateway caching
- Cache TTL: 5-60 minutes depending on data freshness
- Cache keys: Include user ID for user-specific data

### CORS Configuration
- Currently: Allow all origins (`*`) for development
- Production: Restrict to specific domain(s)
- Preflight caching: 1 hour (already configured)

### Monitoring
- CloudWatch access logs: All requests logged
- CloudWatch metrics: Latency, errors, throttling
- X-Ray tracing: Can enable for detailed request tracing

**Task 3.3 is COMPLETE and ready for Lambda migration!** 🎉
