# AgentCore Deployment and Testing Guide

## Overview

This guide walks through deploying and testing the Bedrock AgentCore integration for petrophysical calculations.

## Current Status

✅ **Completed Steps:**
1. Created Bedrock Agent in AWS Console (Agent ID: `QUQKELPKM2`)
2. Created Agent Alias (Alias ID: `S5YWIUZOGB`)
3. Prepared the agent (Status: PREPARED)
4. Updated backend.ts with environment variables
5. Updated enhancedStrandsAgent.ts to use BedrockAgentRuntimeClient
6. Verified AgentCore API connectivity (test passed)

⚠️ **Remaining Steps:**
1. Deploy the backend to create petrophysicsCalculator Lambda
2. Configure action group in Bedrock Agent
3. Link Lambda function to action group
4. Prepare agent again
5. Test end-to-end

## Step-by-Step Deployment

### Step 1: Deploy Backend

The backend needs to be deployed to create the petrophysicsCalculator Lambda function.

```bash
# Stop current sandbox if running
# Press Ctrl+C

# Start sandbox (this will deploy all changes)
npx ampx sandbox
```

**Wait for deployment to complete** (look for "Deployed" message, can take 5-10 minutes)

### Step 2: Verify Lambda Deployment

After deployment completes, verify the Lambda function was created:

```bash
aws lambda list-functions --query "Functions[?contains(FunctionName, 'petrophysicsCalculator')].{Name:FunctionName,Arn:FunctionArn}" --output table
```

You should see output like:
```
-----------------------------------------------------------------
|                        ListFunctions                          |
+------+--------------------------------------------------------+
| Arn  | arn:aws:lambda:us-east-1:ACCOUNT:function/amplify-...|
| Name | amplify-digitalassistant-petrophysicsCalculator-XXX |
+------+--------------------------------------------------------+
```

**Copy the Lambda ARN** - you'll need it for the next step.

### Step 3: Create Action Group in Bedrock Agent

Now we need to configure the Bedrock Agent to use the Lambda function.

#### Option A: Using AWS Console (Recommended)

1. Go to AWS Console → Bedrock → Agents
2. Click on "A4E-Petrophysics-agent-e9a"
3. Scroll down to "Action groups" section
4. Click "Add action group"
5. Configure:
   - **Action group name**: `petrophysics-tools`
   - **Action group type**: Define with function details
   - **Lambda function**: Select the petrophysicsCalculator function
   - **Action group invocation**: Select "AMAZON.UserInput"
   - **Action group description**: "Petrophysical calculation tools for well data analysis"
6. Click "Add action"
7. Add the following actions:

**Action 1: calculate_porosity**
- Name: `calculate_porosity`
- Description: "Calculate porosity for a well using density, neutron, or effective methods"
- Parameters:
  - `well_name` (string, required): "Name of the well"
  - `method` (string, required): "Calculation method: density, neutron, or effective"
  - `depth_start` (number, optional): "Start depth in feet"
  - `depth_end` (number, optional): "End depth in feet"

**Action 2: calculate_shale_volume**
- Name: `calculate_shale_volume`
- Description: "Calculate shale volume using various methods"
- Parameters:
  - `well_name` (string, required): "Name of the well"
  - `method` (string, required): "Method: larionov_tertiary, larionov_pre_tertiary, linear, or clavier"
  - `depth_start` (number, optional): "Start depth in feet"
  - `depth_end` (number, optional): "End depth in feet"

**Action 3: calculate_saturation**
- Name: `calculate_saturation`
- Description: "Calculate water saturation using Archie's equation"
- Parameters:
  - `well_name` (string, required): "Name of the well"
  - `method` (string, required): "Method: archie"
  - `porosity_method` (string, optional): "Porosity method to use"
  - `depth_start` (number, optional): "Start depth in feet"
  - `depth_end` (number, optional): "End depth in feet"

**Action 4: list_wells**
- Name: `list_wells`
- Description: "List all available wells"
- Parameters: (none)

**Action 5: get_well_info**
- Name: `get_well_info`
- Description: "Get information about a specific well"
- Parameters:
  - `well_name` (string, required): "Name of the well"

8. Click "Save and exit"
9. Click "Prepare" to prepare the agent with the new action group

#### Option B: Using AWS CLI

```bash
# Get the Lambda ARN from Step 2
LAMBDA_ARN="arn:aws:lambda:us-east-1:ACCOUNT:function/amplify-digitalassistant-petrophysicsCalculator-XXX"

# Create action group
aws bedrock-agent create-agent-action-group \
  --agent-id QUQKELPKM2 \
  --agent-version DRAFT \
  --action-group-name petrophysics-tools \
  --action-group-executor lambda="$LAMBDA_ARN" \
  --description "Petrophysical calculation tools for well data analysis" \
  --action-group-state ENABLED

# Prepare the agent
aws bedrock-agent prepare-agent --agent-id QUQKELPKM2
```

### Step 4: Verify Action Group Configuration

```bash
aws bedrock-agent list-agent-action-groups \
  --agent-id QUQKELPKM2 \
  --agent-version DRAFT \
  --output table
```

