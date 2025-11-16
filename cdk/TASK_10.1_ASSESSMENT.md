# Task 10.1: Next.js Configuration and Deployment Strategy Assessment

## Current Configuration Analysis

### Next.js Configuration (`next.config.js`)

**Output Mode**: `standalone`
- Configured for Amplify SSR (Server-Side Rendering)
- Generates a standalone server that can run independently
- Includes all necessary dependencies in `.next/standalone`
- Supports dynamic routes and server-side features

**Key Settings**:
- ✅ SSR enabled via `output: 'standalone'`
- ✅ Memory optimizations for Amplify build environment
- ✅ Webpack chunking configured for large dependencies (Plotly, AWS SDK, LangChain)
- ✅ Image optimization disabled (Amplify handles it)
- ✅ Source maps disabled in production
- ✅ TypeScript/ESLint checks disabled during build (memory optimization)

**Build Optimizations**:
```javascript
experimental: {
  serverComponentsExternalPackages: ['aws-sdk', '@aws-sdk', 'puppeteer', 'plotly.js', '@langchain'],
  webpackBuildWorker: false, // Reduce memory
}
swcMinify: false, // Reduce memory
productionBrowserSourceMaps: false,
```

### Current Deployment (`amplify.yml`)

**Platform**: AWS Amplify Hosting
- Node.js 20
- Memory: 6GB allocated (`--max-old-space-size=6144`)
- Build timeout: 3600 seconds (1 hour)
- Artifacts: `.next` directory
- Caching: node_modules, .next/cache

**Build Process**:
```yaml
- export NODE_OPTIONS="--max-old-space-size=6144"
- export NEXT_BUILD_WORKERS=1
- timeout 3600 npm run build
```

### Application Characteristics

**Dynamic Features**:
- ✅ Server-side rendering (SSR) for multiple pages
- ✅ Dynamic routes: `/chat/[chatSessionId]`, `/collections/[collectionId]`
- ✅ API routes (if any in `/app/api/`)
- ✅ Authentication with Cognito (server-side token validation)
- ✅ Real-time data fetching from REST APIs

**Static Features**:
- Landing pages
- Documentation pages
- Some catalog views

**Dependencies**:
- Heavy scientific libraries (Plotly.js, Chart.js)
- AWS SDK packages
- LangChain for AI features
- Large bundle size requiring chunking

## Deployment Options Analysis

### Option A: Keep Amplify Hosting (RECOMMENDED) ✅

**Pros**:
1. **Zero Migration Effort**
   - No changes to Next.js configuration
   - No changes to build process
   - No changes to deployment workflow
   - Existing `amplify.yml` continues to work

2. **SSR Support Out of the Box**
   - Amplify Hosting natively supports Next.js SSR
   - Dynamic routes work without configuration
   - Server-side API routes supported
   - No need to manage server infrastructure

3. **Optimized for Next.js**
   - Automatic CDN distribution
   - Edge caching for static assets
   - Automatic HTTPS
   - Built-in preview deployments for branches

4. **Cost Effective**
   - Pay only for build minutes and hosting
   - No separate CloudFront distribution costs
   - No S3 bucket management
   - Included in Amplify pricing

5. **Developer Experience**
   - Git-based deployments
   - Automatic builds on push
   - Preview URLs for PRs
   - Easy rollback to previous deployments

6. **Backend Already Migrated**
   - CDK API Gateway is already deployed
   - Frontend just needs to point to new API URL
   - Can update environment variables in Amplify Console
   - No infrastructure changes needed

**Cons**:
1. Still uses Amplify service (but only for hosting, not backend)
2. Tied to Amplify pricing model
3. Less control over CDN configuration

**Implementation**:
```bash
# 1. Update environment variable in Amplify Console
NEXT_PUBLIC_API_URL=https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com

# 2. Redeploy (automatic on next git push)
git push origin main

# 3. Done!
```

**Effort**: 1-2 hours
**Risk**: Very Low
**Recommendation**: ✅ **STRONGLY RECOMMENDED**

---

### Option B: Migrate to S3 + CloudFront

**Pros**:
1. **Full Control**
   - Complete control over CDN configuration
   - Custom cache behaviors
   - Custom error pages
   - Fine-grained access control

2. **Pure CDK Stack**
   - Everything in one CDK stack
   - Infrastructure as code
   - Version controlled
   - Consistent deployment process

3. **Potentially Lower Cost**
   - S3 + CloudFront can be cheaper at scale
   - No Amplify hosting fees
   - Pay only for storage and data transfer

**Cons**:
1. **Requires Static Export**
   - Must change `output: 'standalone'` to `output: 'export'`
   - **BREAKS SSR** - all pages become static
   - **BREAKS Dynamic Routes** - requires custom handling
   - **BREAKS API Routes** - must move to Lambda functions

2. **Significant Code Changes**
   - Dynamic routes need `generateStaticParams()`
   - Server-side data fetching becomes client-side
   - Authentication flow changes (no server-side validation)
   - May break existing features

