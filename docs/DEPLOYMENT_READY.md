# Multi-Agent System Deployment - Ready to Deploy

## Quick Start

I've created everything you need to deploy the full multi-agent system from the Jupyter notebook. Here's how to get started:

### Option 1: One-Command Deployment (Easiest)

```bash
./scripts/quick-deploy.sh
```

This script will:
1. ✅ Check all prerequisites (Docker, AWS CLI, Python, packages)
2. ✅ Prompt you to confirm deployment
3. ✅ Deploy everything automatically
4. ✅ Show you the results

### Option 2: Direct Python Deployment

```bash
python3 scripts/deploy-complete-system.py
```

This deploys everything without the prerequisite checks.

### Option 3: Gateway + Lambda Only

```bash
python3 scripts/deploy-multi-agent-simple.py
```

This deploys just the Gateway and Lambda (no Runtime).

## What Gets Deployed

### 1. Lambda Function (`agentcore-gateway-lambda`)
- **Purpose:** Hosts MCP tools for wind data retrieval
- **Tools:** `get_wind_conditions` - Fetches wind data from NREL API
- **Configuration:** 1024MB memory, 900s timeout, ARM64
- **Location:** ECR repository `agentcore-gateway-lambda-container`

### 2. AgentCore Gateway (`layout-tool`)
- **Purpose:** MCP gateway for tool access
- **Authentication:** JWT via Cognito user pool
- **Target:** `wind-data-tools` pointing to Lambda
- **URL:** Stored in Parameter Store `/nrel-mcp/gateway-url`

### 3. AgentCore Runtime (`wind_farm_dev_agent`)
- **Purpose:** Hosts Strands Agent for wind farm workflows
- **Agent:** Multi-agent system with terrain, layout, simulation, and reporting agents
- **Configuration:** Public network mode, HTTP protocol
- **ARN:** Stored in Parameter Store `/nrel-mcp/runtime-arn`

## Prerequisites

Before running, make sure you have:

- ✅ Docker Desktop running
- ✅ AWS CLI configured with credentials
- ✅ Python 3.12+
- ✅ Required Python packages (script will install if missing)
- ✅ AWS permissions for Lambda, ECR, IAM, Bedrock AgentCore, Cognito

## Deployment Time

- **Total time:** 10-15 minutes
- **Lambda deployment:** 3-5 minutes (Docker build + push)
- **Gateway setup:** 2-3 minutes (Cognito + Gateway creation)
- **Runtime deployment:** 5-7 minutes (Docker build + push + Runtime creation)

## What Happens During Deployment

### Step 1: Lambda Function
```
📦 Building Docker image from agent_core/02_host_local_tools_to_lambda_gateway/
⬆️  Pushing to ECR: agentcore-gateway-lambda-container
🚀 Creating Lambda function: agentcore-gateway-lambda
✅ Lambda ARN: arn:aws:lambda:us-east-1:ACCOUNT:function:agentcore-gateway-lambda
```

### Step 2: AgentCore Gateway
```
🔐 Creating IAM role: agentcore-gateway-role
🔐 Setting up Cognito user pool: WorkshopUserPool
🚀 Creating gateway: layout-tool
🔗 Creating gateway target: wind-data-tools
✅ Gateway URL: https://layout-tool-XXXXX.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp
```

### Step 3: AgentCore Runtime
```
🔐 Creating IAM role: agentcore-runtime-role
📦 Building Docker image from agent_core/03_host_agent_to_runtime/
⬆️  Pushing to ECR: agentcore-runtime-container
🤖 Creating agent runtime: wind_farm_dev_agent
✅ Runtime ARN: arn:aws:bedrock-agentcore:us-east-1:ACCOUNT:agent-runtime/XXXXX
```

## After Deployment

### Verify Deployment

```bash
# Check all resources
aws bedrock-agentcore-control list-gateways
aws bedrock-agentcore-control list-agent-runtimes
aws lambda list-functions --query 'Functions[?FunctionName==`agentcore-gateway-lambda`]'

# Get configuration
aws ssm get-parameter --name /nrel-mcp/gateway-url
aws ssm get-parameter --name /nrel-mcp/runtime-arn
```

### Test Gateway

```python
from mcp.client.streamable_http import streamablehttp_client
from strands.tools.mcp.mcp_client import MCPClient
import boto3
import json

# Get credentials
ssm = boto3.client('ssm')
secrets = boto3.client('secretsmanager')

gateway_url = ssm.get_parameter(Name='/nrel-mcp/gateway-url')['Parameter']['Value']
creds = json.loads(secrets.get_secret_value(SecretId='workshop/cognito/credentials')['SecretString'])

# Test
def create_transport():
    return streamablehttp_client(
        gateway_url,
        headers={"Authorization": f"Bearer {creds['bearer_token']}"}
    )

client = MCPClient(create_transport)
with client:
    tools = client.list_tools_sync()
    print(f"Available tools: {[t.tool_name for t in tools]}")
```

### Test Runtime

```python
import boto3

agentcore = boto3.client('bedrock-agentcore')
ssm = boto3.client('ssm')

runtime_arn = ssm.get_parameter(Name='/nrel-mcp/runtime-arn')['Parameter']['Value']

response = agentcore.invoke_agent_runtime(
    agentRuntimeArn=runtime_arn,
    inputText="Analyze wind conditions for Austin, TX at coordinates 30.25, -97.74"
)

print(response)
```

## Troubleshooting

### Docker Not Running
```bash
# Start Docker Desktop, then verify
docker ps
```

### AWS Credentials Not Configured
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### Python Packages Missing
```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
pip install -r requirements.txt
```

### Deployment Fails
1. Check CloudWatch logs for detailed errors
2. Verify IAM permissions
3. Check Docker has enough disk space
4. Wait 60 seconds for IAM role propagation

### Gateway Test Fails
- Bearer token expires after 1 hour
- Re-run deployment to refresh token
- Or manually refresh using Cognito API

## Files Created

### Deployment Scripts
- `scripts/quick-deploy.sh` - One-command deployment with checks
- `scripts/deploy-complete-system.py` - Complete deployment (Lambda + Gateway + Runtime)
- `scripts/deploy-multi-agent-simple.py` - Simplified deployment (Gateway + Lambda only)

### Documentation
- `docs/MULTI_AGENT_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `docs/DEPLOYMENT_READY.md` - This file (quick start)

### Existing Resources Used
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agent_core/utils.py` - Utility functions
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agent_core/02_host_local_tools_to_lambda_gateway/` - Lambda source
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agent_core/03_host_agent_to_runtime/` - Runtime source

## Next Steps

1. **Run the deployment:**
   ```bash
   ./scripts/quick-deploy.sh
   ```

2. **Verify it worked:**
   ```bash
   aws bedrock-agentcore-control list-gateways
   aws bedrock-agentcore-control list-agent-runtimes
   ```

3. **Test the system:**
   - Use the test scripts above
   - Check CloudWatch logs
   - Monitor metrics

4. **Integrate with your app:**
   - Use gateway URL for MCP tool access
   - Use runtime ARN for agent invocation
   - Update your Next.js app to use these endpoints

## Support

For detailed information, see:
- `docs/MULTI_AGENT_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/lab3_agentcore_tutorial.ipynb` - Original tutorial
- CloudWatch logs for debugging

## Cleanup

To remove everything:
```bash
# See cleanup section in docs/MULTI_AGENT_DEPLOYMENT_GUIDE.md
```

---

**Ready to deploy? Run:**
```bash
./scripts/quick-deploy.sh
```
