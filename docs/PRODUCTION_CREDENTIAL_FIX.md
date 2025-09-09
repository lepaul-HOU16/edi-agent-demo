# Production AWS Credentials Configuration Fix

## Problem Summary
Your Amplify deployment is failing because AWS credentials are not properly configured for production. Amplify hosting requires custom AWS credentials with the `AMPLIFY_` prefix instead of standard `AWS_` prefixed environment variables.

**Error Details:**
- Status: `configuration_error`
- Error: "AWS credentials not configured for production deployment"
- Details: "Amplify hosting requires custom AWS credentials (AWS_ prefix not allowed)"
- Bucket: `amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m`
- Region: `us-east-1`

## Root Cause
The application code expects AWS credentials to be available, but Amplify's production environment requires these to be set with custom names using the `AMPLIFY_` prefix. Standard `AWS_` prefixed environment variables are not allowed in Amplify hosting.

## Solution Steps

### Step 1: Access Amplify Console
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/home)
2. Find your application: `d1eeg2gu6ddc3z`
3. Click on the application name

### Step 2: Navigate to Environment Variables
1. In the left sidebar, click **"App settings"**
2. Click **"Environment variables"**
   - Alternative: Look for "Hosting" → "Environment variables"

### Step 3: Add Required Environment Variables
Click **"Manage variables"** and add these 4 variables:

#### Required Variables:
```
AMPLIFY_AWS_ACCESS_KEY_ID = [YOUR_AWS_ACCESS_KEY_ID]
AMPLIFY_AWS_SECRET_ACCESS_KEY = [YOUR_AWS_SECRET_ACCESS_KEY]  
AMPLIFY_AWS_SESSION_TOKEN = [YOUR_AWS_SESSION_TOKEN]
AMPLIFY_AWS_REGION = us-east-1
```

**Where to get the values:**
- Copy the exact values from your local `.env.local` file
- These are the same credentials that work in your local development environment

### Step 4: Application Code Updated ✅
The application code has been updated in `utils/amplifyUtils.ts` to handle both production (`AMPLIFY_` prefix) and development (`AWS_` prefix) credentials automatically.

**Key Changes Made:**
- Added `getAWSCredentials()` helper function that prioritizes `AMPLIFY_` prefixed variables
- Falls back to standard `AWS_` variables for local development
- Updated `getConfiguredAmplifyClient()` to use the new credential system
- Updated `setAmplifyEnvVars()` to work with both credential systems

### Step 5: Redeploy Application
After adding the environment variables in Amplify Console:

1. **Go to the main branch**
   - In left sidebar, click "App settings" → "Branches" 
   - Or look for "Hosting" section and find your branch (usually "main")

2. **Redeploy the application**
   - Find the "main" branch in the list
   - Click the "..." menu (three dots) next to the branch
   - Select "Redeploy this version"
   - **OR** click the branch name, then click "Redeploy this version" button

3. **Wait for deployment**
   - Watch the deployment progress
   - Should take 2-5 minutes to complete
   - Look for "Deployed" status

## Verification Steps

### Step 1: Test the S3 Health Endpoint
After deployment completes, test the endpoint:

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
    "responseTime": "200ms"
  }
}
```

### Step 2: Check Application Logs (if needed)
If it still doesn't work:
1. Go to your Amplify app in the console
2. Click on the latest deployment
3. Click "View build logs" to see any errors
4. Look for credential-related error messages

## Environment Variables Summary

**IMPORTANT**: Amplify doesn't allow variables starting with "AWS_", so we use custom names:

```
AMPLIFY_AWS_ACCESS_KEY_ID = [YOUR_ACCESS_KEY_FROM_ENV_LOCAL]
AMPLIFY_AWS_SECRET_ACCESS_KEY = [YOUR_SECRET_KEY_FROM_ENV_LOCAL]
AMPLIFY_AWS_SESSION_TOKEN = [YOUR_SESSION_TOKEN_FROM_ENV_LOCAL]
AMPLIFY_AWS_REGION = us-east-1
```

## Common Issues and Solutions

### Issue 1: Variables Not Showing Up
- **Solution**: Make sure you clicked "Save" after adding variables
- Check that you're in the right app (d1eeg2gu6ddc3z)

### Issue 2: Still Getting Credential Errors
- **Solution**: Verify you copied the credentials exactly from .env.local
- Make sure there are no extra spaces or line breaks
- Check that AMPLIFY_AWS_REGION is set to "us-east-1"

### Issue 3: Temporary Credentials Expired
If using temporary credentials that expire:
- **Solution**: Refresh your AWS credentials using:
  ```bash
  aws sso login  # if using SSO
  # or
  aws configure  # if using long-term credentials
  ```
- Update the Amplify environment variables with new credentials

### Issue 4: Can't Find Environment Variables Section
- Try refreshing the Amplify console page
- Look under "App settings" → "Environment variables"
- Or try "Hosting" → "Environment variables"

## Security Notes
- ⚠️ These credentials will be visible to anyone with Amplify console access
- 🔒 Consider using IAM roles instead of access keys for production
- 🔄 Rotate credentials regularly
- 📊 Monitor usage in CloudTrail

## Next Steps
1. ✅ Add environment variables in Amplify Console
2. ✅ Redeploy the application
3. ✅ Test the S3 health endpoint
4. ✅ Monitor application logs for any remaining issues

After completing these steps and redeploying, your production deployment should have proper AWS credentials configured and the S3 connectivity issues should be resolved.
