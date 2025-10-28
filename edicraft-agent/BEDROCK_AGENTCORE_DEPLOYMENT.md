# Bedrock AgentCore Deployment Guide

## Current Status

The EDIcraft agent was originally built to deploy using **Bedrock AgentCore**, which appears to be:
- A custom AWS toolkit/SDK (not standard AWS Bedrock Agents)
- Requires packages not available in public PyPI: `bedrock-agentcore`, `strands-agents`, `bedrock-agentcore-starter-toolkit`
- Has a CLI tool (`agentcore`) for deployment

## Evidence

1. The `.bedrock_agentcore.yaml` file shows a previous deployment to AWS account `447783235956` (not your account)
2. The `Makefile` references `agentcore` CLI commands
3. The `requirements.txt` lists packages not in PyPI

## Options for Path 1 (Bedrock AgentCore)

### Option 1A: Use Standard AWS Bedrock Agents (Recommended)

Instead of the custom AgentCore toolkit, use standard AWS Bedrock Agents:

**Steps:**
1. Create a Bedrock Agent in AWS Console
2. Configure it with the Python code as a Lambda function
3. Add tools for RCON and OSDU integration
4. Deploy and get the Agent ID

**Advantages:**
- Uses standard AWS services
- Well-documented
- No custom tooling required

**Implementation:**
```bash
# Create Lambda function with Python code
aws lambda create-function \
  --function-name edicraft-agent \
  --runtime python3.12 \
  --handler agent.handler \
  --zip-file fileb://edicraft-agent.zip

# Create Bedrock Agent
aws bedrock-agent create-agent \
  --agent-name edicraft \
  --foundation-model us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --instruction "You are the EDIcraft agent..."

# Add action group with Lambda
aws bedrock-agent create-agent-action-group \
  --agent-id <agent-id> \
  --action-group-name edicraft-tools \
  --action-group-executor lambda=<lambda-arn>
```

### Option 1B: Contact AWS for Bedrock AgentCore Access

If Bedrock AgentCore is an internal/preview AWS service:

**Steps:**
1. Contact your AWS account team
2. Request access to Bedrock AgentCore
3. Get the `agentcore` CLI tool
4. Get access to the Python packages

**Questions to ask AWS:**
- Is Bedrock AgentCore available for my account?
- How do I install the `agentcore` CLI?
- Where can I get `strands-agents` and `bedrock-agentcore-starter-toolkit` packages?
- Is there documentation for Bedrock AgentCore?

### Option 1C: Reverse Engineer from Existing Deployment

The `.bedrock_agentcore.yaml` shows an existing deployment. You could:

**Steps:**
1. Contact the owner of AWS account `447783235956`
2. Ask for the deployment tooling/packages
3. Get the `agentcore` CLI from them
4. Use their deployment as a reference

## Recommended Approach

Given the constraints, I recommend **Option 1A: Use Standard AWS Bedrock Agents**.

This approach:
- ✅ Uses publicly available AWS services
- ✅ Well-documented by AWS
- ✅ No custom tooling required
- ✅ Can be deployed today
- ✅ Achieves the same goal (agent that calls Python tools)

## Implementation Plan for Option 1A

### Step 1: Package Python Code as Lambda

```bash
cd edicraft-agent

# Create deployment package
pip install -r requirements.txt -t package/
cp agent.py config.py package/
cp -r tools/ package/
cd package && zip -r ../edicraft-agent.zip . && cd ..

# Create Lambda function
aws lambda create-function \
  --function-name edicraft-agent-tools \
  --runtime python3.12 \
  --role arn:aws:iam::484907533441:role/lambda-execution-role \
  --handler agent.handler \
  --zip-file fileb://edicraft-agent.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{
    MINECRAFT_HOST=edicraft.nigelgardiner.com,
    MINECRAFT_RCON_PORT=49001,
    MINECRAFT_RCON_PASSWORD=ediagents@OSDU2025demo,
    EDI_USERNAME=edi-user,
    EDI_PASSWORD=Asd!1edi,
    EDI_CLIENT_ID=7se4hblptk74h59ghbb694ovj4,
    EDI_CLIENT_SECRET=k7iq7mnm4k0rp5hmve7ceb8dajkj9vulavetg90epn7an5sekfi,
    EDI_PARTITION=osdu,
    EDI_PLATFORM_URL=https://osdu.vavourak.people.aws.dev
  }"
```

### Step 2: Create Bedrock Agent

```bash
# Create agent
aws bedrock-agent create-agent \
  --region us-west-2 \
  --agent-name edicraft \
  --foundation-model us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --instruction "You are the EDIcraft agent specialized in subsurface data visualization using OSDU and Minecraft. You can search for wellbores, visualize trajectories, render horizon surfaces, and manage Minecraft coordinates." \
  --agent-resource-role-arn arn:aws:iam::484907533441:role/bedrock-agent-role

# Get the agent ID from output
AGENT_ID=<from-output>

# Create action group
aws bedrock-agent create-agent-action-group \
  --region us-west-2 \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --action-group-name edicraft-tools \
  --action-group-executor lambda=arn:aws:lambda:us-west-2:484907533441:function:edicraft-agent-tools \
  --api-schema '{
    "openapi": "3.0.0",
    "info": {"title": "EDIcraft Tools", "version": "1.0.0"},
    "paths": {
      "/search_wellbores": {
        "post": {
          "description": "Search for wellbore trajectories in OSDU",
          "responses": {"200": {"description": "Success"}}
        }
      },
      "/build_wellbore": {
        "post": {
          "description": "Build wellbore visualization in Minecraft",
          "parameters": [
            {"name": "wellbore_id", "in": "query", "required": true, "schema": {"type": "string"}}
          ],
          "responses": {"200": {"description": "Success"}}
        }
      }
    }
  }'

# Prepare agent
aws bedrock-agent prepare-agent \
  --region us-west-2 \
  --agent-id $AGENT_ID

# Create alias
aws bedrock-agent create-agent-alias \
  --region us-west-2 \
  --agent-id $AGENT_ID \
  --agent-alias-name production

# Get alias ID
ALIAS_ID=<from-output>
```

### Step 3: Update Lambda to Invoke Agent

Update `amplify/functions/edicraftAgent/mcpClient.ts` to invoke the Bedrock Agent:

```typescript
async processMessage(message: string): Promise<EDIcraftResponse> {
  const command = new InvokeAgentCommand({
    agentId: process.env.BEDROCK_AGENT_ID,
    agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
    sessionId: `session-${Date.now()}`,
    inputText: message
  });

  const response = await this.bedrockClient.send(command);
  
  // Parse response stream
  const chunks = [];
  for await (const chunk of response.completion) {
    if (chunk.chunk?.bytes) {
      chunks.push(new TextDecoder().decode(chunk.chunk.bytes));
    }
  }
  
  return {
    success: true,
    message: chunks.join(''),
    connectionStatus: 'connected'
  };
}
```

### Step 4: Configure Environment Variables

Add to your Amplify backend:

```typescript
backend.edicraftAgentHandler.addEnvironment('BEDROCK_AGENT_ID', '<agent-id>');
backend.edicraftAgentHandler.addEnvironment('BEDROCK_AGENT_ALIAS_ID', '<alias-id>');
```

## Next Steps

**Choose your path:**

1. **Standard Bedrock Agents** (Option 1A) - I can help implement this now
2. **Contact AWS** (Option 1B) - You'll need to reach out to AWS support
3. **Find original deployer** (Option 1C) - Contact whoever deployed to account 447783235956

**Which option would you like to pursue?**

For Option 1A, I can start implementing immediately. For Options 1B/1C, you'll need to take external actions first.
