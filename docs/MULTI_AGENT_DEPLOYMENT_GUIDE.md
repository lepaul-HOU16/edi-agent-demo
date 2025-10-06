# Multi-Agent System Deployment Guide

This guide will help you deploy the complete multi-agent wind farm development system to AWS AgentCore.

## Overview

The deployment includes:
1. **Lambda Function** - Containerized MCP tools for wind data retrieval
2. **AgentCore Gateway** - MCP gateway for tool access with JWT authentication
3. **AgentCore Runtime** - Strands Agent for wind farm development workflows

## Prerequisites

### Required Tools
- Python 3.12+
- Docker Desktop (running)
- AWS CLI configured with credentials
- boto3 Python package

### AWS Permissions Required
- Lambda (create/update functions)
- ECR (create repositories, push images)
- IAM (create roles and policies)
- Bedrock AgentCore (create gateways and runtimes)
- Cognito (create user pools)
- Secrets Manager (store credentials)
- Parameter Store (store configuration)

### Check Prerequisites

```bash
# Check Docker is running
docker ps

# Check AWS credentials
aws sts get-caller-identity

# Check Python version
python3 --version

# Install required Python packages
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
pip install -r requirements.txt
```

## Deployment Options

### Option 1: Complete Automated Deployment (Recommended)

This script deploys everything in one go:

```bash
# Make script executable
chmod +x scripts/deploy-complete-system.py

# Run deployment
python3 scripts/deploy-complete-system.py
```

**What it does:**
- Builds and pushes Lambda Docker image
- Creates Lambda function with MCP tools
- Sets up Cognito authentication
- Creates AgentCore Gateway
- Connects Lambda to Gateway
- Builds and pushes Runtime Docker image
- Creates AgentCore Runtime with Strands Agent
- Stores all configuration in Parameter Store

**Expected time:** 10-15 minutes

### Option 2: Step-by-Step Deployment

If you want more control, use the simplified script:

```bash
python3 scripts/deploy-multi-agent-simple.py
```

This deploys Gateway + Lambda only (no Runtime).

### Option 3: Manual Jupyter Notebook

Follow the original tutorial:

```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
jupyter notebook lab3_agentcore_tutorial.ipynb
```

## Deployment Steps Explained

### Step 1: Lambda Function Deployment

The script:
1. Builds Docker image from `agent_core/02_host_local_tools_to_lambda_gateway/`
2. Pushes to ECR repository `agentcore-gateway-lambda-container`
3. Creates Lambda function `agentcore-gateway-lambda`
4. Configures with 1024MB memory, 900s timeout, ARM64 architecture

**Tools included:**
- `get_wind_conditions` - Fetches wind data from NREL API

### Step 2: AgentCore Gateway

The script:
1. Creates IAM role for gateway with Lambda invoke permissions
2. Sets up Cognito user pool for JWT authentication
3. Creates AgentCore Gateway named `layout-tool`
4. Creates gateway target `wind-data-tools` pointing to Lambda
5. Stores gateway URL in Parameter Store: `/nrel-mcp/gateway-url`

### Step 3: AgentCore Runtime

The script:
1. Creates IAM role for runtime with Bedrock permissions
2. Builds Docker image from `agent_core/03_host_agent_to_runtime/`
3. Pushes to ECR repository `agentcore-runtime-container`
4. Creates AgentCore Runtime named `wind_farm_dev_agent`
5. Stores runtime ARN in Parameter Store: `/nrel-mcp/runtime-arn`

## Verification

### Check Deployment Status

```bash
# List all AgentCore resources
aws bedrock-agentcore-control list-gateways
aws bedrock-agentcore-control list-agent-runtimes

# Check Lambda function
aws lambda get-function --function-name agentcore-gateway-lambda

# Check Parameter Store
aws ssm get-parameter --name /nrel-mcp/gateway-url
aws ssm get-parameter --name /nrel-mcp/runtime-arn
```

### Test Gateway

```python
from mcp.client.streamable_http import streamablehttp_client
from strands.tools.mcp.mcp_client import MCPClient
import boto3

# Get gateway URL and bearer token
ssm = boto3.client('ssm')
secrets = boto3.client('secretsmanager')

gateway_url = ssm.get_parameter(Name='/nrel-mcp/gateway-url')['Parameter']['Value']
cognito_creds = secrets.get_secret_value(SecretId='workshop/cognito/credentials')
bearer_token = json.loads(cognito_creds['SecretString'])['bearer_token']

# Create MCP client
def create_transport():
    return streamablehttp_client(
        gateway_url,
        headers={"Authorization": f"Bearer {bearer_token}"}
    )

client = MCPClient(create_transport)

# List tools
with client:
    tools = client.list_tools_sync()
    print(f"Available tools: {[t.tool_name for t in tools]}")
    
    # Test tool call
    result = client.call_tool_sync(
        tool_use_id="test",
        name='wind-data-tools___get_wind_conditions',
        arguments={"latitude": 30.25, "longitude": -97.74}
    )
    print(f"Result: {result}")
```

### Test Runtime

