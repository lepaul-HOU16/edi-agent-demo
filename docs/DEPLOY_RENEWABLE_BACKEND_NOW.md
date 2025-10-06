# Deploy Renewable Energy Backend - Quick Start

## Overview

This guide will help you deploy the renewable energy backend to AWS Bedrock AgentCore so you can start seeing real data in your application.

## Prerequisites

Before you begin, ensure you have:

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Python 3.9+ installed
- [ ] Docker installed and running
- [ ] AWS account with Bedrock access
- [ ] Appropriate IAM permissions

## Option 1: Automated Deployment (Recommended)

### Step 1: Run the Automated Script

```bash
# Run the automated deployment script
python scripts/deploy-renewable-backend-automated.py
```

This script will:
1. Check prerequisites
2. Create S3 bucket for artifacts
3. Configure SSM parameters
4. Provide instructions for AgentCore deployment

### Step 2: Complete AgentCore Deployment

The automated script will guide you to complete the AgentCore deployment manually:

```bash
# Navigate to workshop directory
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/

# Start Jupyter notebook
jupyter notebook lab3_agentcore_tutorial.ipynb
```

In the Jupyter notebook:
1. Run all cells sequentially
2. Wait for each cell to complete
3. **IMPORTANT**: Save the AgentCore endpoint URL from the final output

### Step 3: Update Configuration

Update your `.env.local` file with the endpoint URL:

```bash
# Edit .env.local
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=<your-endpoint-url-from-notebook>
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=<bucket-name-from-script>
NEXT_PUBLIC_RENEWABLE_AWS_REGION=us-west-2
```

### Step 4: Validate

```bash
# Run validation
./scripts/validate-renewable-integration.sh
```

### Step 5: Deploy EDI Platform

```bash
# Deploy Amplify backend
npx ampx sandbox

# Start development server
npm run dev
```

### Step 6: Test

Open http://localhost:3000/chat and try:

```
Analyze terrain for wind farm at 35.067482, -101.395466
```

You should now see real data populating the templates!

---

## Option 2: Manual Deployment

If you prefer to deploy manually or the automated script doesn't work:

### Step 1: Setup S3 Bucket

```bash
# Set variables
export AWS_REGION=us-west-2
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export S3_BUCKET_NAME="renewable-energy-artifacts-${AWS_ACCOUNT_ID}"

# Create bucket
aws s3 mb s3://$S3_BUCKET_NAME --region $AWS_REGION

# Configure SSM parameters
aws ssm put-parameter \
  --name "/wind-farm-assistant/s3-bucket-name" \
  --value "$S3_BUCKET_NAME" \
  --type "String" \
  --region $AWS_REGION \
  --overwrite

aws ssm put-parameter \
  --name "/wind-farm-assistant/use-s3-storage" \
  --value "true" \
  --type "String" \
  --region $AWS_REGION \
  --overwrite
```

### Step 2: Deploy to AgentCore

```bash
# Navigate to workshop directory
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/

# Install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start Jupyter
jupyter notebook lab3_agentcore_tutorial.ipynb
```

### Step 3: Run Notebook Cells

In the Jupyter notebook, run these sections:

1. **Import Libraries** - Run all import cells
2. **Host MCP Tools** - Deploy MCP server to Lambda (optional)
3. **Host Agent to Runtime** - Deploy multi-agent system to AgentCore
4. **Test Deployment** - Verify the deployment works

**CRITICAL**: Save the AgentCore endpoint URL from the output!

### Step 4: Configure EDI Platform

```bash
# Return to EDI platform directory
cd ../../

# Update .env.local
cat >> .env.local <<EOF

# Renewable Energy Configuration
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=<paste-endpoint-url-here>
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=$S3_BUCKET_NAME
NEXT_PUBLIC_RENEWABLE_AWS_REGION=$AWS_REGION
EOF
```

### Step 5: Deploy and Test

```bash
# Validate configuration
./scripts/validate-renewable-integration.sh

# Deploy Amplify backend
npx ampx sandbox

# Start development server (in another terminal)
npm run dev
```

### Step 6: Test in Browser

1. Open http://localhost:3000/chat
2. Sign in
3. Try this query:
   ```
   Analyze terrain for wind farm at 35.067482, -101.395466
   ```

---

## Troubleshooting

### Issue: "AgentCore not available in your region"

**Solution**: AgentCore is currently in preview and may not be available in all regions. Try:
- Use `us-west-2` or `us-east-1`
- Request access through AWS Support

### Issue: "Docker build failed"

**Solution**:
```bash
# Ensure Docker is running
docker ps

# If not running, start Docker Desktop
# Then try again
```

### Issue: "Permission denied" errors

**Solution**:
```bash
# Check AWS permissions
aws sts get-caller-identity

# Ensure you have:
# - bedrock:*
# - lambda:*
# - ecr:*
# - iam:CreateRole
# - s3:CreateBucket
```

### Issue: "Jupyter notebook not found"

**Solution**:
```bash
# Install Jupyter
pip install jupyter notebook

# Or use JupyterLab
pip install jupyterlab
jupyter lab
```

### Issue: "Module not found" in notebook

**Solution**:
```bash
# Ensure you're in the virtual environment
source .venv/bin/activate

# Install missing packages
pip install strands-agents boto3 pandas numpy
```

---

## What Gets Deployed

When you complete the deployment, you'll have:

1. **S3 Bucket**: Stores generated maps, layouts, and reports
2. **SSM Parameters**: Configuration for the backend
3. **Lambda Function** (optional): Hosts MCP server tools
4. **AgentCore Runtime**: Hosts the multi-agent system
5. **Docker Images**: Containerized agents in ECR

## Architecture

```
User Query
    ↓
EDI Platform (Frontend)
    ↓
Renewable Proxy Agent (Lambda)
    ↓
AgentCore Runtime (AWS Bedrock)
    ↓
Multi-Agent System (Python)
    ├── Terrain Analysis Agent
    ├── Layout Design Agent
    ├── Wake Simulation Agent
    └── Report Generation Agent
    ↓
MCP Server (Tools & Data)
    ├── NREL Wind Data
    ├── Turbine Specifications
    ├── GIS Tools
    └── Visualization Utils
    ↓
S3 Bucket (Artifacts)
```

## Expected Timeline

- **S3 Setup**: 2-3 minutes
- **Docker Build**: 5-10 minutes
- **AgentCore Deployment**: 10-15 minutes
- **Testing**: 5 minutes
- **Total**: 25-35 minutes

## Cost Estimate

Approximate AWS costs:
- **S3 Storage**: $0.023/GB/month
- **Lambda**: $0.20 per 1M requests
- **Bedrock AgentCore**: Preview pricing TBD
- **ECR**: $0.10/GB/month

Estimated monthly cost for development: **$5-20**

## Next Steps After Deployment

1. **Test All Workflows**:
   - Terrain analysis
   - Layout design
   - Wake simulation
   - Report generation

2. **Configure Production**:
   - Set up separate prod environment
   - Configure monitoring
   - Set up alerts

3. **Optimize Performance**:
   - Implement caching
   - Optimize Docker images
   - Configure auto-scaling

4. **Documentation**:
   - Document your endpoint URL
   - Share with team
   - Update runbooks

---

## Support

If you encounter issues:

1. Check the [Troubleshooting Guide](./RENEWABLE_TROUBLESHOOTING.md)
2. Review [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/)
3. Run validation: `./scripts/validate-renewable-integration.sh`
4. Check [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

---

**Ready to deploy?** Start with Option 1 (Automated Deployment) above!

