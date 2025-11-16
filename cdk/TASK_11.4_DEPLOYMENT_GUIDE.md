# Task 11.4: Frontend Deployment Testing Guide

## Overview

This guide walks through deploying the frontend to S3 + CloudFront and validating that everything works correctly.

## Prerequisites

### 1. Fix TypeScript Errors

Before deploying, fix the TypeScript compilation errors in Lambda functions:

```bash
npm run build --prefix cdk
```

Common errors to fix:
- Implicit `any` types
- Missing type definitions
- Null/undefined checks

### 2. AWS Credentials

Ensure AWS CLI is configured:

```bash
aws sts get-caller-identity
```

Should show your AWS account ID and user.

### 3. Dependencies Installed

```bash
# CDK dependencies
npm install --prefix cdk

# Frontend dependencies
npm install
```

## Deployment Steps

### Step 1: Deploy CDK Stack

```bash
# Build CDK
npm run build --prefix cdk

# Preview changes
npx cdk diff --app "cdk/cdk.out"

# Deploy
npx cdk deploy --app "cdk/cdk.out"
```

Expected output:
```
✅  EnergyDataInsightsStack

Outputs:
EnergyDataInsightsStack.CloudFrontDistributionId = E1234567890ABC
EnergyDataInsightsStack.CloudFrontDomainName = d1234567890.cloudfront.net
EnergyDataInsightsStack.FrontendUrl = https://d1234567890.cloudfront.net
EnergyDataInsightsStack.ApiUrlViaCloudFront = https://d1234567890.cloudfront.net/api
EnergyDataInsightsStack.FrontendBucketName = energydatainsightsstack-frontend-development
EnergyDataInsightsStack.HttpApiUrl = https://abc123.execute-api.us-east-1.amazonaws.com
```

### Step 2: Verify CloudFront Configuration

```bash
./cdk/test-cloudfront-setup.sh
```

