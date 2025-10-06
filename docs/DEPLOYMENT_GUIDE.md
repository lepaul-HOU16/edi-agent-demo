# Renewable Energy Backend - Deployment Guide

## 🎯 Objective

Deploy the renewable energy multi-agent system to AWS Bedrock AgentCore and connect it to the EDI Platform frontend.

**Estimated Time**: 30-60 minutes

---

## ✅ Prerequisites (Already Complete)

- ✅ AWS credentials configured (Account: 484907533441)
- ✅ Bedrock access confirmed (14 Claude models available)
- ✅ Workshop directory exists with virtual environment
- ✅ Frontend integration code complete

---

## 📋 Deployment Steps

### Step 1: Start Jupyter Notebook

Open a terminal and run:

```bash
cd /Users/lepaul/Dev/prototypes/edi-agent-demo/agentic-ai-for-renewable-site-design-mainline/workshop-assets

# Activate virtual environment
source .venv/bin/activate

# Start Jupyter
jupyter notebook
```

This will open Jupyter in your browser.

### Step 2: Deploy Multi-Agent System

In Jupyter, navigate to and open:

```
agent_core/03_host_agent_to_runtime/03_host_agent_to_runtime.ipynb
```

**Run all cells in the notebook**. The notebook will:

1. **Build Docker Image**
   - Packages all agents (terrain, layout, simulation, report)
   - Includes all Python dependencies
   - Creates AgentCore-compatible image

2. **Push to ECR**
   - Uploads image to AWS Elastic Container Registry
   - Tags image appropriately

3. **Create AgentCore Runtime**
   - Deploys the multi-agent system
   - Configures IAM roles
   - Sets up CloudWatch logging

4. **Return Endpoint ARN**
   - The final cell will output the AgentCore endpoint ARN
   - **COPY THIS ARN** - you'll need it for the next step

**Expected Output**:
```
✅ Agent deployed successfully!
Agent ARN: arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/renewable-multi-agent-XXXXXXXXXX
```

### Step 3: Configure Frontend

Once you have the endpoint ARN, run:

```bash
python3 scripts/configure-renewable-frontend.py <your-endpoint-arn>
```

**Example**:
```bash
python3 scripts/configure-renewable-frontend.py arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/renewable-multi-agent-abc123
```

This script will:
- Create `.env.local` with your configuration
- Test the backend endpoint
- Verify it's responding correctly

**Expected Output**:
```
✅ Created .env.local
✅ Backend is responding!
   Status: 200
   Response: 1234 characters
   Artifacts: 1 found

🚀 Next steps:
   1. Start the frontend: npm run dev
   2. Navigate to chat
   3. Try a renewable energy query
```

### Step 4: Test End-to-End

Start the frontend:

```bash
npm run dev
```

Navigate to: `http://localhost:3000/chat`

Try these test queries:

1. **Terrain Analysis**:
   ```
   Analyze terrain for wind farm at 35.067482, -101.395466
   ```
   
   **Expected**: Interactive map with terrain analysis, suitability score, exclusion zones

2. **Layout Design**:
   ```
   Create a 30MW wind farm layout at those coordinates
   ```
   
   **Expected**: Map with turbine positions, capacity metrics

3. **Performance Simulation**:
   ```
   Simulate wake effects for this layout
   ```
   
   **Expected**: Performance charts, AEP calculations, wake analysis

---

## 🔍 Troubleshooting

### Issue: Jupyter notebook fails to start

**Solution**:
```bash
# Reinstall Jupyter
pip install --upgrade jupyter notebook

# Or use JupyterLab
pip install jupyterlab
jupyter lab
```

### Issue: Docker build fails in notebook

**Possible Causes**:
- Docker not running
- Insufficient disk space
- Network issues

**Solution**:
```bash
# Check Docker
docker ps

# Clean up old images
docker system prune -a

# Retry the notebook cell
```

### Issue: ECR push fails

**Possible Causes**:
- AWS credentials expired
- Insufficient IAM permissions

