# Deploy Bedrock AgentCore Agent for EDIcraft

## Quick Start

The EDIcraft agent uses AWS Bedrock AgentCore to orchestrate Minecraft visualization. You need to deploy this agent first.

## Prerequisites

- AWS CLI configured
- Python 3.9+ installed
- Access to AWS Bedrock in your region

## Step 1: Navigate to EDIcraft Agent Directory

```bash
cd edicraft-agent
```

## Step 2: Install Dependencies

```bash
make install
```

This will:
- Create a Python virtual environment
- Install required packages
- Set up Bedrock AgentCore SDK

## Step 3: Configure (Minimal for Now)

Since OSDU is optional, you only need Minecraft configuration:

```bash
# Edit config.ini
nano config.ini
```

Set these values:
```ini
MINECRAFT_HOST="edicraft.nigelgardiner.com"
MINECRAFT_RCON_PORT="49001"
MINECRAFT_RCON_PASSWORD="your_rcon_password"
```

Leave OSDU fields empty for now - they're optional.

## Step 4: Deploy to AWS Bedrock

```bash
make deploy
```

**IMPORTANT**: Save the output! You'll see:

```
Agent deployed successfully!
Agent ID: ABCD1234EFGH
Agent Alias ID: TSTALIASID
```

## Step 5: Update .env.local

Copy the Agent ID and Alias ID to your `.env.local`:

```bash
# Add these lines to .env.local
BEDROCK_AGENT_ID=ABCD1234EFGH
BEDROCK_AGENT_ALIAS_ID=TSTALIASID
```

## Step 6: Restart Sandbox

```bash
# Stop current sandbox (Ctrl+C)
# Then restart
npx ampx sandbox
```

## Step 7: Test

1. Open browser to chat interface
2. Select "EDIcraft" agent
3. Send: "show me well001 in minecraft"
4. Should connect to Minecraft and visualize!

## Troubleshooting

### "make: command not found"

Run commands manually:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python deploy_agent.py
```

### "Bedrock not available in region"

Bedrock AgentCore is available in:
- us-east-1
- us-west-2
- eu-west-1

Set your region:
```bash
export AWS_REGION=us-east-1
```

### "Permission denied"

Ensure your AWS credentials have Bedrock permissions:
```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:CreateAgent",
    "bedrock:CreateAgentAlias",
    "bedrock:InvokeAgent"
  ],
  "Resource": "*"
}
```

## What Gets Deployed

The Bedrock agent includes:
- Agent definition with Claude 3.5 Sonnet
- MCP tools for Minecraft interaction
- Action groups for wellbore visualization
- (Optional) OSDU data fetching tools

## Cost Estimate

- Bedrock Agent: ~$0.01 per invocation
- Claude 3.5 Sonnet: ~$0.003 per 1K tokens
- Estimated: $0.05-0.10 per visualization

## Next Steps

After deployment:
1. Test Minecraft connection
2. Visualize local well data
3. (Optional) Add OSDU when you have access

## Files

- `config.ini` - Configuration
- `deploy_agent.py` - Deployment script
- `requirements.txt` - Python dependencies
- `Makefile` - Convenience commands
