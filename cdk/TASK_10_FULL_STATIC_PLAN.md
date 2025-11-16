# Full Static Migration Plan - Zero Amplify

## Decision: Go Full Static ✅

**Goal**: Complete Amplify removal by migrating to S3 + CloudFront static hosting

**Timeline**: 2 weeks
**Cost Savings**: 50-70% reduction in hosting costs
**Result**: Zero Amplify dependency

## Phase 1: Migrate API Routes to Lambda (Week 1)

### Current API Routes in `src/app/api/`

1. **Renewable Routes** (`/api/renewable/*`)
   - `/api/renewable/health` - Health checks
   - `/api/renewable/diagnostics` - Diagnostics
   - `/api/renewable/energy-production` - Energy calculations
   - `/api/renewable/wind-data` - Wind data processing
   - `/api/renewable/health/deployment` - Deployment validation
   - `/api/renewable/debug` - Debug information

2. **Health Routes** (`/api/health/*`)
   - `/api/health/s3` - S3 health monitoring

3. **Utility Routes**
   - `/api/s3-proxy` - S3 file proxy
   - `/api/file/[...s3Key]` - File serving from S3
   - `/api/debug` - Debug endpoint
   - `/api/debug/file-content` - File content debugging
   - `/api/test-renewable-config` - Config testing
   - `/api/global-directory-scan` - Directory scanning

### Migration Strategy

#### Step 1: Create Lambda Functions (3 days)

**File Structure**:
```
cdk/lambda-functions/
├── api-renewable/
│   ├── handler.ts          # Main handler
│   ├── health.ts           # Health check logic
│   ├── diagnostics.ts      # Diagnostics logic
│   ├── energy.ts           # Energy production
│   └── wind-data.ts        # Wind data processing
├── api-health/
│   └── handler.ts          # S3 health checks
├── api-s3-proxy/
│   └── handler.ts          # S3 proxy logic
└── api-files/
    └── handler.ts          # File serving
```

**Implementation**:
```typescript
// cdk/lambda-functions/api-renewable/handler.ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { healthCheck } from './health';
import { diagnostics } from './diagnostics';
import { energyProduction } from './energy';
import { windData } from './wind-data';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  try {
    // Route to appropriate handler
    if (path === '/api/renewable/health' && method === 'GET') {
      return await healthCheck(event);
    }
    
    if (path === '/api/renewable/diagnostics' && method === 'GET') {
      return await diagnostics(event);
    }
    
    if (path === '/api/renewable/energy-production' && method === 'POST') {
      return await energyProduction(event);
    }
    
    if (path === '/api/renewable/wind-data' && method === 'POST') {
      return await windData(event);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

#### Step 2: Add Lambda Functions to CDK (1 day)

```typescript
// cdk/lib/main-stack.ts

// Create Lambda functions
const apiRenewableLambda = new LambdaFunction(this, 'ApiRenewable', {
  entry: 'lambda-functions/api-renewable/handler.ts',
  environment: {
    // Add necessary environment variables
  },
});

const apiHealthLambda = new LambdaFunction(this, 'ApiHealth', {
  entry: 'lambda-functions/api-health/handler.ts',
});

const apiS3ProxyLambda = new LambdaFunction(this, 'ApiS3Proxy', {
  entry: 'lambda-functions/api-s3-proxy/handler.ts',
});

const apiFilesLambda = new LambdaFunction(this, 'ApiFiles', {
  entry: 'lambda-functions/api-files/handler.ts',
});

// Add routes to API Gateway
api.addRoutes({
  path: '/api/renewable/{proxy+}',
  methods: [apigatewayv2.HttpMethod.ANY],
  integration: new integrations.HttpLambdaIntegration(
    'RenewableIntegration',
    apiRenewableLambda.function
  ),
  authorizer: cognitoAuthorizer,
});

api.addRoutes({
  path: '/api/health/{proxy+}',
  methods: [apigatewayv2.HttpMethod.ANY],
  integration: new integrations.HttpLambdaIntegration(
    'HealthIntegration',
    apiHealthLambda.function
  ),
  authorizer: cognitoAuthorizer,
});

