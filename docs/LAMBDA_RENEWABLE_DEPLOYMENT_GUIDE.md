# Lambda-Based Renewable Energy Solution - Deployment Guide

## Overview

This guide walks you through deploying the Lambda-based interim renewable energy solution that works TODAY without waiting for AWS Bedrock AgentCore GA.

## Architecture

```
User Query → Orchestrator Lambda → Tool Lambdas → Real Renewable Demo Code → Results
```

**Key Components**:
1. **Lambda Layer**: Contains all renewable demo Python code
2. **Tool Lambdas**: Terrain, Layout, Simulation, Report (Python)
3. **Orchestrator Lambda**: Routes queries and aggregates results (TypeScript)
4. **Frontend Integration**: Existing EDI Platform UI

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm
- Python 3.12
- Access to deploy Lambda functions and layers

## Step-by-Step Deployment

### Step 1: Build and Publish Lambda Layer

The Lambda layer contains all the renewable demo Python code and dependencies.

```bash
# Navigate to layer directory
cd amplify/layers/renewableDemo

# Build the layer (installs dependencies and creates zip)
./build.sh

# This will create: renewable-demo-layer.zip (~200-300MB)
```

**Publish to AWS Lambda**:

```bash
aws lambda publish-layer-version \
  --layer-name renewable-demo-code \
  --description 'Renewable energy demo Python code and dependencies' \
  --zip-file fileb://renewable-demo-layer.zip \
  --compatible-runtimes python3.12 \
  --compatible-architectures x86_64
```

**Save the Layer ARN** from the output:
```json
{
  "LayerVersionArn": "arn:aws:lambda:us-west-2:123456789012:layer:renewable-demo-code:1",
  ...
}
```

### Step 2: Configure Environment Variables

Create or update `.env.local` in the project root:

```bash
# Renewable Energy Configuration
RENEWABLE_DEMO_LAYER_ARN=arn:aws:lambda:REGION:ACCOUNT:layer:renewable-demo-code:VERSION
RENEWABLE_S3_BUCKET=your-renewable-assets-bucket
AWS_REGION=us-west-2

# Enable renewable features
NEXT_PUBLIC_RENEWABLE_ENABLED=true
```

**Create S3 Bucket** (if it doesn't exist):

```bash
aws s3 mb s3://your-renewable-assets-bucket --region us-west-2
```

#### NREL API Key Configuration

**CRITICAL**: The simulation and terrain tools require a valid NREL API key to fetch real wind data from the NREL Wind Toolkit API. **NO SYNTHETIC DATA** is used.

The NREL API key is configured directly in `amplify/backend.ts`:

```typescript
// Add NREL API key to simulation and terrain tool Lambdas for real wind data integration
// CRITICAL: This is required for NREL Wind Toolkit API access (NO SYNTHETIC DATA)
const nrelApiKey = 'Fkh6pFT1SPsn9SBw8TDMSl7EnjEe';
backend.renewableSimulationTool.addEnvironment('NREL_API_KEY', nrelApiKey);
backend.renewableTerrainTool.addEnvironment('NREL_API_KEY', nrelApiKey);
```

**To get your own NREL API key** (optional, for production use):

1. Visit: https://developer.nrel.gov/signup/
2. Sign up for a free API key
3. Replace the key in `amplify/backend.ts`
4. Redeploy: `npx ampx sandbox`

**API Key Features**:
- Free tier: 1,000 requests per hour
- No credit card required
- Instant activation
- Access to NREL Wind Toolkit (2007-2023 data)

**Important Notes**:
- The provided API key is for development/demo purposes
- For production deployments, obtain your own API key
- The key is set as an environment variable in Lambda functions
- If the API key is invalid or missing, wind data requests will fail with clear error messages
- **NO SYNTHETIC DATA FALLBACK** - Real NREL data only

### Step 3: Update Amplify Backend Configuration

Edit `amplify/backend.ts` to register all Lambda functions:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

// Import renewable Lambda functions
import { renewableOrchestrator } from './functions/renewableOrchestrator/resource';
import { renewableTerrainTool } from './functions/renewableTools/terrain/resource';
import { renewableLayoutTool } from './functions/renewableTools/layout/resource';
import { renewableSimulationTool } from './functions/renewableTools/simulation/resource';
import { renewableReportTool } from './functions/renewableTools/report/resource';

import { aws_iam as iam } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  // Renewable energy functions
  renewableOrchestrator,
  renewableTerrainTool,
  renewableLayoutTool,
  renewableSimulationTool,
  renewableReportTool
});

