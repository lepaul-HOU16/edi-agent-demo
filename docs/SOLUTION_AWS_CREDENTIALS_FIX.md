# AWS Credentials Fix for S3 Access Denied Error

## Problem Summary
Your S3 file access is failing due to **invalid AWS credentials**. The error shows:
- InvalidAccessKeyId: `AKIAIOSFODNN7EXAMPLE` doesn't exist in AWS records
- Missing environment variables for AWS authentication
- Current AWS CLI configuration is also invalid

## Immediate Solution Options

### Option 1: Configure AWS CLI (Recommended)
```bash
# Install AWS CLI if not installed (macOS)
brew install awscli

# Configure AWS credentials
aws configure

# You'll be prompted to enter:
# - AWS Access Key ID: [Enter your new access key]
# - AWS Secret Access Key: [Enter your secret key]  
# - Default region name: us-east-1
# - Default output format: json
```

### Option 2: Use Environment Variables
Edit the `.env.local` file that was just created:

```bash
# Uncomment and replace with your actual credentials
AWS_ACCESS_KEY_ID=AKIA...  # Your actual access key
AWS_SECRET_ACCESS_KEY=...  # Your actual secret key
AWS_REGION=us-east-1
```

### Option 3: Use AWS Profile (Best Practice)
```bash
# Create a named profile
aws configure --profile amplify-dev

# Then set the profile in .env.local
AWS_PROFILE=amplify-dev
AWS_REGION=us-east-1
```

## How to Get Valid AWS Credentials

### If you have AWS Console Access:
1. Go to AWS IAM Console → Users → Your User → Security credentials
2. Create new Access Key
3. Download the credentials
4. Use them in one of the options above

### If using AWS SSO/Organizations:
```bash
# Configure SSO
aws configure sso

# Get temporary credentials
aws sso login --profile your-profile-name
```

### If using Amplify CLI:
```bash
# If you have amplify configured
amplify configure

# This will help you set up AWS credentials for Amplify
```

## Required S3 Permissions
Your AWS credentials need these permissions for the S3 bucket `amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy`:

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

## After Setting Credentials

1. **Restart your development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Test the S3 health check:**
   ```bash
   curl http://localhost:3000/api/health/s3
   ```

3. **Expected healthy response:**
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

4. **Test file access:**
   ```bash
   # Replace with an actual file path from your error
   curl http://localhost:3000/file/chatSessionArtifacts/sessionId=add55b8a-c520-4533-81e4-12e8d1173fa2/plots/shale_volume_analysis.html
   ```

## Security Notes

- **Never commit credentials to git** - `.env.local` is in `.gitignore`
- **Use IAM roles in production** - not direct credentials
- **Rotate access keys regularly**
- **Use least privilege permissions**

## Next Steps

1. Choose one of the credential setup options above
2. Restart your development server
3. Run the health check to verify the fix
4. Test accessing the specific file that was failing

The application will then be able to access S3 files properly!
