# Task 10.2: API Routes Migration Plan

## API Routes Inventory

### 1. Renewable Routes (`/api/renewable/*`)
- ✅ `/api/renewable/health` - Health checks
- ✅ `/api/renewable/health/deployment` - Deployment validation
- ✅ `/api/renewable/diagnostics` - System diagnostics
- ✅ `/api/renewable/energy-production` - Energy calculations
- ✅ `/api/renewable/wind-data` - Wind data processing
- ✅ `/api/renewable/debug` - Debug information

### 2. Health Routes (`/api/health/*`)
- ✅ `/api/health/s3` - S3 health monitoring

### 3. Utility Routes
- ✅ `/api/s3-proxy` - S3 file proxy
- ✅ `/api/global-directory-scan` - Directory scanning
- ✅ `/api/test-renewable-config` - Config testing

### 4. Debug Routes (Development Only)
- ⚠️ `/api/debug` - Debug endpoint
- ⚠️ `/api/debug/file-content` - File content debugging

**Total**: 11 API routes to migrate

## Migration Strategy

### Phase 1: Group by Functionality
1. **Renewable API** - All `/api/renewable/*` routes → Single Lambda
2. **Health API** - All `/api/health/*` routes → Single Lambda  
3. **S3 Proxy API** - `/api/s3-proxy` → Single Lambda
4. **Utility API** - Remaining utility routes → Single Lambda
5. **Debug API** - Skip (development only, can delete)

### Phase 2: Implementation Approach

Each Lambda will:
1. Handle multiple routes via path routing
2. Reuse existing logic from Next.js API routes
3. Use API Gateway HTTP event format
4. Include proper error handling
5. Support CORS for frontend

## Detailed Migration Plan

### Lambda 1: Renewable API

**Routes**:
- GET `/api/renewable/health`
- GET/POST `/api/renewable/health/deployment`
- GET/POST `/api/renewable/diagnostics`
- POST `/api/renewable/energy-production`
- POST `/api/renewable/wind-data`
- GET `/api/renewable/debug`

**Implementation**:
```
cdk/lambda-functions/api-renewable/
├── handler.ts              # Main router
├── health.ts               # Health check logic
├── deployment.ts           # Deployment validation
├── diagnostics.ts          # Diagnostics logic
├── energy-production.ts    # Energy calculations
├── wind-data.ts            # Wind data processing
└── debug.ts                # Debug info
```

**Effort**: 1-2 days

### Lambda 2: Health API

**Routes**:
- GET `/api/health/s3`

**Implementation**:
```
cdk/lambda-functions/api-health/
├── handler.ts              # Main handler
└── s3-health.ts            # S3 health check logic
```

**Effort**: 2-3 hours

### Lambda 3: S3 Proxy API

**Routes**:
- GET `/api/s3-proxy`

**Implementation**:
```
cdk/lambda-functions/api-s3-proxy/
└── handler.ts              # S3 proxy logic
```

**Effort**: 2-3 hours

### Lambda 4: Utility API

**Routes**:
- POST `/api/global-directory-scan`
- GET `/api/test-renewable-config`

**Implementation**:
```
cdk/lambda-functions/api-utility/
├── handler.ts              # Main router
├── directory-scan.ts       # Directory scanning
└── config-test.ts          # Config testing
```

**Effort**: 3-4 hours

## Timeline

**Day 1-2**: Renewable API Lambda (most complex)
**Day 3**: Health API + S3 Proxy API Lambdas
**Day 4**: Utility API Lambda + CDK integration
**Day 5**: Testing and frontend updates

**Total**: 5 days (1 week)

## Next Steps

1. Start with Renewable API (most critical)
2. Copy logic from existing Next.js API routes
3. Adapt to Lambda event format
4. Add to CDK stack
5. Test each endpoint
6. Update frontend to use new endpoints
7. Repeat for other APIs

## Decision: Start with Renewable API

This is the most complex and most used API, so we'll start here as a template for the others.
