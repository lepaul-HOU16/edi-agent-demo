# Renewable Energy Integration - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the renewable energy integration to the EDI Platform. The deployment process involves setting up the Python backend on AWS Bedrock AgentCore and configuring the EDI Platform frontend to connect to it.

## Prerequisites

Before starting deployment, ensure you have:

- [ ] AWS CLI installed and configured
- [ ] AWS account with appropriate permissions
- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] Access to EDI Platform repository
- [ ] Access to renewable energy demo repository

### Required AWS Permissions

Your AWS user/role needs:

- **Bedrock**: `bedrock:*`, `bedrock-agentcore:*`
- **S3**: `s3:CreateBucket`, `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`
- **SSM**: `ssm:PutParameter`, `ssm:GetParameter`
- **IAM**: `iam:CreateRole`, `iam:AttachRolePolicy`
- **Lambda**: `lambda:CreateFunction`, `lambda:UpdateFunctionCode`
- **CloudWatch**: `logs:CreateLogGroup`, `logs:PutLogEvents`

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Steps                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Setup AWS Resources                                     │
│     ├── Create S3 Bucket                                    │
│     ├── Configure SSM Parameters                            │
│     └── Verify IAM Permissions                              │
│                                                              │
│  2. Deploy Renewable Backend                                │
│     ├── Navigate to Demo Directory                          │
│     ├── Run deploy-to-agentcore.sh                          │
│     └── Note AgentCore Endpoint URL                         │
│                                                              │
│  3. Configure EDI Platform                                  │
│     ├── Update .env.local                                   │
│     ├── Configure Environment Variables                     │
│     └── Update Amplify Backend                              │
│                                                              │
│  4. Deploy EDI Platform                                     │
│     ├── Build Frontend                                      │
│     ├── Deploy Amplify Backend                              │
│     └── Verify Deployment                                   │
│                                                              │
│  5. Validate Integration                                    │
│     ├── Run Validation Script                               │
│     ├── Execute Integration Tests                           │
│     └── Manual Smoke Test                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Setup AWS Resources

### 1.1 Create S3 Bucket

Create an S3 bucket for storing renewable energy artifacts:

```bash
# Set variables
export AWS_REGION=us-west-2
export S3_BUCKET_NAME=edi-platform-renewable-assets

# Create bucket
aws s3 mb s3://$S3_BUCKET_NAME --region $AWS_REGION

# Enable versioning (recommended)
aws s3api put-bucket-versioning \
  --bucket $S3_BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Enable encryption (recommended)
aws s3api put-bucket-encryption \
  --bucket $S3_BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Set lifecycle policy (optional - clean up old artifacts after 90 days)
cat > lifecycle-policy.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteOldArtifacts",
      "Status": "Enabled",
      "Prefix": "",
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket $S3_BUCKET_NAME \
  --lifecycle-configuration file://lifecycle-policy.json

rm lifecycle-policy.json
```

### 1.2 Configure SSM Parameters

Set up AWS Systems Manager parameters for the renewable backend:

```bash
# S3 bucket name parameter
aws ssm put-parameter \
  --name "/wind-farm-assistant/s3-bucket-name" \
  --value "$S3_BUCKET_NAME" \
  --type "String" \
  --region $AWS_REGION \
  --overwrite

# Enable S3 storage parameter
aws ssm put-parameter \
  --name "/wind-farm-assistant/use-s3-storage" \
  --value "true" \
  --type "String" \
  --region $AWS_REGION \
  --overwrite

# Verify parameters
aws ssm get-parameter \
  --name "/wind-farm-assistant/s3-bucket-name" \
  --region $AWS_REGION

aws ssm get-parameter \
  --name "/wind-farm-assistant/use-s3-storage" \
  --region $AWS_REGION
```

### 1.3 Verify IAM Permissions

Check that your AWS credentials have the necessary permissions:

```bash
# Test S3 access
aws s3 ls s3://$S3_BUCKET_NAME

# Test SSM access
aws ssm get-parameter --name "/wind-farm-assistant/s3-bucket-name"

# Test Bedrock access (if available in your region)
aws bedrock list-foundation-models --region us-east-1 2>/dev/null || echo "Bedrock not available or no permissions"
```

## Step 2: Deploy Renewable Backend

