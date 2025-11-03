# 🚀 Ready to Deploy - Quick Start

## Current Status

✅ **Frontend**: 100% Complete  
⏳ **Backend**: Ready to deploy (30-60 minutes)

---

## What You Need to Do

### 1. Open Terminal and Run:

```bash
cd /Users/lepaul/Dev/prototypes/edi-agent-demo/agentic-ai-for-renewable-site-design-mainline/workshop-assets
source .venv/bin/activate
jupyter notebook
```

### 2. In Jupyter Browser:

Navigate to and open:
```
agent_core/03_host_agent_to_runtime/03_host_agent_to_runtime.ipynb
```

Click **"Run All"** or run each cell sequentially.

### 3. Copy the Endpoint ARN

The last cell will output something like:
```
Agent ARN: arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/renewable-multi-agent-abc123
```

**Copy this entire ARN!**

### 4. Configure Frontend:

```bash
python3 scripts/configure-renewable-frontend.py <paste-your-arn-here>
```

### 5. Test It:

```bash
npm run dev
```

Go to chat and try:
```
Analyze terrain for wind farm at 35.067482, -101.395466
```

---

## That's It!

If you see an interactive map with terrain analysis, **you're done!** 🎉

---

## Need Help?

See the full guide: `docs/DEPLOYMENT_GUIDE.md`

---

## What Happens in the Notebook?

1. **Builds Docker image** with all agents (~5-10 min)
2. **Pushes to AWS ECR** (~2-3 min)
3. **Creates AgentCore runtime** (~1-2 min)
4. **Returns endpoint ARN** (copy this!)

**Total time**: 10-20 minutes for notebook + 5 minutes for configuration

---

## Quick Troubleshooting

**Notebook fails?**
- Check Docker is running: `docker ps`
- Check AWS credentials: `aws sts get-caller-identity`

**Configuration fails?**
- Double-check you copied the full ARN
- Wait 1-2 minutes after deployment

**Frontend doesn't work?**
- Check `.env.local` exists
- Restart dev server: `npm run dev`

---

**Ready? Start with Step 1 above!** 🚀
