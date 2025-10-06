# Multi-Agent System Deployment - Complete Package

## 🚀 Quick Start

Deploy the complete multi-agent wind farm development system with one command:

```bash
./scripts/quick-deploy.sh
```

**Time:** 10-15 minutes | **Difficulty:** Easy | **Prerequisites:** Docker, AWS CLI, Python 3.12+

---

## 📦 What's Included

This package contains everything you need to deploy the multi-agent system from the Jupyter notebook tutorial to AWS AgentCore.

### Deployment Scripts (Choose One)

| Script | Description | Use Case |
|--------|-------------|----------|
| `scripts/quick-deploy.sh` | ⭐ **Recommended** - Interactive with checks | First-time deployment |
| `scripts/deploy-complete-system.py` | Complete automation | CI/CD pipelines |
| `scripts/deploy-multi-agent-simple.py` | Gateway + Lambda only | Quick testing |

### Documentation

| Document | Purpose |
|----------|---------|
| `DEPLOY_NOW.md` | One-page quick reference |
| `docs/DEPLOYMENT_READY.md` | Quick start guide |
| `docs/MULTI_AGENT_DEPLOYMENT_GUIDE.md` | Comprehensive guide |
| `docs/DEPLOYMENT_SUMMARY.md` | Architecture overview |
| `docs/WHAT_I_BUILT_FOR_YOU.md` | Complete summary |

---

## 🎯 What Gets Deployed

```
AWS Cloud
├── Lambda Function (agentcore-gateway-lambda)
│   └── MCP Tool: get_wind_conditions
│
├── AgentCore Gateway (layout-tool)
│   ├── JWT Authentication (Cognito)
│   └── Gateway Target: wind-data-tools
│
└── AgentCore Runtime (wind_farm_dev_agent)
    └── Multi-Agent System
        ├── Terrain Agent
        ├── Layout Agent
        ├── Simulation Agent
        └── Report Agent
```

**Configuration Storage:**
- Parameter Store: `/nrel-mcp/gateway-url`
- Parameter Store: `/nrel-mcp/runtime-arn`
- Secrets Manager: `workshop/cognito/credentials`

---

## 📖 Documentation Guide

### Start Here
1. **`DEPLOY_NOW.md`** - Quick reference card (1 page)
2. **`docs/DEPLOYMENT_READY.md`** - Quick start guide (5 min read)

### Deep Dive
3. **`docs/MULTI_AGENT_DEPLOYMENT_GUIDE.md`** - Complete guide (15 min read)
4. **`docs/DEPLOYMENT_SUMMARY.md`** - Architecture details (10 min read)

### Reference
5. **`docs/WHAT_I_BUILT_FOR_YOU.md`** - Complete summary of everything

---

## 🔧 Usage

### Deploy

```bash
# Option 1: Interactive (recommended)
./scripts/quick-deploy.sh

# Option 2: Direct
python3 scripts/deploy-complete-system.py

# Option 3: Gateway + Lambda only
python3 scripts/deploy-multi-agent-simple.py
```

### Verify

```bash
# List resources
aws bedrock-agentcore-control list-gateways
aws bedrock-agentcore-control list-agent-runtimes

# Get configuration
aws ssm get-parameter --name /nrel-mcp/gateway-url
aws ssm get-parameter --name /nrel-mcp/runtime-arn
```

### Test

```python
# Test Gateway
from mcp.client.streamable_http import streamablehttp_client
from strands.tools.mcp.mcp_client import MCPClient
import boto3, json

ssm = boto3.client('ssm')
secrets = boto3.client('secretsmanager')

gateway_url = ssm.get_parameter(Name='/nrel-mcp/gateway-url')['Parameter']['Value']
creds = json.loads(secrets.get_secret_value(SecretId='workshop/cognito/credentials')['SecretString'])

def create_transport():
    return streamablehttp_client(gateway_url, headers={"Authorization": f"Bearer {creds['bearer_token']}"})

client = MCPClient(create_transport)
with client:
    tools = client.list_tools_sync()
    print(f"Tools: {[t.tool_name for t in tools]}")
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Docker not running | Start Docker Desktop: `docker ps` |
| AWS not configured | Run: `aws configure` |
| Python packages missing | Run: `pip install -r requirements.txt` |
| IAM role delay | Wait 60 seconds and retry |
| Bearer token expired | Re-run deployment |

### Check Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/agentcore-gateway-lambda --follow

# Runtime logs
aws logs tail /aws/bedrock-agentcore/runtimes/wind_farm_dev_agent --follow
```

---

## 🧹 Cleanup

```bash
# Quick cleanup
aws lambda delete-function --function-name agentcore-gateway-lambda

GATEWAY_ID=$(aws bedrock-agentcore-control list-gateways --query 'items[?name==`layout-tool`].gatewayId' --output text)
aws bedrock-agentcore-control delete-gateway --gateway-identifier $GATEWAY_ID

RUNTIME_ID=$(aws bedrock-agentcore-control list-agent-runtimes --query 'items[?agentRuntimeName==`wind_farm_dev_agent`].agentRuntimeId' --output text)
aws bedrock-agentcore-control delete-agent-runtime --agent-runtime-identifier $RUNTIME_ID
```

See `docs/MULTI_AGENT_DEPLOYMENT_GUIDE.md` for complete cleanup instructions.

---

## 📚 Additional Resources

### Original Tutorial
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/lab3_agentcore_tutorial.ipynb`

### Source Code
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agent_core/utils.py`
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agent_core/02_host_local_tools_to_lambda_gateway/`
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agent_core/03_host_agent_to_runtime/`

### AWS Documentation
- [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Strands Agents](https://github.com/awslabs/strands-agents)

---

## ✅ Prerequisites

Before deploying, ensure you have:

- ✅ **Docker Desktop** - Running and accessible
- ✅ **AWS CLI** - Configured with credentials (`aws configure`)
- ✅ **Python 3.12+** - Installed and in PATH
- ✅ **AWS Permissions** - Lambda, ECR, IAM, Bedrock AgentCore, Cognito

The `quick-deploy.sh` script will check all prerequisites automatically.

---

## 🎯 Next Steps

1. **Deploy:** Run `./scripts/quick-deploy.sh`
2. **Verify:** Check resources are created
3. **Test:** Run test scripts
4. **Integrate:** Use in your Next.js app
5. **Monitor:** Check CloudWatch logs

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section in `docs/MULTI_AGENT_DEPLOYMENT_GUIDE.md`
- Review CloudWatch logs for detailed errors
- Consult the original Jupyter notebook tutorial
- Check AWS Bedrock AgentCore documentation

---

## 🎉 Ready to Deploy?

```bash
./scripts/quick-deploy.sh
```

**That's it!** The script will handle everything and show you the results.

Good luck! 🚀

---

## 📋 File Structure

```
.
├── DEPLOY_NOW.md                          # Quick reference card
├── README_DEPLOYMENT.md                   # This file
│
├── scripts/
│   ├── quick-deploy.sh                    # Interactive deployment
│   ├── deploy-complete-system.py          # Complete automation
│   └── deploy-multi-agent-simple.py       # Simplified deployment
│
└── docs/
    ├── DEPLOYMENT_READY.md                # Quick start guide
    ├── MULTI_AGENT_DEPLOYMENT_GUIDE.md    # Comprehensive guide
    ├── DEPLOYMENT_SUMMARY.md              # Architecture overview
    └── WHAT_I_BUILT_FOR_YOU.md           # Complete summary
```

---

**Version:** 1.0  
**Last Updated:** 2025-10-03  
**Status:** Ready for deployment ✅
