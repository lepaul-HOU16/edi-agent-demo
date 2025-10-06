# Renewable Energy Integration Configuration Guide

## Overview

This guide explains how to configure the renewable energy integration for the EDI Platform. The integration connects the EDI Platform frontend to a Python-based renewable energy backend deployed on AWS Bedrock AgentCore.

## Environment Variables

### Required Variables (when enabled)

#### `NEXT_PUBLIC_RENEWABLE_ENABLED`
- **Type**: Boolean (`true` or `false`)
- **Default**: `false`
- **Description**: Master switch to enable/disable renewable energy features
- **Example**: `NEXT_PUBLIC_RENEWABLE_ENABLED=true`

#### `NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT`
- **Type**: String (URL)
- **Required**: Yes (when enabled)
- **Description**: AWS Bedrock AgentCore invoke endpoint URL for the renewable energy multi-agent system
- **How to obtain**: Deploy the renewable backend using `deploy-to-agentcore.sh` script. The endpoint URL will be displayed in the deployment output.
- **Example**: `NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=https://agentcore.us-west-2.amazonaws.com/invoke/renewable-wind-farm`

#### `NEXT_PUBLIC_RENEWABLE_S3_BUCKET`
- **Type**: String (S3 bucket name)
- **Required**: Yes (when enabled)
- **Description**: S3 bucket name for storing renewable energy artifacts (maps, layouts, simulation results, reports)
- **Must match**: The bucket configured in SSM parameter `/wind-farm-assistant/s3-bucket-name`
- **Example**: `NEXT_PUBLIC_RENEWABLE_S3_BUCKET=edi-platform-renewable-assets`

#### `NEXT_PUBLIC_RENEWABLE_AWS_REGION`
- **Type**: String (AWS region)
- **Default**: `us-west-2`
- **Description**: AWS region where AgentCore and S3 bucket are deployed
- **Example**: `NEXT_PUBLIC_RENEWABLE_AWS_REGION=us-west-2`

## Configuration Files

### 1. `.env.example`
Template file showing all available environment variables with documentation comments.

**Location**: Root directory

**Usage**: Copy to `.env.local` and fill in actual values

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

### 2. `.env.local`
Local development environment variables (not committed to git).

**Location**: Root directory

**Example**:
```bash
# Renewable Energy Configuration
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=https://agentcore.us-west-2.amazonaws.com/invoke/renewable-wind-farm
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=edi-platform-renewable-assets
NEXT_PUBLIC_RENEWABLE_AWS_REGION=us-west-2
```

### 3. `amplify/backend.ts`
Amplify backend configuration that passes environment variables to Lambda functions.

**Automatic**: Environment variables are automatically passed to Lambda functions during deployment

**IAM Permissions**: The backend configuration also sets up required IAM permissions:
- Bedrock AgentCore invoke permissions
- S3 bucket access for renewable artifacts
- SSM parameter access for configuration

## Deployment Configuration

### AWS SSM Parameters

The renewable energy backend uses AWS Systems Manager (SSM) parameters for configuration:

#### `/wind-farm-assistant/s3-bucket-name`
- **Type**: String
- **Description**: S3 bucket name for storing renewable energy artifacts
- **Must match**: `NEXT_PUBLIC_RENEWABLE_S3_BUCKET` environment variable

**Create parameter**:
```bash
aws ssm put-parameter \
  --name "/wind-farm-assistant/s3-bucket-name" \
  --value "edi-platform-renewable-assets" \
  --type "String" \
  --region us-west-2
```

#### `/wind-farm-assistant/use-s3-storage`
- **Type**: String
- **Description**: Enable S3 storage for artifacts (`true` or `false`)
- **Recommended**: `true`

**Create parameter**:
```bash
aws ssm put-parameter \
  --name "/wind-farm-assistant/use-s3-storage" \
  --value "true" \
  --type "String" \
  --region us-west-2
```

### S3 Bucket Setup

Create an S3 bucket for renewable energy artifacts:

```bash
# Create bucket
aws s3 mb s3://edi-platform-renewable-assets --region us-west-2

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning \
  --bucket edi-platform-renewable-assets \
  --versioning-configuration Status=Enabled

# Set lifecycle policy to clean up old artifacts (optional)
aws s3api put-bucket-lifecycle-configuration \
  --bucket edi-platform-renewable-assets \
  --lifecycle-configuration file://lifecycle-policy.json
```

**Example lifecycle policy** (`lifecycle-policy.json`):
```json
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
```

## Configuration Validation

### Frontend Validation

The `getRenewableConfig()` function in `src/services/renewable-integration/config.ts` validates configuration when renewable features are enabled:

```typescript
// Validates that all required fields are present
const config = getRenewableConfig();
```

**Validation errors** will be thrown if:
- `NEXT_PUBLIC_RENEWABLE_ENABLED=true` but `NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT` is empty
- `NEXT_PUBLIC_RENEWABLE_ENABLED=true` but `NEXT_PUBLIC_RENEWABLE_S3_BUCKET` is empty
- `NEXT_PUBLIC_RENEWABLE_ENABLED=true` but `NEXT_PUBLIC_RENEWABLE_AWS_REGION` is empty

