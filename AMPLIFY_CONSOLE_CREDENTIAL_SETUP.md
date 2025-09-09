# How to Add AWS Credentials in Amplify Console - Step by Step

## Prerequisites
Before you start, you'll need valid AWS credentials. Use one of these methods:

### Option 1: Use Your Current Working Credentials
Since your local development is working, you can use the same credentials:

```bash
# Check your current credentials
echo "AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
echo "AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY"
echo "AWS_REGION: $AWS_REGION"
```

Your `.env.local` file contains:
- `AWS_ACCESS_KEY_ID=AKIA...` (your actual access key)
- `AWS_SECRET_ACCESS_KEY=...` (your actual secret key)
- `AWS_SESSION_TOKEN=...` (if using temporary credentials)

### Option 2: Create New IAM User (Recommended for Production)
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/home#/users)
2. Click "Create user"
3. Enter username: `amplify-s3-access`
4. Check "Provide user access to the AWS Management Console" (optional)
5. Click "Next"
6. Select "Attach policies directly"
7. Create custom policy with these permissions:

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

## Step-by-Step Amplify Console Setup

### Step 1: Access Your Amplify Application
1. **Open AWS Amplify Console**
   - Go to: https://console.aws.amazon.com/amplify/home
   - Or search "Amplify" in AWS Console services

2. **Find Your Application**
   - Look for your app: `d1eeg2gu6ddc3z`
   - Click on the application name to open it

### Step 2: Navigate to Environment Variables
1. **In the left sidebar, click "App settings"**
2. **Click "Environment variables"** (should be in the App settings section)
   
   Alternative path if you don't see it:
   - Look for "Hosting" section in left sidebar
   - Click "Environment variables" under Hosting

### Step 3: Add Environment Variables
You should now see a page titled "Environment variables" with a table.

1. **Click the "Manage variables" button** (usually in top right)

2. **Add Variable 1: AMPLIFY_AWS_ACCESS_KEY_ID**
   - Click "Add variable" or the "+" button
   - Variable name: `AMPLIFY_AWS_ACCESS_KEY_ID`
   - Value: `[YOUR_ACCESS_KEY_FROM_ENV_LOCAL]` (copy from .env.local)
   - Click "Save" or keep adding more

3. **Add Variable 2: AMPLIFY_AWS_SECRET_ACCESS_KEY**
   - Click "Add variable" again
   - Variable name: `AMPLIFY_AWS_SECRET_ACCESS_KEY`
   - Value: `[YOUR_SECRET_KEY_FROM_ENV_LOCAL]` (copy from .env.local)
   - Keep this secure!

4. **Add Variable 3: AMPLIFY_AWS_SESSION_TOKEN** (if using temporary credentials)
   - Variable name: `AMPLIFY_AWS_SESSION_TOKEN`
   - Value: `[YOUR_SESSION_TOKEN_FROM_ENV_LOCAL]` (copy full token from .env.local)

5. **Add Variable 4: AMPLIFY_AWS_REGION**
   - Variable name: `AMPLIFY_AWS_REGION`
   - Value: `us-east-1`

### Step 4: Save Changes
1. **Click "Save"** to save all environment variables
2. You should see all 4 variables listed in the table

### Step 5: Trigger a Redeploy
The app needs to be redeployed to use the new environment variables:

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

## Common Issues and Solutions

### Issue 1: Variables Not Showing Up
- **Solution**: Make sure you clicked "Save" after adding variables
- Check that you're in the right app (d1eeg2gu6ddc3z)

### Issue 2: Still Getting Credential Errors
- **Solution**: Verify you copied the credentials exactly from .env.local
- Make sure there are no extra spaces or line breaks
- Check that AWS_REGION is set to "us-east-1"

### Issue 3: Temporary Credentials Expired
Your current credentials expire on "Mon, 08 Sep 2025 19:19:25 GMT"
- **Solution**: Refresh your AWS credentials using:
  ```bash
  aws sso login  # if using SSO
  # or
  aws configure  # if using long-term credentials
  ```

### Issue 4: Can't Find Environment Variables Section
- Try refreshing the Amplify console page
- Look under "App settings" → "Environment variables"
- Or try "Hosting" → "Environment variables"

## Security Notes
- ⚠️ These credentials will be visible to anyone with Amplify console access
- 🔒 Consider using IAM roles instead of access keys for production
- 🔄 Rotate credentials regularly
- 📊 Monitor usage in CloudTrail

## Quick Reference - Environment Variables to Add:
**IMPORTANT**: Amplify doesn't allow variables starting with "AWS_", so we use custom names:

```
AMPLIFY_AWS_ACCESS_KEY_ID = [YOUR_ACCESS_KEY_FROM_ENV_LOCAL]
AMPLIFY_AWS_SECRET_ACCESS_KEY = [YOUR_SECRET_KEY_FROM_ENV_LOCAL]
AMPLIFY_AWS_SESSION_TOKEN = [YOUR_SESSION_TOKEN_FROM_ENV_LOCAL]
AMPLIFY_AWS_REGION = us-east-1
```

**Note**: Copy the exact values from your `.env.local` file for the first 3 variables.

After adding these and redeploying, your S3 health endpoint should work in production!
