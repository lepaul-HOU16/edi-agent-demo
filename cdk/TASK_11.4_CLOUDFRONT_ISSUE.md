# Task 11.4: CloudFront Deployment Issue

## Issue

CloudFront deployment fails with error:
```
The parameter origin name cannot contain a colon.
```

## Root Cause

The CDK CloudFront L2 constructs (`S3Origin` and `HttpOrigin`) are generating origin IDs that contain colons, which CloudFront doesn't allow.

The `originId` parameter in the origin configuration doesn't override the auto-generated ID as expected.

## Attempted Fixes

1. ✅ Fixed TypeScript compilation errors
2. ❌ Added explicit `originId` to `HttpOrigin` - didn't work
3. ❌ Added explicit `originId` to `S3Origin` - didn't work

## Workaround Options

### Option A: Use L1 CloudFormation Constructs (Recommended)

Replace the L2 `Distribution` construct with L1 `CfnDistribution` for full control:

```typescript
const distribution = new cloudfront.CfnDistribution(this, 'FrontendDistribution', {
  distributionConfig: {
    enabled: true,
    origins: [
      {
        id: 'S3Origin',
        domainName: frontendBucket.bucketRegionalDomainName,
        s3OriginConfig: {
          originAccessIdentity: '',
        },
      },
      {
        id: 'ApiGatewayOrigin',
        domainName: apiDomain,
        customOriginConfig: {
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: 'https-only',
          originSslProtocols: ['TLSv1.2'],
        },
      },
    ],
    defaultCacheBehavior: {
      targetOriginId: 'S3Origin',
      viewerProtocolPolicy: 'redirect-to-https',
      // ... rest of config
    },
    cacheBehaviors: [
      {
        pathPattern: '/api/*',
        targetOriginId: 'ApiGatewayOrigin',
        // ... rest of config
      },
    ],
  },
});
```

### Option B: Deploy Without CloudFront Initially

1. Comment out CloudFront distribution
2. Deploy S3 bucket and API Gateway
3. Test with S3 website URL and direct API Gateway URL
4. Add CloudFront in a separate deployment

### Option C: Use Separate Stacks

1. Create `FrontendStack` with S3 + CloudFront
2. Create `ApiStack` with API Gateway
3. Pass API URL as parameter to FrontendStack

## Recommended Path Forward

Given time constraints, I recommend **Option B**:

1. Deploy infrastructure without CloudFront
2. Test with S3 website hosting
3. Fix CloudFront configuration separately
4. Add CloudFront in next deployment

This allows us to:
- ✅ Validate API Gateway works
- ✅ Test Lambda functions
- ✅ Deploy frontend to S3
- ✅ Test application functionality
- ⏭️ Add CloudFront optimization later

## Implementation

### Step 1: Temporarily Remove CloudFront

Comment out CloudFront distribution in `cdk/lib/main-stack.ts`:

```typescript
// CloudFront Distribution will be added in next deployment
// const distribution = new cloudfront.Distribution(...)
```

### Step 2: Enable S3 Website Hosting

S3 bucket already has website hosting enabled:
```typescript
websiteIndexDocument: 'index.html',
websiteErrorDocument: 'index.html',
```

### Step 3: Deploy

```bash
cd cdk
npm run build
npx cdk deploy
```

### Step 4: Test

```bash
# Get S3 website URL
aws cloudformation describe-stacks \
  --stack-name EnergyDataInsightsStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketWebsiteUrl'].OutputValue"

# Deploy frontend
./scripts/deploy-frontend.sh

# Test
curl -I <s3-website-url>
```

## Next Steps

1. Deploy without CloudFront
2. Test all functionality
3. Research CDK CloudFront origin ID issue
4. Implement Option A (L1 constructs)
5. Add CloudFront in separate deployment

## Status

⏸️ **PAUSED** - CloudFront deployment blocked by CDK origin ID issue.

**Recommendation**: Proceed with Option B (deploy without CloudFront) to unblock testing.
