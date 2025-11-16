# Task 11.3 Complete: Enhanced Deployment Script

## Summary

Enhanced the frontend deployment script with comprehensive validation, environment configuration, and CloudFront cache invalidation.

## Changes Made

### 1. Enhanced Deployment Script

**File**: `scripts/deploy-frontend.sh`

#### Improvements:
- **Step-by-step process** with clear progress indicators
- **CDK output validation** before deployment
- **Automatic API URL configuration** from CDK outputs
- **File count reporting** for transparency
- **Enhanced error handling** with helpful messages
- **Comprehensive summary** with all relevant URLs

#### Deployment Steps:
1. **Get CDK Outputs**: Fetch bucket name, CloudFront ID, API URL
2. **Build Frontend**: Run `npm run build` with API URL env var
3. **Upload to S3**: Sync files with appropriate cache headers
4. **Invalidate CloudFront**: Clear cache for immediate updates
5. **Display Summary**: Show all URLs and deployment details

#### Cache Strategy:
- **Static assets** (JS, CSS, images): `max-age=31536000` (1 year)
- **HTML files**: `no-cache, no-store, must-revalidate`
- Ensures users always get latest HTML but assets are cached

### 2. Test Script

**File**: `cdk/test-frontend-deployment.sh`

Tests:
1. Homepage loads (HTTP 200)
2. Static assets accessible
3. SPA routing works (404 → 200)
4. API accessible through CloudFront
5. HTTPS redirect working

## Usage

### Deploy Frontend

```bash
# From project root
./scripts/deploy-frontend.sh
```

### Test Deployment

```bash
# Test that deployment worked
./cdk/test-frontend-deployment.sh
```

### Custom Stack Name

```bash
# Deploy to different stack
STACK_NAME=MyCustomStack ./scripts/deploy-frontend.sh
```

## Deployment Process

### Prerequisites

1. CDK stack must be deployed:
```bash
cd cdk
npm run build
cdk deploy
```

2. AWS CLI configured with proper credentials

3. Node.js and npm installed

### Step-by-Step Deployment

```bash
# 1. Build and deploy
./scripts/deploy-frontend.sh
```

Expected output:
```
🚀 Deploying frontend to S3 + CloudFront...

1️⃣ Getting CDK stack outputs...
✅ S3 Bucket: energydatainsightsstack-frontend-development
✅ CloudFront Distribution: E1234567890ABC
✅ API URL: https://d1234567890.cloudfront.net/api

2️⃣ Building frontend...
✅ Build complete

3️⃣ Uploading to S3...
📦 Uploading 42 files...
✅ Upload complete

4️⃣ Invalidating CloudFront cache...
✅ Invalidation started: I1234567890ABC
⏳ Cache invalidation takes 5-10 minutes to complete

5️⃣ Deployment Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Frontend deployed successfully!

📍 Access URLs:
   CloudFront: https://d1234567890.cloudfront.net (recommended)
   S3 Direct:  http://bucket.s3-website-us-east-1.amazonaws.com (for testing)
   API:        https://d1234567890.cloudfront.net/api

📊 Deployment Details:
   Stack:       EnergyDataInsightsStack
   Environment: development
   S3 Bucket:   energydatainsightsstack-frontend-development
   CloudFront:  E1234567890ABC
   Files:       42

🎉 Deployment complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Environment Configuration

The deployment script automatically configures the API URL:

1. Fetches `ApiUrlViaCloudFront` from CDK outputs
2. Falls back to `HttpApiUrl` if CloudFront URL not available
3. Sets `VITE_API_URL` and `NEXT_PUBLIC_API_URL` for build
4. Frontend uses this URL for all API calls

### Manual Configuration

If needed, you can manually set the API URL:

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://your-cloudfront-domain.cloudfront.net/api
```

## Testing

### Automated Tests

```bash
./cdk/test-frontend-deployment.sh
```

Expected output:
```
🧪 Testing Frontend Deployment...

🌐 Testing: https://d1234567890.cloudfront.net

1️⃣ Testing homepage...
✅ Homepage accessible (HTTP 200)

2️⃣ Testing static assets...
✅ Assets directory exists

3️⃣ Testing SPA routing...
✅ SPA routing works (HTTP 200)

4️⃣ Testing API through CloudFront...
✅ API accessible (HTTP 401)

5️⃣ Testing HTTPS redirect...
✅ HTTPS redirect working

📊 Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend URL: https://d1234567890.cloudfront.net
```

### Manual Browser Testing

1. Open CloudFront URL in browser
2. Verify app loads without errors
3. Check DevTools Console for errors
4. Test authentication flow
5. Test navigation (SPA routing)
6. Verify API calls work

## Troubleshooting

### Issue: Build Fails

**Symptoms**: `npm run build` fails

**Solutions**:
```bash
# Install dependencies
npm install

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Upload Fails

**Symptoms**: S3 sync fails with permission error

**Solutions**:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify bucket exists
aws s3 ls | grep frontend

# Check bucket policy
aws s3api get-bucket-policy --bucket <bucket-name>
```

### Issue: CloudFront Shows Old Content

**Symptoms**: Changes not visible after deployment

**Solutions**:
```bash
# Wait for invalidation to complete (5-10 minutes)
aws cloudfront get-invalidation \
  --distribution-id <dist-id> \
  --id <invalidation-id>

# Force browser refresh (Ctrl+Shift+R or Cmd+Shift+R)

# Check CloudFront cache headers
curl -I https://your-cloudfront-domain.cloudfront.net
```

### Issue: API Calls Fail

**Symptoms**: 404 or CORS errors on API calls

**Solutions**:
```bash
# Verify API URL is correct
echo $NEXT_PUBLIC_API_URL

# Test API directly
curl https://your-api-url.com/api/health

# Check CloudFront behaviors
aws cloudfront get-distribution --id <dist-id> | \
  jq '.Distribution.DistributionConfig.CacheBehaviors'
```

## Next Steps

1. ✅ Deployment script enhanced
2. ✅ Test script created
3. ⏭️ Deploy and test (Task 11.4)
4. ⏭️ Complete ChatSession migration (Task 12)
5. ⏭️ End-to-end testing (Task 13)

## Status

✅ **COMPLETE** - Deployment script ready for use.

Ready for Task 11.4: Deploy frontend and verify all functionality.
