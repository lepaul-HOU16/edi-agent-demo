# ✅ Jupyter is Ready - All Dependencies Installed!

## All Set!

I've installed all required dependencies including:
- ✅ boto3 (AWS SDK)
- ✅ strands-agents (Agent framework)
- ✅ bedrock-agentcore (AgentCore SDK)
- ✅ All other requirements

## Run the Notebook Now

### In Your Terminal (workshop-assets directory):

```bash
source .venv-new/bin/activate
jupyter notebook lab3_agentcore_tutorial.ipynb
```

This will open Jupyter in your browser.

## What to Do in Jupyter

### Step 1: Run Cell 1 (Import boto3)
- Click the first cell
- Press `Shift + Enter`
- Should complete without errors now!

### Step 2: Run Cell 2 (Import utilities)
- Press `Shift + Enter` again
- Should see: "✅ Utility functions imported successfully"

### Step 3: Continue Through the Notebook
- Keep pressing `Shift + Enter` to run each cell
- Read the output of each cell
- Wait for each cell to complete before running the next

### Important Cells to Watch:

1. **Cognito Setup** - Creates user pool
2. **Docker Build** - Takes 5-10 minutes
3. **ECR Push** - Takes 3-5 minutes
4. **AgentCore Runtime Creation** - Takes 5-10 minutes
5. **Endpoint Output** - **SAVE THIS URL!**

## Save the Endpoint URL

When you see output like:
```
✅ AgentCore Runtime Created!
Runtime ID: wind-farm-abc123
Endpoint: arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/wind-farm-abc123
```

**Copy that entire ARN!**

## After Deployment

### Step 1: Update .env.local

Back in the main project directory:

```bash
# Edit .env.local
nano .env.local

# Find this line:
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/wind_farm_layout_agent-7DnHlIBg3o

# Replace with your new endpoint:
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/wind-farm-abc123

# Save (Ctrl+X, Y, Enter)
```

### Step 2: Redeploy

```bash
# Redeploy Amplify backend
npx ampx sandbox --once

# Start dev server
npm run dev
```

### Step 3: Test with Real Data!

```
Open: http://localhost:3000/chat
Query: "Analyze terrain for wind farm at 35.067482, -101.395466"
```

You should now see **REAL DATA** instead of mock data!

## Expected Timeline

- **Cognito Setup**: 2-3 minutes
- **Docker Build**: 5-10 minutes
- **ECR Push**: 3-5 minutes
- **Runtime Creation**: 5-10 minutes
- **Testing**: 2-3 minutes
- **Total**: 20-30 minutes

## Troubleshooting

### If a cell fails:

1. **Check AWS credentials**:
   ```bash
   aws sts get-caller-identity
   ```

2. **Check Docker is running**:
   ```bash
   docker ps
   ```

3. **Check Bedrock access**:
   - You may need to request Bedrock AgentCore preview access
   - Contact AWS Support if needed

### If Docker build is slow:

- This is normal! Docker builds can take 10+ minutes
- Be patient and let it complete
- Don't interrupt the process

### If you see "Preview access required":

- AgentCore is a preview service
- You may need to request access through AWS Support
- Alternative: Continue using mock data

## Alternative: Skip AgentCore

If you don't want to wait or don't have AgentCore access:

**Your system already works with mock data!**

You can:
- ✅ Test all features
- ✅ Develop and iterate
- ✅ Validate the integration
- ⚠️  Data is placeholder

Deploy AgentCore later when ready.

## Current Status

✅ **Amplify Backend**: Deployed  
✅ **S3 Bucket**: Created  
✅ **SSM Parameters**: Configured  
✅ **Jupyter**: Installed  
✅ **Dependencies**: Installed  
✅ **Ready**: To deploy AgentCore  

## Run Now

```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
source .venv-new/bin/activate
jupyter notebook lab3_agentcore_tutorial.ipynb
```

**Or test with mock data:**

```bash
cd ../../  # Back to main directory
npm run dev
# Open http://localhost:3000/chat
```

---

**You're all set!** Choose your path:
1. Deploy AgentCore now (~30 min) for real data
2. Test with mock data now (~2 min) and deploy later

🚀

