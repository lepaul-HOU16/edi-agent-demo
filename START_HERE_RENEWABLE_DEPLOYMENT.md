# 🌱 Start Here: Deploy Renewable Energy Backend

## TL;DR

**Problem**: Templates aren't showing data because the backend isn't deployed yet.

**Solution**: Deploy the backend in ~30 minutes.

**Quick Start**:
```bash
python scripts/deploy-renewable-backend-automated.py
```

---

## What's Happening

You've built a complete renewable energy integration for the EDI Platform, but you're seeing mock data instead of real analysis. Here's why:

### Current State

```
User Query → Frontend (✅ Complete) → Mock Data (⚠️ Placeholder) → UI Components (✅ Complete)
```

### After Deployment

```
User Query → Frontend (✅) → AgentCore Backend (🎯 Deploy This) → Real Analysis → UI Components (✅)
```

---

## The Integration is Complete

Everything is built and ready:

- ✅ **Frontend**: RenewableClient, ResponseTransformer, ProxyAgent
- ✅ **UI Components**: Terrain, Layout, Simulation, Report
- ✅ **Configuration**: Environment variables, IAM permissions
- ✅ **Testing**: 15 automated tests, validation scripts
- ✅ **Documentation**: 2,400 lines, 60 pages

**What's Missing**: The Python backend that does the actual analysis.

---

## Deploy in 3 Steps

### Step 1: Run Automated Script (5 min)

```bash
python scripts/deploy-renewable-backend-automated.py
```

This creates:
- S3 bucket for artifacts
- SSM parameters for configuration
- Instructions for AgentCore deployment

### Step 2: Deploy AgentCore (20 min)

```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/
jupyter notebook lab3_agentcore_tutorial.ipynb
```

Run all cells in the notebook. **Save the endpoint URL** from the output.

### Step 3: Configure & Test (5 min)

```bash
# Update .env.local with endpoint URL
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=<your-endpoint-url>

# Validate
./scripts/validate-renewable-integration.sh

# Deploy
npx ampx sandbox
npm run dev

# Test
# Open http://localhost:3000/chat
# Try: "Analyze terrain for wind farm at 35.067482, -101.395466"
```

---

## What You'll See

### Before (Mock Data)

```
Query: "Analyze terrain for wind farm at 35.067482, -101.395466"

Response (< 1 second):
- Generic message
- Fake suitability score (always 85%)
- Placeholder map
- No real analysis

Console: ⚠️ "Using mock response"
```

### After (Real Data)

```
Query: "Analyze terrain for wind farm at 35.067482, -101.395466"

Response (10-30 seconds):
- Detailed analysis message
- Calculated suitability score (varies by location)
- Interactive map with USGS data
- Real exclusion zones
- Risk assessment metrics
- Detailed thought steps

Console: ✅ "Connected to renewable energy service"
```

---

## Detailed Guides

- **Quick Start**: [DEPLOY_RENEWABLE_BACKEND_NOW.md](./docs/DEPLOY_RENEWABLE_BACKEND_NOW.md)
- **Why No Data**: [WHY_NO_DATA_AND_HOW_TO_FIX.md](./docs/WHY_NO_DATA_AND_HOW_TO_FIX.md)
- **Current Status**: [RENEWABLE_DEPLOYMENT_STATUS.md](./docs/RENEWABLE_DEPLOYMENT_STATUS.md)
- **Full Deployment**: [RENEWABLE_DEPLOYMENT.md](./docs/RENEWABLE_DEPLOYMENT.md)

---

## Prerequisites

- [ ] AWS CLI configured (`aws configure`)
- [ ] Python 3.9+ installed
- [ ] Docker installed and running
- [ ] AWS Bedrock access
- [ ] 30 minutes of time

---

## Cost

**Development**: ~$5-15/month  
**Production**: ~$20-100/month (usage-based)

---

## Support

**Issues?** Check:
1. [Troubleshooting Guide](./docs/RENEWABLE_TROUBLESHOOTING.md)
2. [Configuration Guide](./docs/RENEWABLE_CONFIGURATION.md)
3. [Testing Guide](./docs/RENEWABLE_INTEGRATION_TESTING_GUIDE.md)

---

## Ready?

```bash
# Start deployment now
python scripts/deploy-renewable-backend-automated.py
```

**Time to real data**: ~30 minutes