Expected results:
- ✅ Distribution ID found
- ✅ S3 origin configured
- ✅ API Gateway origin configured
- ✅ /api/* behavior configured
- ✅ 404 error response configured

### Step 3: Build and Deploy Frontend

```bash
./scripts/deploy-frontend.sh
```

This will:
1. Get CDK outputs (bucket name, CloudFront ID, API URL)
2. Build frontend with correct API URL
3. Upload to S3 with proper cache headers
4. Invalidate CloudFront cache
5. Display deployment summary

Expected output:
```
✅ Frontend deployed successfully!

📍 Access URLs:
   CloudFront: https://d1234567890.cloudfront.net
   API:        https://d1234567890.cloudfront.net/api

📊 Deployment Details:
   Files: 42
   CloudFront: E1234567890ABC
```

### Step 4: Test Deployment

```bash
./cdk/test-frontend-deployment.sh
```

Expected results:
- ✅ Homepage accessible (HTTP 200)
- ✅ Assets directory exists
- ✅ SPA routing works (HTTP 200)
- ✅ API accessible (HTTP 401 or 200)
- ✅ HTTPS redirect working

## Manual Testing Checklist

### 1. Homepage Load Test

```bash
# Get CloudFront URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name EnergyDataInsightsStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text)

# Test homepage
curl -I "$FRONTEND_URL"
```

Expected: `HTTP/2 200`

### 2. Static Assets Test

```bash
# Test JS bundle
curl -I "$FRONTEND_URL/assets/index-abc123.js"
```

Expected: 
- `HTTP/2 200`
- `cache-control: public, max-age=31536000, immutable`

### 3. SPA Routing Test

```bash
# Test non-existent route (should return index.html)
curl -I "$FRONTEND_URL/chat/test-123"
```

Expected: `HTTP/2 200` (not 404)

### 4. API Test

```bash
# Test API through CloudFront
curl -I "$FRONTEND_URL/api/health"
```

Expected: `HTTP/2 200` or `HTTP/2 401` (if auth required)

### 5. CORS Test

```bash
# Test CORS headers
curl -I -H "Origin: https://example.com" "$FRONTEND_URL/api/health"
```

Expected: `access-control-allow-origin: *`

## Browser Testing

### 1. Open Application

1. Get CloudFront URL from CDK outputs
2. Open in browser
3. Check DevTools Console for errors

### 2. Test Authentication

1. Click "Sign In"
2. Enter credentials
3. Verify redirect to app
4. Check that JWT token is stored

### 3. Test Navigation

1. Navigate to different pages
2. Use browser back/forward buttons
3. Refresh page on deep route (e.g., `/chat/123`)
4. Verify SPA routing works

### 4. Test API Calls

1. Open DevTools Network tab
2. Perform actions that call API
3. Verify:
   - Requests go to CloudFront domain
   - Authorization header present
   - No CORS errors
   - Responses are correct

### 5. Test Features

Test each major feature:
- [ ] Create new project
- [ ] List projects
- [ ] Delete project
- [ ] Send chat message
- [ ] View chat history
- [ ] Browse catalog
- [ ] View map data
- [ ] Run renewable analysis (if enabled)

## Performance Testing

### 1. Page Load Time

```bash
# Test with curl timing
curl -w "@-" -o /dev/null -s "$FRONTEND_URL" <<'EOF'
    time_namelookup:  %{time_namelookup}s\n
       time_connect:  %{time_connect}s\n
    time_appconnect:  %{time_appconnect}s\n
   time_pretransfer:  %{time_pretransfer}s\n
      time_redirect:  %{time_redirect}s\n
 time_starttransfer:  %{time_starttransfer}s\n
                    ----------\n
         time_total:  %{time_total}s\n
EOF
```

Target: < 2 seconds total time

### 2. Asset Load Time

Check in browser DevTools:
- Initial page load: < 3 seconds
- Subsequent navigation: < 500ms
- API calls: < 1 second

### 3. Cache Effectiveness

```bash
# First request (cache miss)
curl -w "%{time_total}\n" -o /dev/null -s "$FRONTEND_URL"

# Second request (cache hit)
curl -w "%{time_total}\n" -o /dev/null -s "$FRONTEND_URL"
```

Second request should be significantly faster.

## Troubleshooting

### Issue: Stack Deployment Fails

**Error**: TypeScript compilation errors

**Solution**:
```bash
# Fix TypeScript errors
npm run build --prefix cdk

# Check specific errors
npx tsc --noEmit --project cdk/tsconfig.json
```

### Issue: Frontend Build Fails

**Error**: `npm run build` fails

**Solution**:
```bash
# Clear cache
rm -rf node_modules dist

# Reinstall
npm install

# Rebuild
npm run build
```

### Issue: S3 Upload Fails

**Error**: Access Denied

**Solution**:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify bucket exists
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name EnergyDataInsightsStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

aws s3 ls "s3://$BUCKET/"
```

### Issue: CloudFront Shows 403

**Error**: Accessing CloudFront URL returns 403

**Cause**: No files uploaded to S3 yet

**Solution**:
```bash
# Deploy frontend
./scripts/deploy-frontend.sh
```

### Issue: API Calls Fail with CORS

**Error**: CORS policy error in browser

**Solution**:
```bash
# Check CloudFront behaviors
aws cloudfront get-distribution \
  --id <distribution-id> \
  --query "Distribution.DistributionConfig.CacheBehaviors.Items[?PathPattern=='/api/*']"

# Verify API Gateway CORS
aws apigatewayv2 get-apis \
  --query "Items[?Name=='EnergyDataInsightsStack-http-api']"
```

### Issue: Old Content Showing

**Error**: Changes not visible after deployment

**Solution**:
```bash
# Check invalidation status
aws cloudfront list-invalidations \
  --distribution-id <distribution-id>

# Create new invalidation
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"

# Hard refresh browser (Ctrl+Shift+R)
```

## Validation Checklist

Before considering deployment complete, verify:

- [ ] CDK stack deployed successfully
- [ ] CloudFront distribution created
- [ ] S3 bucket created and accessible
- [ ] Frontend built without errors
- [ ] Files uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] Homepage loads (HTTP 200)
- [ ] Static assets load with correct cache headers
- [ ] SPA routing works (404 → 200)
- [ ] API accessible through CloudFront
- [ ] HTTPS redirect working
- [ ] Authentication flow works
- [ ] All major features functional
- [ ] No console errors in browser
- [ ] No CORS errors
- [ ] Performance acceptable (< 3s load time)

## Success Criteria

✅ **Deployment Successful** when:
1. All automated tests pass
2. All manual tests pass
3. All features work in browser
4. Performance meets targets
5. No errors in CloudWatch logs

## Next Steps

After successful deployment:
1. Monitor CloudWatch logs for errors
2. Test with real users
3. Gather performance metrics
4. Plan for ChatSession migration (Task 12)
5. Prepare for end-to-end testing (Task 13)

## Rollback Plan

If deployment fails:

```bash
# Option 1: Rollback CDK stack
aws cloudformation cancel-update-stack \
  --stack-name EnergyDataInsightsStack

# Option 2: Delete and redeploy
npx cdk destroy
npx cdk deploy

# Option 3: Revert to previous S3 version
aws s3 sync s3://$BUCKET/ s3://$BUCKET-backup/
```

## Status

⏳ **PENDING** - Awaiting TypeScript error fixes before deployment.

**Blockers**:
- TypeScript compilation errors in Lambda functions
- Need to fix before CDK deployment

**Next Actions**:
1. Fix TypeScript errors
2. Deploy CDK stack
3. Deploy frontend
4. Run all tests
5. Validate in browser