### 2.1 Navigate to Demo Directory

```bash
# Navigate to the renewable energy demo directory
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/
```

### 2.2 Review Deployment Script

Before deploying, review the deployment script:

```bash
# View the deployment script
cat deploy-to-agentcore.sh
```

The script will:
- Package the Python agents
- Create AgentCore runtime
- Deploy multi-agent system
- Configure MCP server
- Return AgentCore endpoint URL

### 2.3 Run Deployment

```bash
# Set AWS region
export AWS_REGION=us-west-2

# Run deployment script
./deploy-to-agentcore.sh
```

**Expected Output**:
```
🚀 Deploying Renewable Energy Multi-Agent System to AgentCore
================================================================

✓ Packaging agents...
✓ Creating AgentCore runtime...
✓ Deploying agents...
✓ Configuring MCP server...
✓ Setting up permissions...

================================================================
✅ Deployment Complete!
================================================================

AgentCore Endpoint URL:
https://agentcore.us-west-2.amazonaws.com/invoke/renewable-wind-farm-abc123

Save this URL - you'll need it for EDI Platform configuration.
```

### 2.4 Save Endpoint URL

**IMPORTANT**: Save the AgentCore endpoint URL from the deployment output. You'll need it for the next step.

```bash
# Save to environment variable
export AGENTCORE_ENDPOINT="https://agentcore.us-west-2.amazonaws.com/invoke/renewable-wind-farm-abc123"

# Or save to file
echo $AGENTCORE_ENDPOINT > agentcore-endpoint.txt
```

### 2.5 Test AgentCore Endpoint

Verify the endpoint is accessible:

```bash
# Navigate back to EDI Platform directory
cd ../../

# Test endpoint
node scripts/test-agentcore-endpoint.js
```

## Step 3: Configure EDI Platform

### 3.1 Update .env.local

Create or update `.env.local` with renewable energy configuration:

```bash
# Copy example file if it doesn't exist
cp .env.example .env.local

# Add renewable energy configuration
cat >> .env.local <<EOF

# ============================================
# Renewable Energy Integration Configuration
# ============================================

# Enable renewable energy features
NEXT_PUBLIC_RENEWABLE_ENABLED=true

# AgentCore endpoint URL (from Step 2.4)
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=$AGENTCORE_ENDPOINT

# S3 bucket for renewable energy artifacts
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=$S3_BUCKET_NAME

# AWS Region
NEXT_PUBLIC_RENEWABLE_AWS_REGION=$AWS_REGION
EOF
```

### 3.2 Verify Configuration

```bash
# Check environment variables
source .env.local
echo "Enabled: $NEXT_PUBLIC_RENEWABLE_ENABLED"
echo "Endpoint: $NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT"
echo "Bucket: $NEXT_PUBLIC_RENEWABLE_S3_BUCKET"
echo "Region: $NEXT_PUBLIC_RENEWABLE_AWS_REGION"
```

### 3.3 Update Amplify Backend (if needed)

The Amplify backend configuration in `amplify/backend.ts` already includes renewable energy support. Verify it's up to date:

```bash
# Check backend configuration
grep -A 20 "Renewable Energy Integration" amplify/backend.ts
```

## Step 4: Deploy EDI Platform

### 4.1 Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

### 4.2 Build Frontend

```bash
# Build Next.js application
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         120 kB
├ ○ /chat                                8.5 kB         125 kB
└ ○ /catalog                             6.1 kB         122 kB

○  (Static)  automatically rendered as static HTML
```

### 4.3 Deploy Amplify Backend

```bash
# Deploy to Amplify sandbox
npx ampx sandbox --stream-function-logs
```

**Expected Output**:
```
[Sandbox] Deploying...
[Sandbox] ✓ Auth deployed
[Sandbox] ✓ Data deployed
[Sandbox] ✓ Storage deployed
[Sandbox] ✓ Functions deployed
[Sandbox] 
[Sandbox] Deployment complete!
[Sandbox] 
[Sandbox] Amplify Sandbox URL: https://sandbox-abc123.amplifyapp.com
```

### 4.4 Verify Deployment

```bash
# Check Lambda function environment variables
aws lambda get-function-configuration \
  --function-name <lightweightAgentFunction-name> \
  --query 'Environment.Variables' \
  --output json
```

