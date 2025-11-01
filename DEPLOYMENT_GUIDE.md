# Deployment Guide - Complete Steps from Scratch

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed ([download](https://nodejs.org/))
- **AWS CLI** installed and configured ([install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- **uv** Python package manager installed ([install guide](https://docs.astral.sh/uv/getting-started/installation/))
- **Git** installed
- **AWS Account** with appropriate permissions (Lambda, S3, DynamoDB, Cognito, AppSync, Amplify)

## Step-by-Step Deployment

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd edi-agent-demo
```

Or if you already have it:

```bash
cd edi-agent-demo
git pull origin <branch-name>
```

### Step 2: Install uv (if not already installed)

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**macOS with Homebrew:**
```bash
brew install uv
```

**Verify installation:**
```bash
uv --version
```

### Step 3: Build the Lambda Layer

The catalogSearch Lambda requires a Python layer with dependencies. This MUST be done before deployment:

```bash
cd amplify/layers/catalogSearchLayer
./build-layer.sh
```

**Expected output:**
```
Building Lambda Layer for Catalog Search...
Using CPython 3.12.11
Resolved 76 packages in 814ms
...
Lambda layer built successfully in python/ directory
```

**Verify the layer was built:**
```bash
ls -la python/requests/
```

You should see the requests module files.

```bash
cd ../../..
```

### Step 4: Install Node.js Dependencies

```bash
npm install
```

This will install all frontend and backend dependencies defined in `package.json`.

### Step 5: Configure AWS Credentials

If not already configured:

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

**Verify credentials:**
```bash
aws sts get-caller-identity
```

### Step 6: Deploy to AWS Amplify Sandbox

For development/testing:

```bash
npx ampx sandbox
```

**What this does:**
- Creates a temporary cloud environment
- Deploys all Lambda functions (including the layer)
- Creates DynamoDB tables
- Creates S3 buckets
- Sets up Cognito authentication
- Creates AppSync GraphQL API
- Streams function logs to your terminal

**Expected output:**
```
[Sandbox] Deploying...
[Sandbox] Deployed resources:
  - Lambda functions: 15+
  - S3 buckets: 2
  - DynamoDB tables: 3
  - AppSync API: 1
[Sandbox] Sandbox URL: https://...amplifyapp.com
```

**Wait for deployment to complete** (typically 5-10 minutes for first deployment).

### Step 7: Verify Deployment

Once deployed, verify the catalogSearch Lambda has the layer:

```bash
# Get the Lambda function name
aws lambda list-functions --query "Functions[?contains(FunctionName, 'CatalogSearch')].FunctionName" --output text

# Check the function configuration
aws lambda get-function-configuration --function-name <function-name-from-above>
```

Look for `Layers` in the output - it should show the catalogSearchLayer.

### Step 8: Access the Application

The sandbox will output a URL like:
```
https://main.d1234567890.amplifyapp.com
```

Open this URL in your browser to access the application.

### Step 9: Test the Catalog Search

1. Navigate to the Catalog page
2. Try the query: "all wells"
3. Verify files are generated and displayed correctly
4. Check browser console for any errors

## Production Deployment

For production deployment to AWS Amplify:

### Option 1: Via Amplify Console (Recommended)

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your Git repository
4. Select the branch to deploy
5. Amplify will automatically detect the configuration
6. **IMPORTANT**: Before deploying, you must build the Lambda layer locally and commit it, OR add a build step

### Option 2: Via CLI

```bash
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

## Redeployment to New AWS Account

When deploying to a completely new AWS account:

### Step 1: Configure New AWS Credentials

```bash
aws configure --profile new-account
```

Or update your default credentials:

```bash
aws configure
```

### Step 2: Build Lambda Layer

**CRITICAL**: The Lambda layer must be rebuilt for each deployment:

```bash
cd amplify/layers/catalogSearchLayer
./build-layer.sh
cd ../../..
```

### Step 3: Deploy

```bash
npx ampx sandbox
```

Or with a specific profile:

```bash
AWS_PROFILE=new-account npx ampx sandbox
```

### Step 4: Update Environment Variables (if needed)

If you have custom environment variables, update them in:
- `amplify/functions/catalogSearch/resource.ts`
- `amplify/backend.ts`

## Common Issues and Solutions

### Issue 1: "No module named 'requests'"

**Cause**: Lambda layer not built or not deployed

**Solution**:
```bash
cd amplify/layers/catalogSearchLayer
./build-layer.sh
cd ../../..
npx ampx sandbox
```

### Issue 2: "uv: command not found"

**Cause**: uv not installed

**Solution**:
```bash
# macOS
brew install uv

# Or using curl
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Issue 3: S3 Fetch Timeout

**Cause**: CORS or network issues

**Solution**: Already fixed in this branch. Ensure you've deployed the latest code.

### Issue 4: AWS Credentials Not Found

**Cause**: AWS CLI not configured

**Solution**:
```bash
aws configure
```

### Issue 5: Deployment Fails with Permission Errors

**Cause**: AWS account lacks necessary permissions

**Solution**: Ensure your AWS user/role has permissions for:
- Lambda (create, update, invoke)
- S3 (create buckets, put/get objects)
- DynamoDB (create tables, read/write)
- Cognito (create user pools)
- AppSync (create APIs)
- IAM (create roles, attach policies)
- CloudFormation (create stacks)

## Verification Checklist

After deployment, verify:

- [ ] Lambda layer built successfully (`ls amplify/layers/catalogSearchLayer/python/requests/`)
- [ ] AWS credentials configured (`aws sts get-caller-identity`)
- [ ] Node dependencies installed (`ls node_modules/`)
- [ ] Sandbox deployed successfully (check terminal output)
- [ ] Application URL accessible (open in browser)
- [ ] Catalog search works ("all wells" query)
- [ ] No console errors in browser DevTools
- [ ] Files generated in S3 bucket
- [ ] GeoJSON loads without timeout

## Troubleshooting

### Error: "No module named 'requests'"

This means the Lambda layer wasn't built or deployed properly.

**Solution:**
```bash
cd amplify/layers/catalogSearchLayer
./build-layer.sh
cd ../../..
npx ampx sandbox
```

### Layer Build Fails

Make sure `uv` is installed:
```bash
# macOS
brew install uv

# Or using pip
pip install uv
```

## What Gets Deployed

- **Frontend**: Next.js app to Amplify Hosting
- **Backend**: 
  - Lambda functions (Node.js and Python)
  - Lambda layers (Python dependencies)
  - AppSync GraphQL API
  - DynamoDB tables
  - S3 buckets
  - Cognito user pools

## Environment Variables

The following environment variables can be configured in `amplify/functions/catalogSearch/resource.ts`:

- `CATALOG_S3_BUCKET`: S3 bucket for session storage
- `OSDU_BASE_URL`: OSDU instance URL
- `OSDU_PARTITION_ID`: OSDU partition ID
- `EDI_USERNAME`: EDI authentication username
- `EDI_PASSWORD`: EDI authentication password
- `EDI_CLIENT_ID`: Cognito client ID
- `EDI_CLIENT_SECRET`: Cognito client secret
- `COGNITO_REGION`: AWS region for Cognito
- `OSDU_QUERY_MODEL`: Bedrock model ID for queries
- `STRANDS_AGENT_MODEL`: Bedrock model ID for agents
