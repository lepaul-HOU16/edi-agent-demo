# Quick Start - Simplified Deployment

## Prerequisites Check

Before deploying, make sure you have:

### 1. Docker Desktop Running

```bash
docker ps
```

Should show a table (even if empty). If not, start Docker Desktop.

### 2. AWS CLI Configured

```bash
aws sts get-caller-identity
```

Should show your AWS account info.

### 3. Python 3 with boto3

```bash
python3 -c "import boto3; print('✅ boto3 installed')"
```

If this fails, install boto3:

```bash
python3 -m pip install boto3 --user
```

## Deploy Now

Once prerequisites are met:

```bash
./scripts/quick-deploy.sh
```

## If Script Fails

Run the Python deployment directly:

```bash
python3 scripts/deploy-complete-system.py
```

## What Gets Deployed

- **Lambda Function** - Built in Docker, no local Python packages needed
- **AgentCore Gateway** - AWS managed service
- **AgentCore Runtime** - Built in Docker, no local Python packages needed

**Note:** The deployment scripts only need `boto3` locally. All other packages (mcp, strands-agents, etc.) are installed inside the Docker containers during the build process.

## Troubleshooting

### Docker not running
```bash
open -a Docker  # macOS
# Wait 30-60 seconds, then verify:
docker ps
```

### AWS not configured
```bash
aws configure
# Enter your credentials
```

### boto3 not installed
```bash
python3 -m pip install boto3 --user
```

### Deployment fails
Check the error message and:
1. Verify Docker is running
2. Check AWS credentials are valid
3. Ensure you have necessary AWS permissions
4. Check CloudWatch logs for details

## Next Steps

After successful deployment:

```bash
# Verify deployment
aws bedrock-agentcore-control list-gateways
aws bedrock-agentcore-control list-agent-runtimes

# Get configuration
aws ssm get-parameter --name /nrel-mcp/gateway-url
aws ssm get-parameter --name /nrel-mcp/runtime-arn
```

See `docs/DEPLOYMENT_READY.md` for testing and integration instructions.
