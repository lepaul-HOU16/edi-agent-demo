# AgentCore Quick Start - TL;DR

## What You Need to Do

### 1. Deploy Lambda (5 min)
```bash
npx ampx sandbox
# Wait for deployment, note the Lambda ARN
```

### 2. Create Bedrock Agent (10 min)
1. AWS Console → Bedrock → Agents → Create Agent
2. Name: `petrophysics-agent`
3. Model: Claude 3.5 Sonnet
4. Instructions: "You are a petrophysical analysis expert..."
5. Click Create

### 3. Add Action Group (10 min)
1. In Agent → Add Action Group
2. Name: `petrophysics-calculations`
3. Lambda: Select `petrophysicsCalculator`
4. API Schema: Copy from `docs/AGENTCORE_IMPLEMENTATION_GUIDE.md` (the OpenAPI YAML)
5. Click Add

### 4. Prepare Agent (2 min)
1. Click "Prepare" button
2. Wait 2-3 minutes
3. Note Agent ID and Alias ID

### 5. Update Environment Variables (2 min)
In `amplify/backend.ts`:
```typescript
backend.enhancedStrandsAgent.addEnvironment('BEDROCK_AGENT_ID', 'YOUR_AGENT_ID');
backend.enhancedStrandsAgent.addEnvironment('BEDROCK_AGENT_ALIAS_ID', 'YOUR_ALIAS_ID');
```

### 6. Add Permissions (2 min)
In `amplify/backend.ts`:
```typescript
import { aws_iam as iam } from 'aws-cdk-lib';

backend.enhancedStrandsAgent.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['bedrock:InvokeAgent', 'bedrock:InvokeModel'],
    resources: ['*']
  })
);
```

### 7. Deploy Again (5 min)
```bash
npx ampx sandbox
```

### 8. Test (2 min)
In chat: `"calculate porosity for well-001"`

## Files Already Created ✅

- ✅ `amplify/functions/petrophysicsCalculator/handler.py` - Complete Python Lambda
- ✅ `amplify/functions/petrophysicsCalculator/requirements.txt` - Dependencies
- ✅ `amplify/functions/petrophysicsCalculator/resource.ts` - Lambda definition
- ✅ `docs/AGENTCORE_IMPLEMENTATION_GUIDE.md` - Full guide with all code

## What's Missing

You need to:
1. Create the Bedrock Agent in AWS Console (can't be automated easily)
2. Add the environment variables with your Agent IDs
3. Add the IAM permissions
4. Deploy

## Total Time: ~40 minutes

## If You Get Stuck

Check `docs/AGENTCORE_IMPLEMENTATION_GUIDE.md` for detailed steps and troubleshooting.

## Alternative: Lambda-to-Lambda (Simpler)

If AgentCore seems too complex, I can implement direct Lambda-to-Lambda calls instead. It's simpler but less elegant. Let me know!