// Grant orchestrator permission to invoke tool Lambdas
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      backend.renewableTerrainTool.resources.lambda.functionArn,
      backend.renewableLayoutTool.resources.lambda.functionArn,
      backend.renewableSimulationTool.resources.lambda.functionArn,
      backend.renewableReportTool.resources.lambda.functionArn
    ]
  })
);

// Grant tool Lambdas permission to access S3
[
  backend.renewableTerrainTool,
  backend.renewableLayoutTool,
  backend.renewableSimulationTool,
  backend.renewableReportTool
].forEach(toolLambda => {
  toolLambda.resources.lambda.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
      resources: [
        `arn:aws:s3:::${process.env.RENEWABLE_S3_BUCKET}`,
        `arn:aws:s3:::${process.env.RENEWABLE_S3_BUCKET}/*`
      ]
    })
  );
});

// Pass tool Lambda function names to orchestrator
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
  backend.renewableTerrainTool.resources.lambda.functionName
);
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
  backend.renewableLayoutTool.resources.lambda.functionName
);
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
  backend.renewableSimulationTool.resources.lambda.functionName
);
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_REPORT_TOOL_FUNCTION_NAME',
  backend.renewableReportTool.resources.lambda.functionName
);
```

### Step 4: Deploy Lambda Functions

Deploy all Lambda functions using Amplify sandbox:

```bash
# From project root
npx ampx sandbox --stream-function-logs
```

This will:
- Deploy all 5 Lambda functions (orchestrator + 4 tools)
- Configure IAM permissions
- Set up environment variables
- Stream logs for debugging

**Verify Deployment**:

```bash
# List deployed functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `renewable`)].FunctionName'
```

You should see:
- `renewableOrchestrator`
- `renewableTerrainTool`
- `renewableLayoutTool`
- `renewableSimulationTool`
- `renewableReportTool`

### Step 5: Update Frontend Configuration

The frontend integration is already in place from the previous AgentCore implementation. We just need to point it to the Lambda orchestrator.

Update `src/services/renewable-integration/config.ts`:

```typescript
export function getRenewableConfig(): RenewableConfig {
  return {
    enabled: process.env.NEXT_PUBLIC_RENEWABLE_ENABLED === 'true',
    // Lambda orchestrator endpoint (will be set after deployment)
    endpoint: process.env.NEXT_PUBLIC_RENEWABLE_LAMBDA_ENDPOINT || '',
    s3Bucket: process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET || '',
    region: process.env.AWS_REGION || 'us-west-2'
  };
}
```

**Get the Orchestrator Function URL**:

```bash
# Get the function ARN
aws lambda get-function --function-name renewableOrchestrator \
  --query 'Configuration.FunctionArn' --output text
```

Add to `.env.local`:
```bash
NEXT_PUBLIC_RENEWABLE_LAMBDA_ENDPOINT=<orchestrator-function-arn>
```

### Step 6: Test the Deployment

#### Test Individual Tool Lambdas

**Test Terrain Analysis**:

```bash
aws lambda invoke \
  --function-name renewableTerrainTool \
  --payload '{"query":"Analyze terrain at 35.067482, -101.395466","parameters":{"latitude":35.067482,"longitude":-101.395466,"project_id":"test-001"}}' \
  response.json

cat response.json | jq .
```

**Test Layout Optimization**:

```bash
aws lambda invoke \
  --function-name renewableLayoutTool \
  --payload '{"query":"Create 10 turbine layout","parameters":{"center_lat":35.067482,"center_lon":-101.395466,"num_turbines":10,"project_id":"test-001"}}' \
  response.json

cat response.json | jq .
```

#### Test Orchestrator

```bash
aws lambda invoke \
  --function-name renewableOrchestrator \
  --payload '{"query":"Analyze terrain for wind farm at 35.067482, -101.395466","userId":"test-user","sessionId":"test-session"}' \
  response.json

cat response.json | jq .
```

#### Test in Chat UI

1. Open the EDI Platform chat interface
2. Type a renewable query:
   - "Analyze terrain for wind farm at 35.067482, -101.395466"
   - "Create a 30MW wind farm layout at those coordinates"
   - "Run wake simulation for the layout"
   - "Generate executive report"

3. Verify:
   - Query is detected as renewable
   - Orchestrator is invoked
   - Tool Lambda executes
   - Results display in chat
   - Artifacts render correctly

### Step 7: Monitor and Debug

#### CloudWatch Logs

View logs for each Lambda:

```bash
# Orchestrator logs
aws logs tail /aws/lambda/renewableOrchestrator --follow

