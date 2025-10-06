# Run AgentCore Deployment - Quick Guide

## ✅ Jupyter is Now Installed!

I've installed Jupyter in a new virtual environment (`.venv-new`).

## Run the Notebook

### Step 1: Activate Virtual Environment

```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
source .venv-new/bin/activate
```

### Step 2: Start Jupyter Notebook

```bash
jupyter notebook lab3_agentcore_tutorial.ipynb
```

This will:
1. Open your browser automatically
2. Load the AgentCore deployment notebook
3. Show you the deployment cells

### Step 3: Run the Notebook

In the Jupyter interface:

1. **Run Cell 1**: Import libraries
   - Click the cell
   - Press `Shift + Enter` or click "Run"

2. **Run Cell 2**: Import utility functions
   - Should see: "✅ Utility functions imported successfully"

3. **Continue running each cell sequentially**
   - Each cell builds on the previous one
   - Wait for each cell to complete before running the next

4. **Watch for the AgentCore endpoint URL**
   - Near the end of the notebook
   - Will look like: `arn:aws:bedrock-agentcore:us-east-1:...:runtime/...`
   - **SAVE THIS URL!**

### Step 4: Save the Endpoint URL

When you see output like:
```
AgentCore Runtime Created!
Endpoint: arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/wind-farm-abc123
```

**Copy that endpoint URL!**

### Step 5: Update Configuration

Back in your terminal (in the main project directory):

```bash
# Edit .env.local
nano .env.local

# Update this line:
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=<paste-your-new-endpoint-url>

# Save and exit (Ctrl+X, Y, Enter)
```

### Step 6: Redeploy

```bash
# Redeploy Amplify backend with new endpoint
npx ampx sandbox --once

# Start dev server
npm run dev

# Test with real data!
# Open http://localhost:3000/chat
# Try: "Analyze terrain for wind farm at 35.067482, -101.395466"
```

## Alternative: Skip AgentCore for Now

If you don't want to deploy AgentCore right now, that's fine!

**The system is already working with mock data.**

You can:
- ✅ Test all UI components
- ✅ Validate the integration
- ✅ Develop features
- ⚠️  Data is placeholder

Deploy AgentCore later when you're ready.

## Troubleshooting

### If Jupyter doesn't open automatically:

Look for output like:
```
http://localhost:8888/?token=abc123...
```

Copy that URL and paste it in your browser.

### If cells fail:

- Check AWS credentials: `aws sts get-caller-identity`
- Check Docker is running: `docker ps`
- Check you have Bedrock access

### If deployment takes too long:

AgentCore deployment can take 15-30 minutes due to:
- Docker image builds
- ECR pushes
- Runtime creation

Be patient and let it complete.

## What the Notebook Does

1. **Imports**: Loads AWS SDK and utilities
2. **Setup Cognito**: Creates user pool for authentication
3. **Build Docker Image**: Packages Python agents
4. **Push to ECR**: Uploads image to AWS
5. **Create Runtime**: Deploys to AgentCore
6. **Test**: Validates deployment
7. **Output**: Returns endpoint URL

## Expected Timeline

- **Setup**: 2-3 minutes
- **Docker Build**: 5-10 minutes
- **ECR Push**: 3-5 minutes
- **Runtime Creation**: 5-10 minutes
- **Testing**: 2-3 minutes
- **Total**: 20-30 minutes

## Current Status

✅ **Amplify Backend**: Deployed  
✅ **S3 Bucket**: Created  
✅ **SSM Parameters**: Configured  
✅ **Jupyter**: Installed  
⏳ **AgentCore**: Ready to deploy  

## Next Action

```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
source .venv-new/bin/activate
jupyter notebook lab3_agentcore_tutorial.ipynb
```

**Or skip for now and use mock data!**

---

**Questions?** See [DEPLOYMENT_COMPLETE.md](../../DEPLOYMENT_COMPLETE.md)