```python
import boto3

agentcore = boto3.client('bedrock-agentcore')
ssm = boto3.client('ssm')

runtime_arn = ssm.get_parameter(Name='/nrel-mcp/runtime-arn')['Parameter']['Value']

# Invoke agent
response = agentcore.invoke_agent_runtime(
    agentRuntimeArn=runtime_arn,
    inputText="Analyze wind conditions for Austin, TX"
)

print(response)
```

## Troubleshooting

### Docker Build Fails

```bash
# Check Docker is running
docker ps

# Check disk space
docker system df

# Clean up old images
docker system prune -a
```

### IAM Role Issues

```bash
# Wait for role propagation (can take up to 60 seconds)
sleep 60

# Check role exists
aws iam get-role --role-name agentcore-gateway-role
aws iam get-role --role-name agentcore-runtime-role
```

### Gateway Creation Fails

```bash
# Check if gateway already exists
aws bedrock-agentcore-control list-gateways

# Delete existing gateway if needed
aws bedrock-agentcore-control delete-gateway --gateway-identifier <gateway-id>
```

### Lambda Function Fails

```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/agentcore-gateway-lambda --follow

# Check function configuration
aws lambda get-function-configuration --function-name agentcore-gateway-lambda
```

### Runtime Deployment Fails

```bash
# Check CloudWatch logs
aws logs tail /aws/bedrock-agentcore/runtimes/wind_farm_dev_agent --follow

# Check runtime status
aws bedrock-agentcore-control get-agent-runtime --agent-runtime-identifier <runtime-id>
```

## Configuration

### Stored Configuration

After deployment, configuration is stored in:

1. **Parameter Store:**
   - `/nrel-mcp/gateway-url` - Gateway endpoint URL
   - `/nrel-mcp/runtime-arn` - Runtime ARN

2. **Secrets Manager:**
   - `workshop/cognito/credentials` - Cognito user pool details and bearer token

### Updating Configuration

To update the bearer token (expires after 1 hour):

```python
import boto3
import json

cognito = boto3.client('cognito-idp')
secrets = boto3.client('secretsmanager')

# Get existing config
response = secrets.get_secret_value(SecretId='workshop/cognito/credentials')
config = json.loads(response['SecretString'])

# Re-authenticate
auth_response = cognito.initiate_auth(
    ClientId=config['client_id'],
    AuthFlow='USER_PASSWORD_AUTH',
    AuthParameters={
        'USERNAME': 'testuser',
        'PASSWORD': 'MyPassword123!'
    }
)

# Update token
config['bearer_token'] = auth_response['AuthenticationResult']['AccessToken']
secrets.update_secret(
    SecretId='workshop/cognito/credentials',
    SecretString=json.dumps(config)
)
```

## Cleanup

To remove all deployed resources:

```bash
# Delete Lambda function
aws lambda delete-function --function-name agentcore-gateway-lambda

# Delete Gateway
GATEWAY_ID=$(aws bedrock-agentcore-control list-gateways --query 'items[?name==`layout-tool`].gatewayId' --output text)
aws bedrock-agentcore-control delete-gateway --gateway-identifier $GATEWAY_ID

# Delete Runtime
RUNTIME_ID=$(aws bedrock-agentcore-control list-agent-runtimes --query 'items[?agentRuntimeName==`wind_farm_dev_agent`].agentRuntimeId' --output text)
aws bedrock-agentcore-control delete-agent-runtime --agent-runtime-identifier $RUNTIME_ID

# Delete ECR repositories
aws ecr delete-repository --repository-name agentcore-gateway-lambda-container --force
aws ecr delete-repository --repository-name agentcore-runtime-container --force

# Delete IAM roles
aws iam delete-role-policy --role-name agentcore-gateway-role --policy-name AgentCorePolicy
aws iam delete-role --role-name agentcore-gateway-role

aws iam delete-role-policy --role-name agentcore-runtime-role --policy-name AgentCorePolicy
aws iam delete-role --role-name agentcore-runtime-role

aws iam detach-role-policy --role-name agentcore-gateway-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name agentcore-gateway-lambda-role

# Delete Cognito user pool
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 --query 'UserPools[?Name==`WorkshopUserPool`].Id' --output text)
aws cognito-idp delete-user-pool --user-pool-id $USER_POOL_ID

# Delete Parameter Store parameters
aws ssm delete-parameter --name /nrel-mcp/gateway-url
aws ssm delete-parameter --name /nrel-mcp/runtime-arn

# Delete Secrets Manager secret
aws secretsmanager delete-secret --secret-id workshop/cognito/credentials --force-delete-without-recovery
```

## Next Steps

After successful deployment:

1. **Integrate with your application** - Use the gateway URL and runtime ARN in your Next.js app
2. **Test multi-agent workflows** - Run the complete wind farm development workflow
3. **Monitor performance** - Check CloudWatch logs and metrics
4. **Scale as needed** - Adjust Lambda memory and runtime configuration

## Support

For issues or questions:
- Check CloudWatch logs for detailed error messages
- Review the Jupyter notebook tutorial for step-by-step guidance
- Consult AWS Bedrock AgentCore documentation
- Check the workshop README in `agentic-ai-for-renewable-site-design-mainline/workshop-assets/`
