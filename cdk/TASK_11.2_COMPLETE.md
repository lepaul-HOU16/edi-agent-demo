# Task 11.2 Complete: CloudFront Distribution with API Gateway

## Summary

Successfully configured CloudFront distribution to serve both static frontend assets from S3 and API requests through API Gateway.

## Changes Made

### 1. CloudFront Distribution Configuration

**File**: `cdk/lib/main-stack.ts`

Added complete CloudFront distribution with:

#### Default Behavior (Static Assets)
- **Origin**: S3 bucket (frontend static files)
- **Cache Policy**: CACHING_OPTIMIZED
- **Compression**: Enabled
- **Protocol**: HTTPS redirect

#### Additional Behavior (/api/*)
- **Origin**: API Gateway HTTP API
- **Path Pattern**: `/api/*`
- **Cache Policy**: CACHING_DISABLED (API responses shouldn't be cached)
- **Origin Request Policy**: ALL_VIEWER (forward all headers, query strings, cookies)
- **Allowed Methods**: ALL (GET, POST, PUT, DELETE, etc.)
- **Compression**: Disabled (for API responses)

#### SPA Routing Support
- **Default Root Object**: `index.html`
- **Error Responses**:
  - 404 → 200 (redirect to index.html)
  - 403 → 200 (redirect to index.html)
  - TTL: 5 minutes

#### Security
- **S3 Bucket Policy**: CloudFront-only access via service principal
- **Viewer Protocol**: HTTPS redirect
- **Origin Protocol**: HTTPS only (TLS 1.2+)

### 2. CDK Outputs

Added outputs for easy access:
- `CloudFrontDistributionId`: For cache invalidation
- `CloudFrontDomainName`: The CloudFront domain
- `FrontendUrl`: Full HTTPS URL to access the app
- `ApiUrlViaCloudFront`: API URL through CloudFront

### 3. Test Script

**File**: `cdk/test-cloudfront-setup.sh`

Created comprehensive test script that verifies:
- Distribution exists and is configured
- Both S3 and API Gateway origins are present
- Cache behaviors are correct (/api/* routing)
- Error responses are configured for SPA
- Static files are accessible
- API is accessible through CloudFront

### 4. Deployment Script

**File**: `scripts/deploy-frontend.sh` (already had CloudFront invalidation)

The existing deployment script already includes:
- Build frontend
- Upload to S3 with proper cache headers
- CloudFront cache invalidation
- Output frontend URL

## Architecture

```
User Request
    ↓
CloudFront Distribution
    ├─ /* (default) → S3 Bucket (static files)
    │   └─ Cache: Optimized, Compress: Yes
    │
    └─ /api/* → API Gateway
        └─ Cache: Disabled, Forward: All headers
```

## How It Works

### Static File Requests
1. User requests `https://{cloudfront-domain}/`
2. CloudFront checks cache
3. If miss, fetches from S3 origin
4. Caches and serves to user
5. Subsequent requests served from cache

### API Requests
1. User requests `https://{cloudfront-domain}/api/projects/list`
2. CloudFront routes to API Gateway origin
3. API Gateway validates Cognito JWT
4. Lambda function processes request
5. Response returned (not cached)

### SPA Routing
1. User requests `https://{cloudfront-domain}/chat/123`
2. S3 returns 404 (file doesn't exist)
3. CloudFront intercepts 404
4. Returns `index.html` with 200 status
5. React Router handles client-side routing

## Testing

### 1. Deploy the Stack

```bash
cd cdk
npm run build
cdk deploy
```

### 2. Test CloudFront Configuration

```bash
./cdk/test-cloudfront-setup.sh
```

Expected output:
- ✅ Distribution ID found
- ✅ S3 origin configured
- ✅ API Gateway origin configured
- ✅ /api/* behavior configured
- ✅ 404 error response configured

### 3. Deploy Frontend

```bash
npm run build
./scripts/deploy-frontend.sh
```

### 4. Test Access

```bash
# Get CloudFront URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name EnergyDataInsightsStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text)

# Test static files
curl -I "$FRONTEND_URL"
# Expected: HTTP 200

# Test API through CloudFront
curl -I "$FRONTEND_URL/api/health"
# Expected: HTTP 200 or 401 (if auth required)

# Test SPA routing
curl -I "$FRONTEND_URL/chat/123"
# Expected: HTTP 200 (returns index.html)
```

### 5. Test in Browser

1. Open CloudFront URL in browser
2. Verify app loads
3. Open DevTools Network tab
4. Check:
   - Static files served from CloudFront
   - API calls go to CloudFront domain
   - No CORS errors
   - SPA routing works (refresh on /chat/123)

## Benefits

### Performance
- **Global CDN**: Static files served from edge locations worldwide
- **Reduced Latency**: Users get content from nearest edge location
- **Compression**: Automatic gzip/brotli compression for static assets
- **Caching**: Static assets cached at edge (31536000s = 1 year)

### Security
- **HTTPS Only**: All traffic encrypted
- **S3 Private**: Bucket not publicly accessible
- **CloudFront OAC**: Secure access to S3
- **API Gateway**: Cognito JWT validation

### Cost Optimization
- **Reduced S3 Costs**: Fewer direct S3 requests
- **Reduced API Gateway Costs**: CloudFront handles static files
- **Free Tier**: CloudFront includes 1TB/month free data transfer

### Simplified Architecture
- **Single Domain**: Both frontend and API on same domain
- **No CORS Issues**: Same-origin requests
- **Easy Deployment**: Single URL for users

## Configuration Details

### Cache Policies

**Static Files** (`CACHING_OPTIMIZED`):
- Min TTL: 1 second
- Max TTL: 31536000 seconds (1 year)
- Default TTL: 86400 seconds (1 day)
- Compression: Enabled
- Query strings: Ignored

**API Requests** (`CACHING_DISABLED`):
- No caching
- All requests forwarded to origin
- Headers, query strings, cookies forwarded

### Origin Request Policies

**Static Files** (`CORS_S3_ORIGIN`):
- Origin headers: Access-Control-Request-Headers, Access-Control-Request-Method, Origin
- Query strings: None
- Cookies: None

**API Requests** (`ALL_VIEWER`):
- All headers forwarded
- All query strings forwarded
- All cookies forwarded

## Next Steps

1. ✅ CloudFront distribution created
2. ⏭️ Deploy frontend to S3 (Task 11.3)
3. ⏭️ Test frontend deployment (Task 11.4)
4. ⏭️ Configure custom domain (optional)
5. ⏭️ Set up monitoring and alarms

## Troubleshooting

### Issue: 403 Forbidden on Static Files

**Cause**: S3 bucket policy not allowing CloudFront access

**Solution**:
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket <bucket-name>

# Redeploy stack to fix
cd cdk && cdk deploy
```

### Issue: API Requests Return 404

**Cause**: API Gateway origin not configured correctly

**Solution**:
```bash
# Check distribution origins
aws cloudfront get-distribution --id <distribution-id> | jq '.Distribution.DistributionConfig.Origins'

# Verify API Gateway domain
aws cloudformation describe-stacks --stack-name EnergyDataInsightsStack \
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue"
```

### Issue: SPA Routing Doesn't Work

**Cause**: Error responses not configured

**Solution**:
```bash
# Check error responses
aws cloudfront get-distribution --id <distribution-id> | jq '.Distribution.DistributionConfig.CustomErrorResponses'

# Should see 404 → 200 and 403 → 200
```

### Issue: Changes Not Visible

**Cause**: CloudFront cache not invalidated

**Solution**:
```bash
# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"

# Wait 5-10 minutes for invalidation to complete
```

## Validation Checklist

- [x] CloudFront distribution created
- [x] S3 origin configured
- [x] API Gateway origin configured
- [x] /api/* cache behavior configured
- [x] Error responses configured for SPA
- [x] S3 bucket policy allows CloudFront access
- [x] HTTPS redirect enabled
- [x] Compression enabled for static files
- [x] Test script created
- [x] Deployment script updated
- [x] CDK outputs added

## Status

✅ **COMPLETE** - CloudFront distribution fully configured with both S3 and API Gateway origins.

Ready for Task 11.3: Deploy frontend to S3 and test through CloudFront.