api.addRoutes({
  path: '/api/s3-proxy',
  methods: [apigatewayv2.HttpMethod.ANY],
  integration: new integrations.HttpLambdaIntegration(
    'S3ProxyIntegration',
    apiS3ProxyLambda.function
  ),
  authorizer: cognitoAuthorizer,
});

api.addRoutes({
  path: '/api/file/{proxy+}',
  methods: [apigatewayv2.HttpMethod.ANY],
  integration: new integrations.HttpLambdaIntegration(
    'FilesIntegration',
    apiFilesLambda.function
  ),
  authorizer: cognitoAuthorizer,
});
```

#### Step 3: Test API Routes (1 day)

```bash
# Deploy CDK stack
cd cdk
cdk deploy

# Test each endpoint
./test-api-renewable.sh
./test-api-health.sh
./test-api-s3-proxy.sh
./test-api-files.sh
```

#### Step 4: Update Frontend API Calls (1 day)

```typescript
// Before: Calls Next.js API route
const response = await fetch('/api/renewable/health');

// After: Calls CDK API Gateway
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const response = await fetch(`${API_URL}/api/renewable/health`);
```

**Files to Update**:
- Search for all `fetch('/api/` calls
- Update to use `${API_URL}/api/`
- Add `NEXT_PUBLIC_API_URL` to environment variables

#### Step 5: Delete API Routes (1 day)

```bash
# After verifying all API routes work via Lambda
rm -rf src/app/api/
```

## Phase 2: Convert to Static Export (Week 2)

### Step 1: Update Next.js Configuration (1 hour)

```javascript
// next.config.js
const nextConfig = {
  // Change from 'standalone' to 'export'
  output: 'export',
  
  // Keep existing optimizations
  experimental: {
    serverComponentsExternalPackages: ['aws-sdk', '@aws-sdk', 'puppeteer', 'plotly.js', '@langchain'],
  },
  
  // Images must be unoptimized for static export
  images: {
    unoptimized: true,
  },
  
  // Remove server-side specific configs
  // (no changes needed - already client-side)
};
```

### Step 2: Test Static Build (2 hours)

```bash
# Build static site
npm run build

# Check output directory
ls -la out/

# Test locally
npx serve out/
```

**Expected Output**:
```
out/
├── _next/
│   ├── static/
│   └── ...
├── index.html
├── chat/
│   └── [chatSessionId]/
│       └── index.html
├── collections/
│   └── [collectionId]/
│       └── index.html
└── ...
```

### Step 3: Set Up S3 Bucket (1 day)

```typescript
// cdk/lib/main-stack.ts

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

// Create S3 bucket for website
const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
  bucketName: `${props.appName}-website`,
  websiteIndexDocument: 'index.html',
  websiteErrorDocument: 'index.html', // SPA routing
  publicReadAccess: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  autoDeleteObjects: false,
});

// Output bucket name
new cdk.CfnOutput(this, 'WebsiteBucketName', {
  value: websiteBucket.bucketName,
  description: 'S3 bucket for website',
});
```

### Step 4: Set Up CloudFront Distribution (1 day)

```typescript
// cdk/lib/main-stack.ts

import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

// Create CloudFront distribution
const distribution = new cloudfront.Distribution(this, 'Distribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(websiteBucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  
  // API Gateway as additional origin
  additionalBehaviors: {
    '/api/*': {
      origin: new origins.HttpOrigin(
        `${api.httpApiId}.execute-api.${this.region}.amazonaws.com`
      ),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    },
  },
  
  // Error responses for SPA routing
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: cdk.Duration.minutes(5),
    },
    {
      httpStatus: 403,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: cdk.Duration.minutes(5),
    },
  ],
  
  defaultRootObject: 'index.html',
});

// Output CloudFront URL
new cdk.CfnOutput(this, 'DistributionDomainName', {
  value: distribution.distributionDomainName,
  description: 'CloudFront distribution domain',
});

new cdk.CfnOutput(this, 'DistributionId', {
  value: distribution.distributionId,
  description: 'CloudFront distribution ID',
});
```

### Step 5: Create Deployment Script (1 day)

```bash
#!/bin/bash
# scripts/deploy-frontend.sh

set -e

echo "Building Next.js static site..."
npm run build

echo "Getting S3 bucket name..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name MainStack \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" \
  --output text)

echo "Syncing to S3 bucket: $BUCKET_NAME..."
aws s3 sync out/ s3://$BUCKET_NAME/ --delete

echo "Getting CloudFront distribution ID..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name MainStack \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text)

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
echo "Website URL: https://$(aws cloudformation describe-stacks \
  --stack-name MainStack \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomainName'].OutputValue" \
  --output text)"
```

### Step 6: Test Full Deployment (2 days)

```bash
# Deploy CDK stack with S3 + CloudFront
cd cdk
cdk deploy

# Deploy frontend
cd ..
./scripts/deploy-frontend.sh

# Test website
# - Open CloudFront URL
# - Test all pages
# - Test authentication
# - Test API calls
# - Test file uploads/downloads
# - Test all features
```

## Phase 3: Cleanup (1 day)

### Step 1: Delete Amplify Resources

```bash
# Stop Amplify sandbox (if running)
# Ctrl+C

# Delete Amplify backend
rm -rf amplify/

# Delete Amplify config files
rm amplify_outputs.json
rm .amplifyrc
rm amplify.yml

# Delete Amplify from package.json
npm uninstall aws-amplify @aws-amplify/backend @aws-amplify/backend-cli

# Keep only auth packages (for Cognito)
# @aws-amplify/ui-react (for Authenticator component)
```

### Step 2: Update Documentation

```markdown
# README.md

## Deployment

### Backend
```bash
cd cdk
cdk deploy
```

### Frontend
```bash
npm run build
./scripts/deploy-frontend.sh
```

## Architecture

- **Frontend**: S3 + CloudFront (static site)
- **Backend**: API Gateway + Lambda (CDK)
- **Auth**: Cognito
- **Database**: DynamoDB
- **Storage**: S3
```

### Step 3: Update Environment Variables

```bash
# .env.local (for local development)
NEXT_PUBLIC_API_URL=https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com

# CloudFront will proxy /api/* to API Gateway
# So in production, API calls can use relative URLs: /api/...
```

## Success Criteria

- [ ] All API routes migrated to Lambda
- [ ] All API routes tested and working
- [ ] Static build completes successfully
- [ ] S3 bucket created and configured
- [ ] CloudFront distribution created
- [ ] Website deploys to S3
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] All API calls work
- [ ] All features functional
- [ ] Amplify completely removed
- [ ] Documentation updated
- [ ] Deployment script working

## Rollback Plan

If issues occur:

1. **Keep Amplify Hosting running** until static site is verified
2. **Test static site on separate domain** before switching
3. **DNS cutover** only after full testing
4. **Can revert DNS** if issues found

## Timeline Summary

**Week 1**: API Routes Migration
- Day 1-3: Create Lambda functions
- Day 4: Add to CDK and deploy
- Day 5: Test and update frontend calls

**Week 2**: Static Export & Deployment
- Day 1: Update Next.js config and test build
- Day 2: Set up S3 bucket
- Day 3: Set up CloudFront
- Day 4: Create deployment script
- Day 5: Full testing and cleanup

**Total**: 10 working days (2 weeks)

## Cost Comparison

### Before (Amplify Hosting)
- Amplify Hosting: ~$50-100/month
- Build minutes: $0.01/minute
- Hosting: $0.15/GB served

### After (S3 + CloudFront)
- S3 Storage: ~$5/month
- CloudFront: ~$10-20/month
- **Total: ~$15-25/month**
- **Savings: 50-75%**

## Next Steps

1. Mark task 10.1 as complete
2. Start task 10.2 (Migrate API routes)
3. Follow this plan step by step
4. Test thoroughly at each step
5. Complete Amplify removal!
