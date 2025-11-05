# AgentCore Deployment Checklist

## Quick Reference

**Agent ID**: `QUQKELPKM2`  
**Agent Alias ID**: `S5YWIUZOGB`  
**Status**: ✅ Agent Created and Prepared

## Deployment Steps

### ✅ Step 1: AWS Console Setup (COMPLETED)
- [x] Created Bedrock Agent
- [x] Created Agent Alias
- [x] Prepared Agent

### ✅ Step 2: Code Updates (COMPLETED)
- [x] Updated `amplify/backend.ts` with environment variables
- [x] Updated `enhancedStrandsAgent.ts` to use BedrockAgentRuntimeClient
- [x] Added IAM permissions for Bedrock Agent Runtime
- [x] Added Lambda invoke permissions
- [x] Created integration test script
- [x] **FIXED**: Added `bedrock:InvokeAgent` permission (was missing)

### ✅ Step 3: Deploy Backend (COMPLETED)
```bash
npx ampx sandbox
```
**Status**: Deployed and running

### ✅ Step 3.5: Fix Permissions (COMPLETED)
```bash
./scripts/fix-bedrock-agent-permissions.sh
```
**Status**: Permission `bedrock:InvokeAgent` added successfully

### ⏳ Step 4: Verify Lambda Deployment
```bash
aws lambda list-functions --query "Functions[?contains(FunctionName, 'petrophysicsCalculator')].{Name:FunctionName,Arn:FunctionArn}" --output table
```
**Copy the Lambda ARN**

### ⏳ Step 5: Configure Action Group

#### Option A: AWS Console (Recommended)
1. Go to Bedrock → Agents → A4E-Petrophysics-agent-e9a
2. Add action group: `petrophysics-tools`
3. Link Lambda function
4. Add 5 actions:
   - calculate_porosity
   - calculate_shale_volume
   - calculate_saturation
   - list_wells
   - get_well_info
5. Click "Prepare"

#### Option B: AWS CLI
```bash
LAMBDA_ARN="<paste-arn-from-step-4>"

aws bedrock-agent create-agent-action-group \
  --agent-id QUQKELPKM2 \
  --agent-version DRAFT \
  --action-group-name petrophysics-tools \
  --action-group-executor lambda="$LAMBDA_ARN" \
  --description "Petrophysical calculation tools" \
  --action-group-state ENABLED

aws bedrock-agent prepare-agent --agent-id QUQKELPKM2
```

### ⏳ Step 6: Test Integration
```bash
node tests/test-agentcore-integration.js
```
**Expected**: JSON response with porosity data

### ⏳ Step 7: Test in UI
1. `npm run dev`
2. Navigate to chat
3. Send: "calculate porosity for well-001"
4. **Expected**: Cloudscape visualization renders

## Quick Troubleshooting

### Agent says "I don't have enough information"
→ Action group not configured. Go to Step 5.

### Lambda not found
→ Backend not deployed. Go to Step 3.

### Permission denied
```bash
LAMBDA_ARN=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'petrophysicsCalculator')].FunctionArn" --output text)

aws lambda add-permission \
  --function-name "$LAMBDA_ARN" \
  --statement-id bedrock-agent-invoke \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn "arn:aws:bedrock:us-east-1:ACCOUNT:agent/QUQKELPKM2"
```

## Success Criteria

- [ ] Lambda function deployed
- [ ] Action group configured
- [ ] Integration test passes
- [ ] UI shows porosity results
- [ ] Cloudscape visualization renders
- [ ] No errors in logs

## Current Status

**Last Updated**: 2025-03-05

**Completed**:
- ✅ Agent created in AWS
- ✅ Code updated for AgentCore
- ✅ Integration test created
- ✅ API connectivity verified

**Next Action**:
→ Deploy backend with `npx ampx sandbox`

## Files Modified

1. `amplify/backend.ts` - Added environment variables and permissions
2. `amplify/functions/agents/enhancedStrandsAgent.ts` - Updated to use BedrockAgentRuntimeClient
3. `tests/test-agentcore-integration.js` - Created integration test
4. `docs/AGENTCORE_DEPLOYMENT_GUIDE.md` - Created deployment guide

## Ready to Deploy!

Run this command to start deployment:
```bash
npx ampx sandbox
```

Then follow steps 4-7 in this checklist.
