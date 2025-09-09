# S3 Production Deployment Fix Guide

## Problem Summary

The S3 health endpoint at `https://main.d1eeg2gu6ddc3z.amplifyapp.com/api/health/s3` was returning:

```json
{
  "status": "unhealthy",
  "error": "S3 connectivity failed", 
  "errorType": "credentials_error",
  "details": "Could not load credentials from any providers"
}
```

## Root Cause Analysis

**Issue**: The production Amplify deployment does not have AWS credentials configured as environment variables.

**Why it happens**: 
- Local development works because `.env.local` contains valid AWS credentials
- Production Amplify hosting requires credentials to be set in the Amplify Console Environment Variables
- Next.js API routes in production need explicit AWS credentials since they don't run in Lambda functions

## Solution Implementation

### 1. Updated S3 Health Endpoint ✅

Enhanced `src/app/api/health/s3/route.ts` with:
- **Smart credential detection** for development vs production environments
- **Clear error messages** when credentials are missing in production
- **Proper credential handling** using AWS SDK credential providers
- **Detailed troubleshooting guidance** in error responses

### 2. Production Deployment Fix Required

To fix the production issue, AWS credentials must be configured in Amplify Console:

#### Step 1: Get Valid AWS Credentials

Option A - Create new IAM user credentials:
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create new user with programmatic access
3. Attach policy with S3 read permissions:

```json
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
        "arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m",
        "arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m/*"
      ]
    }
  ]
}
```

Option B - Use existing credentials (if you have valid ones):
```bash
aws sts get-caller-identity  # Verify current credentials work
```

#### Step 2: Configure Amplify Environment Variables

1. Go to [Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app: `d1eeg2gu6ddc3z`
3. Go to **App settings > Environment variables**
4. Add these environment variables:

```
AWS_ACCESS_KEY_ID = AKIA[your-access-key]
AWS_SECRET_ACCESS_KEY = [your-secret-key]
AWS_REGION = us-east-1
```

⚠️ **Security Note**: Use IAM users with minimal required permissions, not root account credentials.

#### Step 3: Redeploy the Application

After adding environment variables:
1. Go to the **main** branch in Amplify Console
2. Click **Redeploy this version**
3. Wait for deployment to complete

### 3. Verification Steps

After redeployment, verify the fix:

#### Test S3 Health Endpoint:
```bash
curl https://main.d1eeg2gu6ddc3z.amplifyapp.com/api/health/s3
```

**Expected Success Response:**
```json
{
  "status": "healthy",
  "message": "S3 connectivity verified",
  "details": {
    "bucketName": "amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m",
    "region": "us-east-1", 
    "objectCount": 1,
    "responseTime": "150ms"
  },
  "timestamp": "2025-09-09T00:00:00.000Z"
}
```

#### Test File Access:
```bash
# Test accessing files through the API
curl https://main.d1eeg2gu6ddc3z.amplifyapp.com/file/[your-s3-key-path]
```

## Local Development Confirmed Working ✅

The local environment is functioning correctly:

```bash
curl http://localhost:3001/api/health/s3
# Returns: {"status": "healthy", ...}
```

**Local Setup:**
- ✅ Valid temporary AWS credentials in `.env.local` 
- ✅ S3 connectivity verified (199ms response time)
- ✅ Bucket access working (1 object found, more available)
- ✅ Development environment properly configured

## Alternative Solutions (if environment variables don't work)

### Option 1: Use IAM Role for Amplify Service

1. Create an IAM role for Amplify service
2. Attach S3 permissions to the role  
3. Configure Amplify to use the role instead of access keys

### Option 2: Use Cognito Identity Pool

1. Configure Cognito Identity Pool with unauthenticated access
2. Allow unauthenticated users to access S3
3. Use Cognito credentials in the API route

### Option 3: Proxy Through Lambda Function

1. Create a Lambda function with proper IAM role
2. Proxy S3 requests through the Lambda
3. Call Lambda from Next.js API routes

## Security Best Practices

1. **Use minimal IAM permissions** - Only grant S3 read access to specific bucket
2. **Rotate credentials regularly** - Set up automatic key rotation
3. **Monitor access logs** - Enable CloudTrail for API access monitoring
4. **Use temporary credentials** when possible
5. **Never commit credentials** to source control

## Troubleshooting

If the production deployment still fails after adding environment variables:

1. **Check Amplify build logs** for credential-related errors
2. **Verify environment variables** are properly set in Amplify Console
3. **Test IAM permissions** using AWS CLI with same credentials
4. **Check S3 bucket policy** for any access restrictions
5. **Validate region settings** match between all configurations

## Current Status

- ✅ **Local Development**: Working perfectly
- ✅ **Code Implementation**: Updated with robust credential handling  
- ⏳ **Production Deployment**: Requires AWS credentials in Amplify Console
- ⏳ **Verification**: Pending production credential configuration

The fix is ready - it just needs AWS credentials to be configured in the Amplify Console environment variables to resolve the production issue.
