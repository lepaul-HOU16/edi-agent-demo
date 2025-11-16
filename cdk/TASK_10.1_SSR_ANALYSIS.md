# SSR Analysis: Do You Actually Need It?

## Finding: You DON'T Need SSR ✅

### Evidence

**All Pages Are Client-Side**:
```typescript
// Every page starts with:
'use client';
```

**Pages Checked**:
- ✅ `src/app/page.tsx` - `'use client'`
- ✅ `src/app/chat/[chatSessionId]/page.tsx` - `'use client'`
- ✅ `src/app/collections/[collectionId]/page.tsx` - `'use client'`
- ✅ All other pages follow the same pattern

**What This Means**:
- No server-side rendering happening
- All data fetching is client-side (useEffect, etc.)
- Dynamic routes work client-side
- Authentication checks are client-side

### API Routes (Server-Side)

You DO have API routes in `src/app/api/`:
- `/api/debug`
- `/api/renewable/*`
- `/api/health/*`
- `/api/s3-proxy`
- `/api/file/[...s3Key]`

**But**: These are NOT SSR. These are backend API endpoints.

## The Truth About Your Current Setup

### What You Think You're Using
```
Next.js SSR (output: 'standalone')
  ↓
Server renders pages
  ↓
Fast initial load
```

### What You're Actually Using
```
Next.js with 'use client' everywhere
  ↓
Client-side rendering
  ↓
Pages load empty, then fetch data
```

**You're already doing client-side rendering!**

The `output: 'standalone'` is just for the API routes, not page rendering.

## What This Means for Migration

### Option A: Keep Amplify Hosting
**Pros**:
- Works as-is
- 2 hours effort

**Cons**:
- Still using Amplify (even though just for hosting)
- **Paying for SSR capability you don't use**

### Option C: Go Full Static (S3 + CloudFront)
**Pros**:
- Cheaper (no SSR costs)
- Full control
- Zero Amplify

**Cons**:
- Must move API routes to Lambda
- 1-2 weeks effort

**BUT**: The API routes are the only blocker!

## The API Routes Problem

Your API routes in `src/app/api/`:
```typescript
// src/app/api/renewable/health/route.ts
export async function GET(request: NextRequest) {
  // Server-side code
}
```

These CANNOT exist in static export. They must become Lambda functions.

### Current API Routes

1. **Debug Routes** (`/api/debug/*`)
   - Purpose: Debugging, configuration checks
   - Usage: Development only?
   - **Action**: Can probably delete or move to Lambda

2. **Renewable Routes** (`/api/renewable/*`)
   - Purpose: Health checks, diagnostics, energy production
   - Usage: Production
   - **Action**: Move to CDK Lambda functions

3. **Health Routes** (`/api/health/*`)
   - Purpose: S3 health checks
   - Usage: Monitoring
   - **Action**: Move to CDK Lambda functions

4. **S3 Proxy** (`/api/s3-proxy`)
   - Purpose: Proxy S3 requests
   - Usage: File access
   - **Action**: Move to CDK Lambda function

5. **File Route** (`/api/file/[...s3Key]`)
   - Purpose: Serve files from S3
   - Usage: File downloads
   - **Action**: Move to CDK Lambda function or direct S3 access

## Recommendation: Go Full Static (Option C)

### Why This Makes Sense Now

1. **You're not using SSR** - All pages are `'use client'`
2. **API routes can be migrated** - They're just Lambda functions
3. **Zero Amplify** - Complete independence
4. **Lower cost** - S3 + CloudFront cheaper than Amplify Hosting
5. **Full control** - Everything in CDK

### Migration Path

#### Phase 1: Migrate API Routes to Lambda (1 week)
```typescript
// Before: src/app/api/renewable/health/route.ts
export async function GET(request: NextRequest) {
  // Health check logic
}

// After: cdk/lambda-functions/renewable-health/handler.ts
export const handler = async (event: APIGatewayProxyEventV2) => {
  // Same health check logic
  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'healthy' })
  };
};
```

**API Routes to Migrate**:
1. `/api/renewable/*` → `cdk/lambda-functions/renewable-api/`
2. `/api/health/*` → `cdk/lambda-functions/health-api/`
3. `/api/s3-proxy` → `cdk/lambda-functions/s3-proxy/`
4. `/api/file/*` → Direct S3 access or Lambda
5. `/api/debug/*` → Delete or move to Lambda

#### Phase 2: Update Frontend to Static Export (3 days)
```javascript
// next.config.js
output: 'export', // Change from 'standalone'
```

**Changes Required**:
- Update API calls to point to CDK API Gateway
- Remove `src/app/api/` directory
- Test all pages load correctly
- Verify all data fetching works

#### Phase 3: Set Up S3 + CloudFront (2 days)
```typescript
// cdk/lib/main-stack.ts
const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
  websiteIndexDocument: 'index.html',
  publicReadAccess: true,
});

const distribution = new cloudfront.Distribution(this, 'Distribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(websiteBucket),
  },
});
```

#### Phase 4: Deploy and Test (2 days)
```bash
# Build static site
npm run build

# Deploy to S3
aws s3 sync out/ s3://website-bucket/

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### Total Effort: 2 Weeks

**Week 1**: Migrate API routes to Lambda
**Week 2**: Static export + S3/CloudFront setup + testing

## Cost Comparison

### Option A: Keep Amplify Hosting
```
Amplify Hosting: ~$50-100/month
- Build minutes: $0.01/minute
- Hosting: $0.15/GB served
- SSR compute: Additional costs
```

### Option C: S3 + CloudFront
```
S3: ~$5-10/month
- Storage: $0.023/GB
- Requests: $0.0004/1000 requests

CloudFront: ~$10-20/month
- Data transfer: $0.085/GB
- Requests: $0.0075/10,000 requests

Total: ~$15-30/month (50-70% savings)
```

## Final Recommendation

**Go with Option C: Full Static Export**

**Reasons**:
1. You're not using SSR anyway
2. API routes are easy to migrate (you've already done this for other endpoints)
3. 50-70% cost savings
4. Zero Amplify dependency
5. Full control over infrastructure
6. Only 2 weeks of work

**Next Steps**:
1. Migrate API routes to CDK Lambda (1 week)
2. Change to static export (3 days)
3. Set up S3 + CloudFront (2 days)
4. Test and deploy (2 days)

**Total**: 2 weeks to complete Amplify removal

## Decision Point

**Do you want to**:
- **Option A**: Keep Amplify Hosting (2 hours, still using Amplify)
- **Option C**: Go full static (2 weeks, zero Amplify, lower cost)

Given that you're not using SSR, Option C makes the most sense.