**Solution**:
```bash
# Refresh AWS credentials
aws sts get-caller-identity

# Check ECR permissions
aws ecr describe-repositories
```

### Issue: AgentCore runtime fails to start

**Check CloudWatch Logs**:
```bash
# Find log group
aws logs describe-log-groups --log-group-name-prefix /aws/bedrock/agentcore

# Tail logs
aws logs tail /aws/bedrock/agentcore/renewable-multi-agent --follow
```

**Common Issues**:
- Missing Python dependencies → Check requirements.txt
- Import errors → Verify all agent files are included
- IAM permissions → Check runtime role has Bedrock access

### Issue: Frontend test fails

**Check Configuration**:
```bash
# Verify .env.local exists
cat .env.local

# Test backend directly
python3 scripts/test-renewable-integration.py
```

**Common Issues**:
- Wrong endpoint ARN → Double-check the ARN from notebook
- Backend not ready → Wait 1-2 minutes after deployment
- Network issues → Check AWS connectivity

---

## 📊 Verification Checklist

### Backend Deployment

- [ ] Jupyter notebook ran without errors
- [ ] Docker image built successfully
- [ ] Image pushed to ECR
- [ ] AgentCore runtime created
- [ ] Endpoint ARN obtained
- [ ] CloudWatch logs show successful initialization

### Frontend Configuration

- [ ] `.env.local` file created
- [ ] `NEXT_PUBLIC_RENEWABLE_ENABLED=true`
- [ ] Endpoint ARN configured correctly
- [ ] Backend test passed
- [ ] Frontend starts without errors

### End-to-End Testing

- [ ] Terrain analysis query works
- [ ] Map displays in UI
- [ ] Metrics show correctly
- [ ] Layout query works
- [ ] Simulation query works
- [ ] All artifacts render properly

---

## 🎓 What the Notebook Does

### Cell-by-Cell Breakdown

**Cell 1-3: Setup**
- Import libraries
- Configure AWS clients
- Set region and model ID

**Cell 4-6: Build Docker Image**
- Create Dockerfile
- Build image with all agents
- Tag image for ECR

**Cell 7-9: Push to ECR**
- Authenticate with ECR
- Create repository if needed
- Push image

**Cell 10-12: Create IAM Role**
- Create execution role
- Attach policies (Bedrock, S3, CloudWatch)
- Configure trust relationship

**Cell 13-15: Deploy to AgentCore**
- Create AgentCore runtime
- Configure environment variables
- Set up logging

**Cell 16: Get Endpoint**
- Retrieve runtime ARN
- Display endpoint information
- Provide test command

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Start Jupyter
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
source .venv/bin/activate
jupyter notebook

# 2. Run notebook
# Open: agent_core/03_host_agent_to_runtime/03_host_agent_to_runtime.ipynb
# Run all cells
# Copy the endpoint ARN

# 3. Configure frontend
python3 scripts/configure-renewable-frontend.py <endpoint-arn>

# 4. Test
npm run dev
# Navigate to chat
# Try: "Analyze terrain for wind farm at 35.067482, -101.395466"
```

---

## 📞 Support

### AWS Documentation
- [Bedrock AgentCore Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore.html)
- [AgentCore Deployment](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore-deploy.html)

### Demo Resources
- Workshop README: `agentic-ai-for-renewable-site-design-mainline/workshop-assets/README.md`
- Agent documentation: `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agents/`

### Logs and Monitoring
- CloudWatch Logs: `/aws/bedrock/agentcore/renewable-multi-agent`
- ECR Repository: `bedrock-agentcore-renewable-multi-agent`
- CodeBuild: `bedrock-agentcore-renewable-multi-agent-builder`

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ Jupyter notebook completes without errors
2. ✅ You have an AgentCore endpoint ARN
3. ✅ Frontend configuration test passes
4. ✅ Chat query returns terrain analysis
5. ✅ Interactive map displays in UI
6. ✅ Metrics and artifacts render correctly

---

**Ready to deploy?** Start with Step 1 above! 🚀
