# Get Valid AWS Credentials - Step by Step

## IMPORTANT: Create credentials from the AWS account that contains your S3 bucket:
**Bucket**: `amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy`

## Step 1: Access AWS Console
1. Log into the AWS Console for the account where your Amplify app is deployed
2. Make sure you're in the **us-east-1** region (top right corner)
3. Go to **IAM** service

## Step 2: Create New Access Keys
1. In IAM, click **Users** in the left sidebar
2. Click on your username (or create a user if needed)
3. Click the **Security credentials** tab
4. Scroll down to **Access keys**
5. Click **Create access key**

## Step 3: Choose Access Key Type
1. Select **Command Line Interface (CLI)**
2. Check the confirmation checkbox
3. Click **Next**

## Step 4: Download Credentials
1. Add a description like "Local Development S3 Access"
2. Click **Create access key**
3. **IMPORTANT**: Download the CSV file or copy both:
   - Access Key ID (starts with AKIA...)
   - Secret Access Key

## Step 5: Update AWS Configuration
Run this command in your terminal:
```bash
aws configure
```

Enter the NEW credentials:
- **AWS Access Key ID**: [Enter the new AKIA... key]
- **AWS Secret Access Key**: [Enter the new secret key]
- **Default region name**: us-east-1
- **Default output format**: json

## Step 6: Test Credentials
After updating, test with:
```bash
aws sts get-caller-identity
```

Should return something like:
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "484907533441", 
    "Arn": "arn:aws:iam::484907533441:user/your-username"
}
```

## Step 7: Restart Development Server
After confirming valid credentials:
```bash
# Stop current server (Ctrl+C) then restart
npm run dev
```

## Step 8: Test S3 Access
```bash
curl http://localhost:3000/api/health/s3
```

Should return `"status": "healthy"`

## Required S3 Permissions
Your IAM user needs these permissions:
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

If your user doesn't have these permissions, attach the **AmazonS3ReadOnlyAccess** policy or create a custom policy with the above permissions.
