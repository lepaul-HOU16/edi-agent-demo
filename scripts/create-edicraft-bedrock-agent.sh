#!/bin/bash

# Create EDIcraft Bedrock Agent
# This creates the actual Bedrock Agent that the Lambda will invoke

set -e

echo "Creating EDIcraft Bedrock Agent..."

# Get the Lambda ARN
LAMBDA_ARN=$(aws lambda get-function --function-name edicraft-python-agent --query 'Configuration.FunctionArn' --output text)
echo "Lambda ARN: $LAMBDA_ARN"

# Create the agent
AGENT_ID=$(aws bedrock-agent create-agent \
  --region us-east-1 \
  --agent-name "edicraft-agent" \
  --description "EDIcraft Minecraft agent for building structures" \
  --foundation-model "anthropic.claude-3-sonnet-20240229-v1:0" \
  --instruction "You are EDIcraft, an AI assistant that helps users build structures in Minecraft. You can execute RCON commands to place blocks and create structures." \
  --query 'agent.agentId' \
  --output text)

echo "Created agent with ID: $AGENT_ID"

# Create action group for the Lambda
echo "Creating action group..."
aws bedrock-agent create-agent-action-group \
  --region us-east-1 \
  --agent-id "$AGENT_ID" \
  --agent-version "DRAFT" \
  --action-group-name "minecraft-actions" \
  --action-group-executor "lambda=$LAMBDA_ARN" \
  --function-schema '{
    "functions": [
      {
        "name": "execute_rcon_command",
        "description": "Execute an RCON command on the Minecraft server",
        "parameters": {
          "command": {
            "type": "string",
            "description": "The RCON command to execute",
            "required": true
          }
        }
      },
      {
        "name": "place_block",
        "description": "Place a block at specific coordinates",
        "parameters": {
          "x": {
            "type": "number",
            "description": "X coordinate",
            "required": true
          },
          "y": {
            "type": "number",
            "description": "Y coordinate",
            "required": true
          },
          "z": {
            "type": "number",
            "description": "Z coordinate",
            "required": true
          },
          "block_type": {
            "type": "string",
            "description": "Type of block to place",
            "required": true
          }
        }
      }
    ]
  }'

echo "Action group created"

# Prepare the agent
echo "Preparing agent..."
aws bedrock-agent prepare-agent \
  --region us-east-1 \
  --agent-id "$AGENT_ID"

echo "Agent prepared"

# Create alias
echo "Creating alias..."
ALIAS_ID=$(aws bedrock-agent create-agent-alias \
  --region us-east-1 \
  --agent-id "$AGENT_ID" \
  --agent-alias-name "production" \
  --query 'agentAlias.agentAliasId' \
  --output text)

echo "Created alias with ID: $ALIAS_ID"

# Grant Lambda permission to invoke the agent
echo "Granting Lambda permission..."
aws lambda add-permission \
  --function-name edicraft-python-agent \
  --statement-id bedrock-agent-invoke \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn "arn:aws:bedrock:us-east-1:$(aws sts get-caller-identity --query Account --output text):agent/$AGENT_ID"

echo ""
echo "✅ EDIcraft Bedrock Agent created successfully!"
echo ""
echo "Agent ID: $AGENT_ID"
echo "Alias ID: $ALIAS_ID"
echo ""
echo "Update Lambda environment variables:"
echo "BEDROCK_AGENT_ID=$AGENT_ID"
echo "BEDROCK_AGENT_ALIAS_ID=$ALIAS_ID"
