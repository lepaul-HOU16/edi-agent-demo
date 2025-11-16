# CDK Deployment Guide

## Overview

This application uses **AWS CDK (Cloud Development Kit)** for infrastructure as code. The entire backend is defined in TypeScript and deployed as a single CloudFormation stack.

---

## Architecture

### Stack: EnergyInsights-development

**Resources:**
- **API Gateway:** HTTP API with Cognito authorizer
- **Lambda Functions:** 17 functions for various features
- **DynamoDB Tables:** 2 tables (Project, ChatMessage)
- **S3 Buckets:** 2 buckets (Storage, Frontend)
- **CloudFront:** CDN distribution for frontend
- **Cognito:** User pool for authentication

### Infrastructure Diagram

```
CDK Stack (EnergyInsights-development)
├── API Gateway (HTTP API)
│   ├── Cognito Authorizer
│   └── Routes:
│       ├── /api/chat/*
│       ├── /api/renewable/*
│       ├── /api/projects/*
│       ├── /api/collections/*
│       ├── /api/catalog/*
│       ├── /api/osdu/*
│       └── /api/s3/*
├── Lambda Functions
│   ├── chat (Node.js 20.x)
│   ├── chat-sessions (Node.js 20.x)
│   ├── renewable-orchestrator (Node.js 20.x)
│   ├── petrophysics-calculator (Python 3.12)
│   ├── projects (Node.js 20.x)
│   ├── collections (Node.js 20.x)
│   ├── catalog-search (Node.js 20.x)
│   ├── catalog-map-data (Node.js 20.x)
│   ├── osdu (Node.js 20.x)
│   ├── api-s3-proxy (Node.js 20.x)
│   ├── api-renewable (Node.js 20.x)
│   ├── api-health (Node.js 20.x)
│   ├── api-utility (Node.js 20.x)
│   ├── custom-authorizer (Node.js 20.x)
│   ├── test-auth (Node.js 20.x)
│   ├── verify-cognito (Node.js 20.x)
│   └── verify-dynamodb (Node.js 20.x)
├── DynamoDB Tables
│   ├── Project-fhzj4la45fevdnax5s2o4hbuqy-NONE
│   └── ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE
├── S3 Buckets
│   ├── amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy (Storage)
│   └── energyinsights-development-frontend-development (Frontend)
├── CloudFront Distribution
│   └── E3O1QDG49S3NGP
└── Cognito User Pool
    └── us-east-1_sC6yswGji
```

---

## Prerequisites

### Required Tools

```bash
# Node.js 20.x
node --version  # Should be v20.x

# AWS CLI
aws --version

# AWS CDK CLI
npm install -g aws-cdk
cdk --version  # Should be 2.x
```

### AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Verify credentials
aws sts get-caller-identity
```

### Required Permissions

Your AWS user/role needs permissions for:
- CloudFormation (create/update/delete stacks)
- Lambda (create/update functions)
- API Gateway (create/update APIs)
- DynamoDB (create/update tables)
- S3 (create/update buckets)
- CloudFront (create/update distributions)
- Cognito (create/update user pools)
- IAM (create/update roles and policies)

---

## Initial Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install CDK dependencies
cd cdk
npm install
cd ..
```

### 2. Bootstrap CDK (First Time Only)

```bash
cd cdk
cdk bootstrap aws://ACCOUNT-ID/REGION

# Example:
cdk bootstrap aws://484907533441/us-east-1
```

This creates the CDK toolkit stack in your AWS account.

### 3. Configure Environment

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your configuration
vim .env.local
```

Required variables:
```bash
VITE_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com
```

---

## Deployment

### Deploy Backend

```bash
cd cdk

# Build TypeScript
npm run build

# Preview changes (optional)
cdk diff

# Deploy
cdk deploy

# Or deploy with auto-approval
cdk deploy --require-approval never
```

**Deployment time:** 5-10 minutes

### Deploy Frontend

```bash
# Build frontend
npm run build

# Get bucket name from CDK outputs
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

# Upload to S3
aws s3 sync dist/ s3://$BUCKET/

# Get CloudFront distribution ID
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*"
```

**Deployment time:** 2-3 minutes + 5-10 minutes for CloudFront invalidation

---

## Verification

### 1. Check Stack Status

```bash
aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].StackStatus"
```

Should return: `"UPDATE_COMPLETE"` or `"CREATE_COMPLETE"`

### 2. Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].Outputs" \
  --output table
```

Key outputs:
- `HttpApiUrl` - API Gateway endpoint
- `FrontendUrl` - CloudFront URL
- `UserPoolId` - Cognito user pool ID
- `UserPoolClientId` - Cognito client ID

### 3. Test API

```bash
# Get API URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
  --output text)

# Test health endpoint
curl $API_URL/api/health
```

### 4. Test Frontend

```bash
# Get frontend URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text)

# Open in browser
open $FRONTEND_URL
```

### 5. Run Verification Script

```bash
bash cdk/verify-single-backend.sh
```

---

## Updates

### Update Backend