Verify that renewable environment variables are present:
- `NEXT_PUBLIC_RENEWABLE_ENABLED`
- `NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT`
- `NEXT_PUBLIC_RENEWABLE_S3_BUCKET`
- `NEXT_PUBLIC_RENEWABLE_AWS_REGION`

## Step 5: Validate Integration

### 5.1 Run Validation Script

```bash
# Run comprehensive validation
./scripts/validate-renewable-integration.sh
```

**Expected Output**:
```
🌱 Renewable Energy Integration Validation
==========================================

1. Checking Environment Variables
-----------------------------------
✓ NEXT_PUBLIC_RENEWABLE_ENABLED=true
✓ NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT is set
✓ NEXT_PUBLIC_RENEWABLE_S3_BUCKET is set
✓ NEXT_PUBLIC_RENEWABLE_AWS_REGION=us-west-2

2. Checking AWS Resources
-------------------------
✓ S3 bucket exists and is accessible

3. Checking SSM Parameters
--------------------------
✓ SSM parameter /wind-farm-assistant/s3-bucket-name exists
✓ SSM parameter /wind-farm-assistant/use-s3-storage exists

4. Checking File Structure
--------------------------
✓ All files exist

5. Checking TypeScript Compilation
-----------------------------------
✓ TypeScript compilation successful

6. Running Integration Tests
-----------------------------
✓ Integration tests passed

==========================================
Validation Summary
==========================================
Passed: 15
Warnings: 0
Failed: 0

✓ All validation checks passed!
```

### 5.2 Execute Integration Tests

```bash
# Run automated integration tests
npm test -- tests/integration/renewable-integration.test.ts
```

### 5.3 Manual Smoke Test

1. **Open Application**
   ```bash
   npm run dev
   # Open http://localhost:3000/chat
   ```

2. **Test Terrain Analysis**
   - Query: "Analyze terrain for wind farm at 35.067482, -101.395466"
   - Verify: Map displays with suitability score

3. **Test Layout Design**
   - Query: "Create a 30MW wind farm layout at those coordinates"
   - Verify: Layout map displays with turbines

4. **Test Simulation**
   - Query: "Run wake simulation for the layout"
   - Verify: Performance charts display

5. **Test Report**
   - Query: "Generate executive report"
   - Verify: Report displays with recommendations

## Deployment Checklist

### Pre-Deployment

- [ ] AWS CLI configured
- [ ] Appropriate AWS permissions verified
- [ ] Node.js and Python installed
- [ ] Repository access confirmed

### AWS Resources

- [ ] S3 bucket created
- [ ] S3 bucket encryption enabled
- [ ] SSM parameters configured
- [ ] IAM permissions verified

### Backend Deployment

- [ ] Renewable backend deployed to AgentCore
- [ ] AgentCore endpoint URL saved
- [ ] Endpoint connectivity tested
- [ ] MCP server configured

### Frontend Configuration

- [ ] .env.local updated
- [ ] Environment variables verified
- [ ] Amplify backend configuration updated
- [ ] Dependencies installed

### Deployment

- [ ] Frontend build successful
- [ ] Amplify backend deployed
- [ ] Lambda environment variables verified
- [ ] IAM permissions applied

### Validation

- [ ] Validation script passed
- [ ] Integration tests passed
- [ ] Manual smoke test completed
- [ ] All workflows tested

## Environment-Specific Deployments

### Development Environment

```bash
# Development configuration
export ENV=development
export S3_BUCKET_NAME=edi-platform-renewable-assets-dev
export AGENTCORE_ENDPOINT=<dev-endpoint>

# Deploy with development settings
NEXT_PUBLIC_RENEWABLE_ENABLED=true \
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=$AGENTCORE_ENDPOINT \
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=$S3_BUCKET_NAME \
npx ampx sandbox
```

### Staging Environment

```bash
# Staging configuration
export ENV=staging
export S3_BUCKET_NAME=edi-platform-renewable-assets-staging
export AGENTCORE_ENDPOINT=<staging-endpoint>

# Deploy with staging settings
NEXT_PUBLIC_RENEWABLE_ENABLED=true \
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=$AGENTCORE_ENDPOINT \
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=$S3_BUCKET_NAME \
npx ampx sandbox
```