3. **Complex Setup**
   - S3 bucket configuration
   - CloudFront distribution setup
   - Custom error handling (404, 403)
   - Cache invalidation strategy
   - Deployment script creation

4. **Loss of Features**
   - No server-side rendering
   - No incremental static regeneration (ISR)
   - No server-side API routes
   - Slower initial page loads (client-side data fetching)

5. **High Risk**
   - Major architectural change
   - Potential for breaking changes
   - Extensive testing required
   - Difficult rollback

**Implementation Complexity**:
```typescript
// Would need to change:
// 1. next.config.js
output: 'export', // Instead of 'standalone'

// 2. All dynamic routes
export async function generateStaticParams() {
  // Pre-generate all possible routes at build time
}

// 3. All server-side data fetching
// Before (SSR):
const data = await fetchDataServerSide();

// After (Static):
useEffect(() => {
  fetchDataClientSide().then(setData);
}, []);

// 4. Authentication
// Before: Server validates token
// After: Client-side only validation (less secure)
```

**Effort**: 2-3 weeks
**Risk**: High
**Recommendation**: ❌ **NOT RECOMMENDED**

---

## Decision Matrix

| Criteria | Option A: Keep Amplify Hosting | Option B: S3 + CloudFront |
|----------|-------------------------------|---------------------------|
| **Effort** | 1-2 hours | 2-3 weeks |
| **Risk** | Very Low | High |
| **SSR Support** | ✅ Yes | ❌ No |
| **Dynamic Routes** | ✅ Yes | ⚠️ Limited |
| **API Routes** | ✅ Yes | ❌ No |
| **Cost** | Moderate | Lower (at scale) |
| **Control** | Moderate | High |
| **Deployment** | Automatic | Manual script |
| **Rollback** | Easy | Complex |
| **Testing Required** | Minimal | Extensive |
| **Breaking Changes** | None | Many |

## Recommendation: Option A (Keep Amplify Hosting) ✅

### Rationale

1. **Backend Migration is Complete**
   - The goal was to remove Amplify Gen 2 backend (AppSync, GraphQL)
   - ✅ This is done - we now have CDK API Gateway + Lambda
   - Frontend hosting was never the problem

2. **Amplify Hosting is Not the Issue**
   - The issues were with AppSync resolvers and Lambda deployment
   - Amplify Hosting works well for Next.js SSR
   - No need to fix what isn't broken

3. **Minimal Risk**
   - Just update API URL environment variable
   - No code changes required
   - No architectural changes
   - Easy rollback if needed

4. **Preserves Features**
   - SSR continues to work
   - Dynamic routes continue to work
   - No breaking changes
   - User experience unchanged

5. **Cost-Benefit Analysis**
   - Option A: 2 hours effort, zero risk
   - Option B: 3 weeks effort, high risk, many breaking changes
   - Clear winner: Option A

6. **Future Flexibility**
   - Can always migrate to S3 + CloudFront later if needed
   - Not locked in to Amplify Hosting
   - Can evaluate after backend migration is stable

### Implementation Plan (Option A)

#### Step 1: Update Environment Variables (5 minutes)
```bash
# In Amplify Console > App Settings > Environment Variables
NEXT_PUBLIC_API_URL=https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com
```

#### Step 2: Test Locally (30 minutes)
```bash
# Update local .env.local
NEXT_PUBLIC_API_URL=https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com

# Test locally
npm run dev

# Verify:
# - Authentication works
# - API calls go to new CDK API Gateway
# - All features functional
```

#### Step 3: Deploy to Amplify (30 minutes)
```bash
# Commit any changes
git add .
git commit -m "Update API URL to CDK API Gateway"
git push origin main

# Amplify automatically builds and deploys
# Monitor in Amplify Console
```

#### Step 4: Verify Production (30 minutes)
```bash
# Test in production:
# - Login/logout
# - Create/delete projects
# - Chat functionality
# - Catalog search
# - All REST API endpoints
```

#### Total Time: 2 hours
#### Risk Level: Very Low
#### Breaking Changes: None

## Alternative: Hybrid Approach (Future Consideration)

If cost becomes a concern in the future, consider:

1. **Keep Amplify Hosting for SSR pages**
   - Chat interface
   - Project dashboard
   - Dynamic routes

2. **Move static assets to S3 + CloudFront**
   - Landing page
   - Documentation
   - Static images/files

3. **Best of Both Worlds**
   - SSR where needed
   - Cost optimization for static content
   - Gradual migration path

## Conclusion

**Decision**: Proceed with **Option A - Keep Amplify Hosting**

**Justification**:
- Backend migration is the goal (✅ Complete)
- Frontend hosting is not the problem
- Minimal effort, zero risk
- Preserves all features
- Can revisit later if needed

**Next Steps**:
1. Mark task 10.1 as complete
2. Proceed to task 10.2 (Implement Option A)
3. Update environment variables
4. Test and deploy

**Documentation**:
- Update README with new architecture
- Document API Gateway URL
- Update deployment guide
- Note that Amplify Hosting is retained for frontend
