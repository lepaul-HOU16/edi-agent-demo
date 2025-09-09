# How to Get Your AWS Credentials

## Method 1: AWS Console (Easiest for Beginners)

### Step 1: Log into AWS Console
1. Go to https://aws.amazon.com/console/
2. Sign in with your AWS account

### Step 2: Navigate to IAM
1. In the AWS Console, search for "IAM" in the top search bar
2. Click on "IAM" service

### Step 3: Create/Find Access Keys
1. Click "Users" in the left sidebar
2. Click on your username (or create a new user if needed)
3. Click the "Security credentials" tab
4. Scroll down to "Access keys" section
5. Click "Create access key"
6. Choose "Local code" or "CLI" as the use case
7. **IMPORTANT**: Download the CSV file or copy the credentials immediately - you can't see the secret key again!

### Result:
```
Access Key ID: AKIAIOSFODNN7EXAMPLE (starts with AKIA)
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY (long random string)
```

## Method 2: AWS CLI (If Already Configured)

### Check if you have AWS CLI configured:
```bash
aws configure list
```

### If configured, your credentials are stored in:
- **macOS/Linux**: `~/.aws/credentials`
- **Windows**: `%USERPROFILE%\.aws\credentials`

### View the file:
```bash
cat ~/.aws/credentials
```

### Example output:
```
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

## Method 3: AWS SSO/Temporary Credentials

### If using AWS SSO:
```bash
aws sso login --profile your-profile
aws configure export-credentials --profile your-profile --format env
```

### For temporary credentials:
```bash
aws sts get-session-token
```

### This gives you:
```json
{
    "Credentials": {
        "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",
        "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "SessionToken": "IQoJb3JpZ2luX2VjEHAa...",
        "Expiration": "2024-01-01T12:00:00Z"
    }
}
```

## Method 4: Check Environment Variables

### Check if already set in your terminal:
```bash
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_SESSION_TOKEN
```

## Method 5: Amplify CLI (Recommended for Amplify Projects)

### If this is an Amplify project:
```bash
# Configure Amplify (this will set up AWS credentials)
amplify configure

# Or pull existing project configuration
amplify pull --appId d1eeg2gu6ddc3z --envName main
```

## How to Update .env.local

Once you have your credentials, edit `.env.local`:

### Replace these placeholder lines:
```bash
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_SESSION_TOKEN=your_session_token_here
```

### With your actual values:
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SESSION_TOKEN=IQoJb3JpZ2luX2VjEHAa...
```

## Important Notes:
- **Never commit .env.local to git** (it's already in .gitignore)
- **Keep credentials secure** - don't share them
- **Session tokens expire** - permanent access keys don't need SESSION_TOKEN
- **For production**, use IAM roles instead of access keys when possible

## Test Your Setup:
```bash
# Restart dev server
npm run dev

# Test the endpoint
curl http://localhost:3001/api/health/s3
```

You should see `"status": "healthy"` instead of the AWS Access Key error.
