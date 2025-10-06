# Renewable Backend Deployment Guide

## Overview

This guide explains how to deploy the renewable energy demo backend to AWS Bedrock AgentCore under the EDI Platform's AWS account.

## Prerequisites

- AWS CLI configured with EDI Platform credentials
- Access to AWS Bedrock in us-west-2 region
- Python 3.10+ with `uv` package manager installed
- Access to EDI Platform's Cognito user pool
- Permissions to create AgentCore resources

## Deployment Steps

### Step 1: Configure AWS Credentials

```bash
# Set AWS profile to EDI Platform account
export AWS_PROFILE=edi-platform
export AWS_REGION=us-west-2

# Verify credentials
aws sts get-caller-identity
```

### Step 2: Configure S3 Storage

Create or use existing S3 bucket for renewable assets:

```bash
# Option 1: Use existing EDI Platform bucket
export S3_BUCKET_NAME="edi-platform-renewable-assets"

# Option 2: Create new bucket
aws s3 mb s3://edi-platform-renewable-assets --region us-west-2

# Set SSM parameters for the demo
aws ssm put-parameter \
  --name "/wind-farm-assistant/s3-bucket-name" \
  --value "$S3_BUCKET_NAME" \
  --type "String" \
  --overwrite

aws ssm put-parameter \
  --name "/wind-farm-assistant/use-s3-storage" \
  --value "true" \
  --type "String" \
  --overwrite
```

### Step 3: Deploy Agents to AgentCore

Navigate to the workshop assets directory:

```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
```

#### Option A: Using Jupyter Notebooks (Recommended)

The demo provides Jupyter notebooks for deployment:

1. **Deploy MCP Server**:
   ```bash
   jupyter notebook agent_core/01_host_mcp_to_runtime/01_host_mcp_to_runtime.ipynb
   ```
   - Follow the notebook to deploy `MCP_Server/wind_farm_mcp_server.py`
   - Note the MCP server endpoint URL

2. **Deploy Individual Agents**:
   ```bash
   jupyter notebook agent_core/01_host_agent_to_runtime/01_host_agent_to_runtime.ipynb
   ```
   - Deploy terrain_agent.py
   - Deploy layout_agent.py
   - Deploy simulation_agent.py
   - Deploy report_agent.py
   - Note each agent's endpoint URL

3. **Deploy Multi-Agent System**:
   ```bash
   jupyter notebook agent_core/03_host_agent_to_runtime/03_host_agent_to_runtime.ipynb
   ```
   - Deploy the multi-agent orchestration
   - Note the main AgentCore endpoint URL

#### Option B: Using AgentCore CLI

If you prefer CLI deployment:

```bash
# Install AgentCore CLI
pip install bedrock-agentcore-cli

# Deploy MCP server
agentcore deploy \
  --name wind-farm-mcp-server \
  --runtime python3.11 \
  --handler MCP_Server/wind_farm_mcp_server.py \
  --region us-west-2

# Deploy multi-agent system
agentcore deploy \
  --name renewable-multi-agent \
  --runtime python3.11 \
  --handler agents/multi_agent.py \
  --region us-west-2
```

### Step 4: Configure Cognito Integration

Update the AgentCore deployment to use EDI Platform's Cognito:

```bash
# Get EDI Platform Cognito User Pool ID
export COGNITO_USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 | jq -r '.UserPools[] | select(.Name | contains("EDI")) | .Id')

# Update AgentCore configuration
agentcore update \
  --name renewable-multi-agent \
  --auth-type cognito \
  --cognito-user-pool-id $COGNITO_USER_POOL_ID
```

### Step 5: Test Deployment

Test the deployed backend:

```bash
# Get AgentCore endpoint
export AGENTCORE_ENDPOINT=$(agentcore describe --name renewable-multi-agent | jq -r '.endpoint')

# Test invocation
agentcore invoke \
  --endpoint $AGENTCORE_ENDPOINT \
  --payload '{"prompt": "Analyze terrain for wind farm at 35.067482, -101.395466 with project_id test123"}'
```

Expected response should include:
- Terrain analysis results
- Folium map HTML
- Exclusion zones data
- Suitability score

### Step 6: Document Configuration

Save the configuration for frontend integration:

```bash
# Create configuration file
cat > renewable-backend-config.json <<EOF
{
  "agentCoreEndpoint": "$AGENTCORE_ENDPOINT",
  "s3Bucket": "$S3_BUCKET_NAME",
  "region": "$AWS_REGION",
  "cognitoUserPoolId": "$COGNITO_USER_POOL_ID",
  "deploymentDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "Configuration saved to renewable-backend-config.json"
echo "Add this to your .env.local:"
echo "NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=$AGENTCORE_ENDPOINT"
echo "NEXT_PUBLIC_RENEWABLE_S3_BUCKET=$S3_BUCKET_NAME"
echo "NEXT_PUBLIC_RENEWABLE_ENABLED=true"
```

## Verification Checklist

- [ ] AWS credentials configured for EDI Platform account
- [ ] S3 bucket created and SSM parameters set
- [ ] MCP server deployed to AgentCore
- [ ] All agents deployed to AgentCore
- [ ] Multi-agent system deployed
- [ ] Cognito integration configured
- [ ] Test invocation successful
- [ ] Configuration documented
- [ ] AgentCore endpoint URL saved

## Troubleshooting

### Issue: AgentCore deployment fails

**Solution**: Check IAM permissions for AgentCore service role:
```bash
aws iam get-role --role-name AgentCoreExecutionRole
```

### Issue: Agents can't access S3

**Solution**: Verify S3 bucket policy allows AgentCore access:
```bash
aws s3api get-bucket-policy --bucket $S3_BUCKET_NAME
```

### Issue: Cognito authentication fails

**Solution**: Verify Cognito user pool configuration:
```bash
aws cognito-idp describe-user-pool --user-pool-id $COGNITO_USER_POOL_ID
```

### Issue: MCP server not accessible

**Solution**: Check MCP server logs:
```bash
agentcore logs --name wind-farm-mcp-server --tail 100
```

## Cost Considerations

- **AgentCore Runtime**: Pay per invocation
- **Bedrock Models**: Claude 3.7 Sonnet pricing
- **S3 Storage**: Standard storage rates
- **Data Transfer**: Minimal for typical usage

Estimated cost: $10-50/month for moderate usage (100-500 queries/month)

## Security Best Practices

1. **Use IAM Roles**: Don't hardcode credentials
2. **Enable CloudTrail**: Log all AgentCore invocations
3. **Encrypt S3**: Enable server-side encryption
4. **Restrict Access**: Use Cognito for authentication
5. **Monitor Usage**: Set up CloudWatch alarms

## Next Steps

After successful deployment:

1. Update `.env.local` with AgentCore endpoint
2. Proceed to Task 2: Remove incorrectly converted TypeScript files
3. Implement integration layer (Tasks 3-10)
4. Test end-to-end flow (Task 12)

## Support

For issues with:
- **AgentCore**: Check AWS Bedrock AgentCore documentation
- **Demo Code**: Refer to `agentic-ai-for-renewable-site-design-mainline/workshop-assets/README.md`
- **Integration**: See `.kiro/specs/renewable-energy-integration/design.md`