# Tool Lambda logs
aws logs tail /aws/lambda/renewableTerrainTool --follow
aws logs tail /aws/lambda/renewableLayoutTool --follow
aws logs tail /aws/lambda/renewableSimulationTool --follow
aws logs tail /aws/lambda/renewableReportTool --follow
```

#### Common Issues

**Issue**: Lambda timeout
- **Solution**: Increase timeout in resource.ts (currently 60-90s)

**Issue**: Layer not found
- **Solution**: Verify RENEWABLE_DEMO_LAYER_ARN is set correctly

**Issue**: Permission denied for S3
- **Solution**: Check IAM policies in backend.ts

**Issue**: Tool Lambda not found
- **Solution**: Verify function names are passed to orchestrator

## Cost Estimation

### Lambda Costs (1000 queries/month)

| Component | Invocations | Duration | Memory | Cost |
|-----------|-------------|----------|--------|------|
| Orchestrator | 1000 | 5s | 512MB | ~$0.50 |
| Terrain Tool | 300 | 30s | 1024MB | ~$5.00 |
| Layout Tool | 300 | 30s | 1024MB | ~$5.00 |
| Simulation Tool | 200 | 60s | 2048MB | ~$8.00 |
| Report Tool | 200 | 10s | 512MB | ~$1.00 |
| **Total** | | | | **~$19.50** |

### S3 Storage Costs

- Storage: ~$0.50/month (for maps, reports)
- Requests: ~$0.10/month

### Total Monthly Cost: ~$20-25

## Rollback Plan

If issues occur:

1. **Disable renewable routing** in agent router:
   ```typescript
   const RENEWABLE_ENABLED = false; // Temporarily disable
   ```

2. **Revert to previous version**:
   ```bash
   git revert HEAD
   npx ampx sandbox
   ```

3. **Delete Lambda functions** (if needed):
   ```bash
   aws lambda delete-function --function-name renewableOrchestrator
   aws lambda delete-function --function-name renewableTerrainTool
   # ... etc
   ```

## Migration to AgentCore (Future)

When AgentCore becomes GA:

1. Deploy AgentCore backend using demo's script
2. Update `NEXT_PUBLIC_RENEWABLE_LAMBDA_ENDPOINT` to AgentCore endpoint
3. Keep Lambda functions as backup
4. Monitor AgentCore performance
5. Deprecate Lambda implementation after validation

## Troubleshooting

### Lambda Layer Issues

**Problem**: Dependencies not found
```
ModuleNotFoundError: No module named 'pandas'
```

**Solution**:
1. Rebuild layer: `cd amplify/layers/renewableDemo && ./build.sh`
2. Republish layer
3. Update RENEWABLE_DEMO_LAYER_ARN
4. Redeploy Lambdas

### Orchestrator Issues

**Problem**: Tool Lambda not invoked
```
Error: Function name not configured
```

**Solution**:
1. Check environment variables in backend.ts
2. Verify function names are passed correctly
3. Redeploy with `npx ampx sandbox`

### Tool Lambda Issues

**Problem**: Timeout during execution
```
Task timed out after 60.00 seconds
```

**Solution**:
1. Increase timeout in resource.ts
2. Optimize Python code (if custom modifications)
3. Check external API availability (NREL, USGS)

## Next Steps

After successful deployment:

1. **Test all workflows** with real queries
2. **Monitor performance** and costs
3. **Gather user feedback**
4. **Optimize** based on usage patterns
5. **Plan migration** to AgentCore when available

## Support

For issues or questions:
- Check CloudWatch logs
- Review this deployment guide
- Consult `docs/LAMBDA_INTERIM_IMPLEMENTATION_STATUS.md`
- Test individual components in isolation

## Summary

You now have a fully functional Lambda-based renewable energy solution that:
- ✅ Works TODAY without AgentCore
- ✅ Uses REAL renewable demo code
- ✅ Provides terrain analysis, layout optimization, simulation, and reporting
- ✅ Costs ~$20-25/month
- ✅ Has a clear migration path to AgentCore

**Congratulations! Your renewable energy analysis is live!** 🎉
