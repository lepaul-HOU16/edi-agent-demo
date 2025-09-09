# AWS Credentials Setup Guide

## The Error
Your `/api/health/s3` endpoint shows:
```json
{
  "status": "unhealthy", 
  "error": "S3 connectivity failed",
  "details": "The AWS Access Key Id you provided does not exist in our records.",
  "config": {
    "bucketName": "amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy",
    "region": "us-east-1"
  }
}
```

## Solution: Get Valid AWS Credentials

### Option 1: AWS CLI (Recommended)
```bash
# Install AWS CLI if not already installed
aws configure

# This will prompt for:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key] 
# Default region name: us-east-1
# Default output format: json

# Get your credentials
aws configure list
```

### Option 2: AWS Console
1. Go to AWS Console → IAM → Users → Your User → Security Credentials
2. Create new Access Key if needed
3. Copy the Access Key ID and Secret Access Key

### Option 3: AWS SSO/Temporary Credentials
```bash
# If using AWS SSO
aws sso login --profile your-profile

# Get temporary credentials
aws sts get-session-token
```

## Update .env.local
Replace the placeholder values in `.env.local`:

```bash
# Current (WRONG - these are placeholders)
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_SESSION_TOKEN=your_session_token_here

# Replace with actual values like:
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SESSION_TOKEN=IQoJb3JpZ2luX2VjEHAaCXVzLWVhc3QtMSJHMEUCIQDExample...
AWS_REGION=us-east-1
```

## Verify Setup
After updating credentials, test:
```bash
# Restart the dev server
npm run dev

# Test the health endpoint
curl http://localhost:3001/api/health/s3
```

## Alternative: Use Amplify CLI
If this is an existing Amplify project:
```bash
amplify configure
amplify pull --appId d1eeg2gu6ddc3z --envName main
```

This will set up the proper credentials and configuration automatically.
