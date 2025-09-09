# Immediate Fix for 403 Forbidden Error

## Problem Confirmed
The S3 health check shows: "The AWS Access Key Id you provided does not exist in our records."

## Quick Fix Options

### Option 1: Use Amplify CLI (Recommended if you have Amplify configured)
```bash
# Check if you have amplify configured
amplify status

# If configured, get fresh credentials
amplify configure

# This will guide you through setting up AWS credentials
```

### Option 2: Configure AWS CLI with Fresh Credentials
```bash
# Reconfigure AWS CLI with valid credentials
aws configure

# You'll need:
# - AWS Access Key ID (get from AWS IAM Console)
# - AWS Secret Access Key (get from AWS IAM Console)  
# - Default region: us-east-1
# - Default output format: json
```

### Option 3: Use Environment Variables (Temporary Fix)
If you have valid AWS credentials, add them to `.env.local`:

```bash
# Edit .env.local file
AWS_ACCESS_KEY_ID=AKIA...your-valid-access-key
AWS_SECRET_ACCESS_KEY=...your-valid-secret-key
AWS_REGION=us-east-1
```

## Getting AWS Credentials

### If you have AWS Console access:
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to Users → [Your Username] → Security credentials
3. Click "Create access key"
4. Choose "Command Line Interface (CLI)"
5. Download the credentials
6. Use them in one of the options above

### If you're using AWS SSO:
```bash
aws configure sso
aws sso login
```

## After Setting Credentials

1. **Restart your development server**:
   ```bash
   # Kill current server with Ctrl+C, then:
   npm run dev
   ```

2. **Test the fix**:
   ```bash
   # Test S3 connectivity
   curl http://localhost:3000/api/health/s3
   
   # Should show: "status": "healthy"
   ```

3. **Test file access**:
   ```bash
   # Test accessing your HTML file
   curl http://localhost:3000/file/chatSessionArtifacts/your-session-id/shale_volume_analysis_report.html
   ```

## Expected Result After Fix

The S3 health check should return:
```json
{
  "status": "healthy",
  "message": "S3 connectivity verified",
  "details": {
    "bucketName": "amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy",
    "region": "us-east-1",
    "responseTime": "150ms"
  }
}
```

## Required S3 Permissions

Your AWS credentials need these permissions:
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
        "arn:aws:s3:::amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy",
        "arn:aws:s3:::amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/*"
      ]
    }
  ]
}
```

Choose the option that works best for your setup, then restart the server and test!