### Production Environment

```bash
# Production configuration
export ENV=production
export S3_BUCKET_NAME=edi-platform-renewable-assets-prod
export AGENTCORE_ENDPOINT=<prod-endpoint>

# Deploy with production settings
NEXT_PUBLIC_RENEWABLE_ENABLED=true \
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=$AGENTCORE_ENDPOINT \
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=$S3_BUCKET_NAME \
npx ampx sandbox --profile production
```

## Troubleshooting Deployment

### Issue: S3 Bucket Creation Failed

**Error**: `BucketAlreadyExists` or `BucketAlreadyOwnedByYou`

**Solution**:
```bash
# Use existing bucket or choose different name
export S3_BUCKET_NAME=edi-platform-renewable-assets-$(date +%s)
aws s3 mb s3://$S3_BUCKET_NAME --region $AWS_REGION
```

### Issue: SSM Parameter Access Denied

**Error**: `AccessDeniedException`

**Solution**:
```bash
# Check IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name <your-username>

# Add SSM permissions if needed
```

### Issue: AgentCore Deployment Failed

**Error**: Various deployment errors

**Solution**:
1. Check CloudWatch logs
2. Verify Bedrock access in region
3. Check IAM role permissions
4. Review deployment script output

### Issue: Frontend Build Failed

**Error**: TypeScript compilation errors

**Solution**:
```bash
# Check for errors
npm run build

# Fix TypeScript errors
npm run type-check

# Clear cache and rebuild
rm -rf .next
npm run build
```

### Issue: Environment Variables Not Loading

**Error**: Variables undefined in Lambda

**Solution**:
1. Verify .env.local exists
2. Check Amplify backend.ts configuration
3. Redeploy Amplify backend
4. Check Lambda function configuration

## Rollback Procedures

### Rollback Frontend

```bash
# Revert to previous commit
git revert HEAD

# Rebuild and redeploy
npm run build
npx ampx sandbox
```

### Rollback Backend

```bash
# Navigate to demo directory
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/

# Redeploy previous version
git checkout <previous-commit>
./deploy-to-agentcore.sh
```

### Disable Renewable Integration

```bash
# Update .env.local
sed -i '' 's/NEXT_PUBLIC_RENEWABLE_ENABLED=true/NEXT_PUBLIC_RENEWABLE_ENABLED=false/' .env.local

# Redeploy
npx ampx sandbox
```

## Monitoring and Maintenance

### CloudWatch Logs

```bash
# View AgentCore logs
aws logs tail /aws/bedrock/agentcore/renewable-wind-farm --follow

# View Lambda logs
aws logs tail /aws/lambda/lightweightAgentFunction --follow
```

### Performance Monitoring

```bash
# Check AgentCore metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name Invocations \
  --dimensions Name=AgentName,Value=renewable-wind-farm \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Cost Monitoring

```bash
# Check S3 storage costs
aws s3 ls s3://$S3_BUCKET_NAME --recursive --summarize

# Check Bedrock usage
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 month ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://bedrock-filter.json
```

## Security Best Practices

### 1. Secure Credentials

- Never commit `.env.local` to git
- Use AWS Secrets Manager for sensitive values
- Rotate credentials regularly

### 2. Least Privilege IAM

- Grant minimum required permissions
- Use resource-based policies
- Enable MFA for production access

### 3. Encrypt Data

- Enable S3 bucket encryption
- Use HTTPS for all API calls
- Enable CloudWatch Logs encryption

### 4. Monitor Access

- Enable CloudTrail logging
- Set up CloudWatch alarms
- Review access logs regularly

## Additional Resources

- [Configuration Guide](./RENEWABLE_CONFIGURATION.md)
- [Testing Guide](./RENEWABLE_INTEGRATION_TESTING_GUIDE.md)
- [Integration Documentation](./RENEWABLE_INTEGRATION.md)
- [AWS Amplify Gen2 Documentation](https://docs.amplify.aws/gen2/)
- [AWS Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)

## Support

For deployment issues:

1. Check troubleshooting section
2. Review CloudWatch logs
3. Run validation script
4. Contact development team

---

**Version**: 1.0  
**Last Updated**: October 3, 2025  
**Deployment Status**: Production Ready