### Backend Validation

The renewable proxy agent validates configuration during initialization:

```typescript
const agent = new RenewableProxyAgent();
// Throws error if configuration is invalid
```

## Testing Configuration

### 1. Check Environment Variables

```bash
# In your terminal
echo $NEXT_PUBLIC_RENEWABLE_ENABLED
echo $NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT
echo $NEXT_PUBLIC_RENEWABLE_S3_BUCKET
echo $NEXT_PUBLIC_RENEWABLE_AWS_REGION
```

### 2. Test AgentCore Connection

Use the test script to verify AgentCore endpoint is accessible:

```bash
node scripts/test-agentcore-endpoint.js
```

### 3. Test S3 Bucket Access

```bash
# List bucket contents
aws s3 ls s3://edi-platform-renewable-assets/

# Test write access
echo "test" > test.txt
aws s3 cp test.txt s3://edi-platform-renewable-assets/test.txt
aws s3 rm s3://edi-platform-renewable-assets/test.txt
rm test.txt
```

### 4. Test SSM Parameters

```bash
# Get S3 bucket parameter
aws ssm get-parameter \
  --name "/wind-farm-assistant/s3-bucket-name" \
  --region us-west-2

# Get storage flag parameter
aws ssm get-parameter \
  --name "/wind-farm-assistant/use-s3-storage" \
  --region us-west-2
```

## Environment-Specific Configuration

### Development Environment

```bash
# .env.local (development)
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=https://agentcore.us-west-2.amazonaws.com/invoke/renewable-wind-farm-dev
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=edi-platform-renewable-assets-dev
NEXT_PUBLIC_RENEWABLE_AWS_REGION=us-west-2
```

### Staging Environment

```bash
# .env.staging
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=https://agentcore.us-west-2.amazonaws.com/invoke/renewable-wind-farm-staging
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=edi-platform-renewable-assets-staging
NEXT_PUBLIC_RENEWABLE_AWS_REGION=us-west-2
```

### Production Environment

```bash
# .env.production
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=https://agentcore.us-west-2.amazonaws.com/invoke/renewable-wind-farm-prod
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=edi-platform-renewable-assets-prod
NEXT_PUBLIC_RENEWABLE_AWS_REGION=us-west-2
```

## Troubleshooting

### Configuration Not Loading

**Problem**: Environment variables not available in Lambda functions

**Solution**:
1. Verify variables are set in `.env.local`
2. Restart development server: `npm run dev`
3. For Amplify deployment, ensure variables are set in Amplify Console environment variables

### AgentCore Connection Failed

**Problem**: Cannot connect to AgentCore endpoint

**Solution**:
1. Verify endpoint URL is correct
2. Check IAM permissions for `bedrock-agentcore:InvokeAgentRuntime`
3. Verify AgentCore is deployed and running
4. Check CloudWatch logs for detailed error messages

### S3 Access Denied

**Problem**: Cannot read/write to S3 bucket

**Solution**:
1. Verify bucket name is correct
2. Check IAM permissions for S3 access
3. Verify bucket exists: `aws s3 ls s3://your-bucket-name/`
4. Check bucket policy and CORS configuration

### SSM Parameter Not Found

**Problem**: Cannot read SSM parameters

**Solution**:
1. Verify parameters exist: `aws ssm get-parameter --name "/wind-farm-assistant/s3-bucket-name"`
2. Check IAM permissions for `ssm:GetParameter`
3. Verify region matches where parameters were created

## Security Best Practices

### 1. Never Commit Secrets
- Add `.env.local` to `.gitignore`
- Use AWS Secrets Manager for sensitive values
- Rotate credentials regularly

### 2. Use IAM Roles
- Lambda functions use IAM roles (not access keys)
- Grant least privilege permissions
- Use resource-based policies where possible

### 3. Encrypt Data
- Enable S3 bucket encryption
- Use HTTPS for all API calls
- Enable CloudWatch Logs encryption

### 4. Monitor Access
- Enable CloudTrail logging
- Monitor CloudWatch metrics
- Set up alerts for unusual activity

## Configuration Checklist

Before deploying renewable energy integration:

- [ ] Set `NEXT_PUBLIC_RENEWABLE_ENABLED=true`
- [ ] Configure `NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT`
- [ ] Configure `NEXT_PUBLIC_RENEWABLE_S3_BUCKET`
- [ ] Configure `NEXT_PUBLIC_RENEWABLE_AWS_REGION`
- [ ] Create S3 bucket for artifacts
- [ ] Set SSM parameter `/wind-farm-assistant/s3-bucket-name`
- [ ] Set SSM parameter `/wind-farm-assistant/use-s3-storage`
- [ ] Verify IAM permissions for AgentCore
- [ ] Verify IAM permissions for S3
- [ ] Verify IAM permissions for SSM
- [ ] Test AgentCore connection
- [ ] Test S3 bucket access
- [ ] Test SSM parameter access
- [ ] Deploy Amplify backend with environment variables
- [ ] Verify renewable queries route correctly

## Additional Resources

- [AWS Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [Amplify Environment Variables](https://docs.amplify.aws/gen2/deploy-and-host/environment-variables/)

