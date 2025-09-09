# AWS Credentials Fix Guide

## Current Issue
Your AWS credentials are invalid, causing the error:
```
SSMCredentialsError: UnrecognizedClientException: The security token included in the request is invalid.
```

## Current Status
- ✅ AWS CLI is installed
- ❌ Credentials are expired/invalid
- ✅ Region configured (us-east-1)

## Solution Options

### Option 1: AWS SSO (Recommended if your organization uses SSO)

#### Step 1: Configure SSO Profile
```bash
# Configure SSO profile
aws configure sso

# Follow the prompts:
# - SSO session name: [enter a name like "my-sso"]
# - SSO start URL: [your organization's SSO URL]
# - SSO region: us-east-1 (or your SSO region)
# - SSO registration scopes: sso:account:access
# - CLI default client Region: us-east-1
# - CLI default output format: json
# - CLI profile name: [enter profile name like "default"]
```

#### Step 2: Login via SSO
```bash
# Login to SSO
aws sso login

# Or if you created a named profile:
aws sso login --profile your-profile-name
```

### Option 2: Refresh Access Keys (If using IAM user)

#### Step 1: Get New Access Keys from AWS Console
1. Log into AWS Console
2. Go to IAM → Users → [Your Username]
3. Go to "Security credentials" tab
4. Create new access key (and delete the old one)

#### Step 2: Update Local Credentials
```bash
# Reconfigure with new keys
aws configure

# Enter your new:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region name: us-east-1
# - Default output format: json
```

### Option 3: Use AWS CLI Profiles

#### If you have multiple AWS accounts/profiles:
```bash
# List all configured profiles
aws configure list-profiles

# Set a specific profile as default
export AWS_PROFILE=your-profile-name

# Or use profile-specific commands
aws sts get-caller-identity --profile your-profile-name
```

## Verification Steps

### Step 1: Test AWS CLI Access
```bash
# Test your credentials
aws sts get-caller-identity

# Should return something like:
# {
#     "UserId": "AIDACKCEVSQ6C2EXAMPLE",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/DevUser"
# }
```

### Step 2: Test Amplify Access
```bash
# Test Amplify deployment
npx ampx sandbox --once
```

## Troubleshooting

### If SSO Login Fails:
```bash
# Clear SSO cache
rm -rf ~/.aws/sso/cache/

# Try login again
aws sso login
```

### If Access Keys Still Don't Work:
```bash
# Clear all credentials and reconfigure
rm ~/.aws/credentials
rm ~/.aws/config
aws configure
```

### Check Current Configuration:
```bash
# View current config
aws configure list

# View all profiles
cat ~/.aws/config

# View credentials (keys will be hidden)
aws configure list
```

## Environment Variables (Alternative)
If you prefer environment variables:
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

## Next Steps After Fixing Credentials
1. Verify credentials work: `aws sts get-caller-identity`
2. Test Amplify deployment: `npx ampx sandbox --once`
3. If successful, use `npx ampx sandbox` for development

## Common Permission Requirements
Your AWS user/role needs these permissions for Amplify:
- CloudFormation (full access)
- S3 (full access)
- Lambda (full access)
- IAM (create/update roles and policies)
- Cognito (full access)
- AppSync (full access)
- Systems Manager Parameter Store (for SSM)
