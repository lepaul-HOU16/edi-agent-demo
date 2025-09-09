# S3 File Access Troubleshooting Guide

## Root Cause Analysis Summary

Your S3 file access issues are caused by **AWS credential problems** in production. The health check endpoint has identified that:

1. **Invalid/Expired AWS Access Key**: The current access key `AKIAIOSFODNN7EXAMPLE` does not exist in AWS records
2. **Missing Environment Variables**: AWS credentials are not properly configured in production
3. **Authentication Context**: The production environment lacks proper AWS credential chain configuration

## Quick Diagnosis

### Test S3 Health
```bash
# Check S3 connectivity
curl http://localhost:3002/api/health/s3

# Or in production
curl https://your-domain.com/api/health/s3
```

### Expected Responses

**Healthy Response:**
```json
{
  "status": "healthy",
  "message": "S3 connectivity verified",
  "details": {
    "bucketName": "your-bucket-name",
    "region": "us-east-1",
    "responseTime": "150ms"
  }
}
```

**Error Response (Current Issue):**
```json
{
  "status": "unhealthy",
  "error": "S3 connectivity failed",
  "errorType": "credentials_error",
  "details": "The AWS Access Key Id you provided does not exist in our records."
}
```

## Solutions by Environment

### 1. Local Development Fix

**Option A: Use AWS CLI Credentials (Recommended)**
```bash
# Install AWS CLI if not installed
brew install awscli

# Configure with your AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, region, and output format

# Test credentials
aws sts get-caller-identity
```

**Option B: Environment Variables**
```bash
# Add to your .env.local file
echo "AWS_ACCESS_KEY_ID=your-access-key" >> .env.local
echo "AWS_SECRET_ACCESS_KEY=your-secret-key" >> .env.local
echo "AWS_SESSION_TOKEN=your-session-token" >> .env.local
echo "AWS_REGION=us-east-1" >> .env.local
```

**Option C: Use AWS Profile**
```bash
# Set specific AWS profile
export AWS_PROFILE=your-amplify-profile

# Or add to .env.local
echo "AWS_PROFILE=your-amplify-profile" >> .env.local
```

### 2. Production Deployment Fixes

**For Vercel:**
```bash
# Set environment variables in Vercel dashboard or via CLI
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION

# Or use Vercel IAM role (recommended)
# Configure in vercel.json:
{
  "functions": {
    "app/file/[...s3Key]/route.ts": {
      "runtime": "@vercel/node"
    }
  },
  "env": {
    "AWS_REGION": "us-east-1"
  }
}
```

**For AWS Amplify Hosting:**
```bash
# The app should automatically use Amplify's IAM role
# Ensure your Amplify app has S3 permissions in the IAM role

# Check amplify.yml for proper build settings:
version: 1
backend:
  phases:
    build:
      commands:
        - amplifyPush --simple
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

**For AWS Lambda/ECS:**
```bash
# Attach IAM role to Lambda function or ECS task
# Required permissions:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

### 3. Docker Deployment
```dockerfile
# Add to Dockerfile
ENV AWS_REGION=us-east-1
# Don't hardcode credentials in Docker images!
# Use IAM roles or mount credentials at runtime
```

## Verification Steps

1. **Test Health Check:**
   ```bash
   curl http://localhost:3002/api/health/s3
   ```

2. **Test File Access:**
   ```bash
   # Replace with actual S3 key from your bucket
   curl http://localhost:3002/file/chatSessionArtifacts/your-file.html
   ```

3. **Check Browser Console:**
   - Open browser dev tools
   - Navigate to a page that loads S3 files
   - Check for 404/403 errors in Network tab

## Common Error Patterns

### InvalidAccessKeyId
```
The AWS Access Key Id you provided does not exist in our records
```
**Fix:** Update AWS credentials with valid access key

### AccessDenied
```
Access Denied
```
**Fix:** Add S3 permissions to IAM user/role

### NoSuchBucket
```
The specified bucket does not exist
```
**Fix:** Verify bucket name in `amplify_outputs.json`

### CredentialsError
```
Unable to locate credentials
```
**Fix:** Set AWS environment variables or configure AWS CLI

## Implementation Benefits

### Before (Original Issues):
- ❌ Used Amplify Storage API in server-side route
- ❌ No proper error handling
- ❌ Credentials configured per request
- ❌ No diagnostic capabilities

### After (Fixed Implementation):
- ✅ Direct AWS SDK with proper credential chain
- ✅ Comprehensive error handling and logging
- ✅ Health check endpoint for diagnostics
- ✅ Production-ready credential handling
- ✅ Detailed error messages with troubleshooting steps

## Security Best Practices

1. **Never commit AWS credentials to code**
2. **Use IAM roles in production**
3. **Rotate access keys regularly**
4. **Use least privilege principles**
5. **Monitor CloudTrail for API usage**

## Monitoring & Maintenance

### Health Check Automation
```bash
# Add to monitoring/health check script
#!/bin/bash
HEALTH_ENDPOINT="https://your-domain.com/api/health/s3"
RESPONSE=$(curl -s $HEALTH_ENDPOINT)
STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" != "healthy" ]; then
  echo "S3 health check failed: $RESPONSE"
  # Send alert/notification
fi
```

### Log Analysis
- Monitor for `[S3 Route]` prefixed logs
- Set up CloudWatch alerts for 403/500 errors
- Track response times and failure rates

## Support

If issues persist:
1. Check the health endpoint response
2. Verify AWS credentials are valid
3. Confirm bucket permissions
4. Review CloudTrail logs for API calls
5. Test with AWS CLI commands directly