```bash
cd cdk

# Make changes to Lambda functions or stack definition

# Build
npm run build

# Preview changes
cdk diff

# Deploy
cdk deploy
```

### Update Frontend

```bash
# Make changes to src/

# Build
npm run build

# Deploy
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

aws s3 sync dist/ s3://$BUCKET/

# Invalidate cache
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*"
```

### Update Single Lambda

```bash
cd cdk

# Update Lambda code in lambda-functions/

# Build
npm run build

# Deploy (CDK will only update changed resources)
cdk deploy
```

---

## Monitoring

### CloudWatch Logs

```bash
# List log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/EnergyInsights-development

# Tail specific Lambda logs
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow

# Tail API Gateway logs
aws logs tail /aws/apigateway/EnergyInsights-development-http-api --follow
```

### Lambda Metrics

```bash
# Get Lambda function metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=EnergyInsights-development-chat \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### API Gateway Metrics

```bash
# Get API metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiId,Value=hbt1j807qf \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

---

## Rollback

### Rollback Stack

```bash
cd cdk

# Rollback to previous version
aws cloudformation rollback-stack \
  --stack-name EnergyInsights-development

# Or destroy and redeploy
cdk destroy
cdk deploy
```

### Rollback Frontend

```bash
# List previous versions
aws s3api list-object-versions \
  --bucket energyinsights-development-frontend-development \
  --prefix index.html

# Restore specific version
aws s3api copy-object \
  --bucket energyinsights-development-frontend-development \
  --copy-source energyinsights-development-frontend-development/index.html?versionId=VERSION_ID \
  --key index.html
```

---

## Cleanup

### Delete Stack

```bash
cd cdk

# Delete stack (keeps S3 buckets by default)
cdk destroy

# Confirm deletion
# Type 'y' when prompted
```

### Delete S3 Buckets

```bash
# Empty and delete storage bucket
aws s3 rm s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy --recursive
aws s3 rb s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy

# Empty and delete frontend bucket
aws s3 rm s3://energyinsights-development-frontend-development --recursive
aws s3 rb s3://energyinsights-development-frontend-development
```

---

## Troubleshooting

### Deployment Fails

```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name EnergyInsights-development \
  --max-items 20

# Check specific resource
aws cloudformation describe-stack-resource \
  --stack-name EnergyInsights-development \
  --logical-resource-id ChatLambda
```

### Lambda Function Errors

```bash
# Check function configuration
aws lambda get-function-configuration \
  --function-name EnergyInsights-development-chat

# Check environment variables
aws lambda get-function-configuration \
  --function-name EnergyInsights-development-chat \
  --query "Environment.Variables"

# Test function
aws lambda invoke \
  --function-name EnergyInsights-development-chat \
  --payload '{"message":"test"}' \
  response.json

cat response.json
```

### API Gateway Issues

```bash
# Check API configuration
aws apigatewayv2 get-api --api-id hbt1j807qf

# Check routes
aws apigatewayv2 get-routes --api-id hbt1j807qf

# Check authorizer
aws apigatewayv2 get-authorizers --api-id hbt1j807qf
```

### CloudFront Issues

```bash
# Check distribution status
aws cloudfront get-distribution --id E3O1QDG49S3NGP

# Check invalidation status
aws cloudfront list-invalidations --distribution-id E3O1QDG49S3NGP
```

---

## Best Practices

### 1. Use CDK Context

```bash
# Set context values
cdk deploy --context environment=production

# In code:
const env = this.node.tryGetContext('environment');
```

### 2. Tag Resources

```typescript
// In CDK stack
Tags.of(this).add('Environment', 'development');
Tags.of(this).add('Project', 'EnergyInsights');
Tags.of(this).add('ManagedBy', 'CDK');
```

### 3. Use Outputs

```typescript
// Export values for other stacks or scripts
new CfnOutput(this, 'ApiUrl', {
  value: httpApi.url!,
  exportName: 'EnergyInsights-development-ApiUrl',
});
```

### 4. Enable Versioning

```typescript
// Enable Lambda versioning
const version = lambda.currentVersion;
const alias = new lambda.Alias(this, 'Alias', {
  aliasName: 'live',
  version,
});
```

### 5. Monitor Costs

```bash
# Check estimated costs
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://filter.json
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy CDK

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm install
          cd cdk && npm install
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy CDK
        run: |
          cd cdk
          npm run build
          cdk deploy --require-approval never
      
      - name: Deploy Frontend
        run: |
          npm run build
          aws s3 sync dist/ s3://energyinsights-development-frontend-development/
          aws cloudfront create-invalidation --distribution-id E3O1QDG49S3NGP --paths "/*"
```

---

## Additional Resources

- **AWS CDK Documentation:** https://docs.aws.amazon.com/cdk/
- **CDK API Reference:** https://docs.aws.amazon.com/cdk/api/v2/
- **CDK Examples:** https://github.com/aws-samples/aws-cdk-examples
- **CloudFormation Documentation:** https://docs.aws.amazon.com/cloudformation/

---

**Last Updated:** November 16, 2025
