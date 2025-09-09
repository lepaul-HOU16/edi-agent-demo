# AWS Session Token - Where to Find It

## Important: You Probably DON'T Need a Session Token

**Session tokens are only required for TEMPORARY credentials. Most users use permanent access keys and DON'T need a session token.**

## When You DON'T Need AWS_SESSION_TOKEN:
- ✅ Using permanent IAM user access keys (most common)
- ✅ Using AWS CLI configured with `aws configure`
- ✅ Using long-term access keys from IAM Console

**For permanent credentials, just use:**
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# AWS_SESSION_TOKEN=  <-- Leave this blank or remove this line
```

## When You DO Need AWS_SESSION_TOKEN:

### 1. AWS SSO (Single Sign-On)
```bash
# Login to SSO
aws sso login --profile my-profile

# Export credentials
aws configure export-credentials --profile my-profile --format env
```

**Output:**
```bash
export AWS_ACCESS_KEY_ID=ASIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  
export AWS_SESSION_TOKEN=IQoJb3JpZ2luX2VjEHAaCXVzLWVhc3QtMSJHMEUCIQD...
```

### 2. Temporary Credentials via STS
```bash
aws sts get-session-token
```

**Output:**
```json
{
    "Credentials": {
        "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",
        "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "SessionToken": "IQoJb3JpZ2luX2VjEHAaCXVzLWVhc3QtMSJHMEUCIQD...",
        "Expiration": "2024-01-01T12:00:00Z"
    }
}
```

### 3. AWS CLI with MFA
```bash
aws sts get-session-token --serial-number arn:aws:iam::123456789012:mfa/user --token-code 123456
```

### 4. Check Current Session Token
```bash
# Check if you have one set in environment
echo $AWS_SESSION_TOKEN

# Check AWS CLI cache (temporary credentials)
ls ~/.aws/cli/cache/
cat ~/.aws/cli/cache/* | grep SessionToken
```

### 5. AWS Credentials File with Profiles
Check `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[sso-profile]
aws_access_key_id = ASIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
aws_session_token = IQoJb3JpZ2luX2VjEHAaCXVzLWVhc3QtMSJHMEUCIQD...
```

## How to Tell if You Need Session Token:

### Your Access Key ID starts with:
- **AKIA...** = Permanent access key (NO session token needed)
- **ASIA...** = Temporary access key (SESSION token required)

## Quick Fix for Most Users:

### Option 1: Remove Session Token (Most Common)
Edit `.env.local`:
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
# Remove or comment out the session token line
```

### Option 2: Get Permanent Credentials
1. Go to AWS Console → IAM → Users → Your User
2. Security Credentials tab
3. Create Access Key
4. Choose "Local code" use case
5. Copy the Access Key ID and Secret (no session token needed)

### Option 3: Use Amplify CLI (Easiest)
```bash
amplify configure
# This sets up permanent credentials automatically
```

## Test Your Setup:
```bash
# Check what credentials you have
aws sts get-caller-identity

# Restart your app
npm run dev

# Test the health endpoint
curl http://localhost:3001/api/health/s3
```

## Summary:
- **Most users**: Use permanent access keys (AKIA...) without session token
- **Advanced users**: Use temporary credentials (ASIA...) with session token
- **Easiest solution**: Run `amplify configure` to set up proper credentials
