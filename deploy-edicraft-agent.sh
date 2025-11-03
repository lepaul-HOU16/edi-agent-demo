#!/bin/bash
# Deploy EDIcraft agent to Bedrock AgentCore

set -e

echo "=== Deploying EDIcraft Agent to Bedrock AgentCore ==="
echo ""

# Navigate to edicraft-agent directory
cd edicraft-agent

# Activate virtual environment
source venv/bin/activate

# Load environment variables from config.ini
export $(grep -v '^#' config.ini | xargs)

# Deploy using agentcore CLI
echo "Deploying agent with updated system prompt..."
agentcore launch --auto-update-on-conflict \
  --env EDI_USERNAME="$EDI_USERNAME" \
  --env EDI_PASSWORD="$EDI_PASSWORD" \
  --env EDI_CLIENT_ID="$EDI_CLIENT_ID" \
  --env EDI_CLIENT_SECRET="$EDI_CLIENT_SECRET" \
  --env EDI_PARTITION="$EDI_PARTITION" \
  --env EDI_PLATFORM_URL="$EDI_PLATFORM_URL" \
  --env MINECRAFT_HOST="$MINECRAFT_HOST" \
  --env MINECRAFT_RCON_PORT="$MINECRAFT_RCON_PORT" \
  --env MINECRAFT_RCON_PASSWORD="$MINECRAFT_RCON_PASSWORD"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "The agent has been deployed with the simplified system prompt."
echo "It should now call tools instead of returning welcome messages."
echo ""
echo "Next steps:"
echo "1. Test the agent in the chat interface"
echo "2. Try: 'Build wellbore trajectory for WELL-001'"
echo "3. Check CloudWatch logs for tool calls"