You should see the `petrophysics-tools` action group listed.

### Step 5: Test AgentCore Integration

Run the integration test:

```bash
node tests/test-agentcore-integration.js
```

Expected output:
```
✅ Response received
📦 Chunk 1: {"success": true, "message": "Porosity calculated successfully", ...}
✅ Response is valid JSON
✅ Has success field: true
✅ Has artifacts field (count: 1)
```

### Step 6: Test in UI

1. Open the application: `npm run dev`
2. Navigate to chat interface
3. Send message: "calculate porosity for well-001"
4. Expected result:
   - Loading indicator appears
   - Response shows porosity calculation results
   - Cloudscape visualization component renders
   - No errors in console

### Step 7: Monitor CloudWatch Logs

Check logs for detailed execution traces:

```bash
# Get log group name
aws logs describe-log-groups --query "logGroups[?contains(logGroupName, 'petrophysicsCalculator')].logGroupName" --output text

# Tail logs
aws logs tail /aws/lambda/amplify-digitalassistant-petrophysicsCalculator-XXX --follow
```

## Troubleshooting

### Issue: Agent says "I don't have enough information"

**Cause**: Action group not configured or Lambda not linked

**Solution**:
1. Verify action group exists: `aws bedrock-agent list-agent-action-groups --agent-id QUQKELPKM2 --agent-version DRAFT`
2. If missing, follow Step 3 to create action group
3. Prepare agent again

### Issue: Lambda function not found

**Cause**: Backend not deployed

**Solution**:
1. Stop sandbox (Ctrl+C)
2. Restart sandbox: `npx ampx sandbox`
3. Wait for "Deployed" message
4. Verify Lambda exists: `aws lambda list-functions | grep petrophysicsCalculator`

### Issue: Permission denied when invoking Lambda

**Cause**: Bedrock Agent doesn't have permission to invoke Lambda

**Solution**:
```bash
# Get Lambda ARN
LAMBDA_ARN=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'petrophysicsCalculator')].FunctionArn" --output text)

# Add permission
aws lambda add-permission \
  --function-name "$LAMBDA_ARN" \
  --statement-id bedrock-agent-invoke \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn "arn:aws:bedrock:us-east-1:ACCOUNT:agent/QUQKELPKM2"
```

### Issue: Response is text instead of JSON

**Cause**: Lambda is returning text response instead of structured JSON

**Solution**:
1. Check Lambda logs: `aws logs tail /aws/lambda/amplify-digitalassistant-petrophysicsCalculator-XXX`
2. Verify handler.py returns proper JSON structure
3. Check for Python exceptions in logs

### Issue: Artifacts not rendering in UI

**Cause**: Response format doesn't match expected structure

**Solution**:
1. Check browser console for errors
2. Verify response has `artifacts` array
3. Check artifact `messageContentType` matches component expectations
4. Review CloudscapePorosityDisplay.tsx for expected format

## Success Criteria

✅ Lambda function deployed and active
✅ Action group configured with all 5 actions
✅ Agent prepared successfully
✅ Integration test passes
✅ UI test shows porosity calculation results
✅ Cloudscape visualization renders
✅ No errors in CloudWatch logs
✅ No errors in browser console

## Next Steps After Success

1. Test all petrophysical calculations:
   - Porosity (density, neutron, effective)
   - Shale volume (all methods)
   - Water saturation (Archie)
   - Well listing
   - Well info

2. Test with different wells:
   - well-001
   - well-002
   - well-003

3. Test depth ranges:
   - Full well
   - Specific depth intervals
   - Multiple intervals

4. Performance testing:
   - Response time
   - Concurrent requests
   - Large datasets

5. Error handling:
   - Invalid well names
   - Invalid methods
   - Missing data
   - Out of range depths

## Configuration Summary

**Bedrock Agent:**
- Agent ID: `QUQKELPKM2`
- Agent Alias ID: `S5YWIUZOGB`
- Agent Name: `A4E-Petrophysics-agent-e9a`
- Status: PREPARED

**Lambda Function:**
- Name: `amplify-digitalassistant-petrophysicsCalculator-XXX`
- Runtime: Python 3.12
- Handler: `handler.handler`
- Timeout: 300 seconds
- Memory: 512 MB

**Environment Variables (backend.ts):**
- `PETROPHYSICS_AGENT_ID`: `QUQKELPKM2`
- `PETROPHYSICS_AGENT_ALIAS_ID`: `S5YWIUZOGB`
- `PETROPHYSICS_CALCULATOR_FUNCTION_NAME`: (auto-set)
- `S3_BUCKET`: (auto-set)

**IAM Permissions:**
- Bedrock Agent Runtime: InvokeAgent
- Lambda: InvokeFunction
- S3: GetObject, ListBucket

## References

- [AWS Bedrock Agents Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Bedrock Agent Runtime API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_InvokeAgent.html)
- [AgentCore Implementation Guide](./AGENTCORE_IMPLEMENTATION_GUIDE.md)
- [Petrophysics Solution](./AGENTCORE_PETROPHYSICS_SOLUTION.md)
