#!/bin/bash

echo "=== EDIcraft Environment Variable Setup ==="
echo ""
echo "This script will help you configure EDIcraft environment variables."
echo "Your credentials will be stored in .env.local (which is gitignored)."
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists."
    read -p "Do you want to update it? (y/n): " update_env
    if [ "$update_env" != "y" ]; then
        echo "Exiting without changes."
        exit 0
    fi
    # Backup existing file
    cp .env.local .env.local.backup
    echo "✅ Backed up existing .env.local to .env.local.backup"
fi

# Create or append to .env.local
echo ""
echo "=== Bedrock AgentCore Configuration ==="
echo ""
echo "You need to deploy the Bedrock AgentCore agent first."
echo "See: edicraft-agent/BEDROCK_AGENTCORE_DEPLOYMENT.md"
echo ""
read -p "Have you deployed the Bedrock agent? (y/n): " deployed
if [ "$deployed" != "y" ]; then
    echo ""
    echo "⚠️  You need to deploy the Bedrock agent first:"
    echo "   cd edicraft-agent"
    echo "   make deploy"
    echo ""
    echo "After deployment, run this script again."
    exit 1
fi

echo ""
read -p "Enter BEDROCK_AGENT_ID (10 alphanumeric characters): " agent_id
read -p "Enter BEDROCK_AGENT_ALIAS_ID (default: TSTALIASID): " alias_id
alias_id=${alias_id:-TSTALIASID}

echo ""
echo "=== Minecraft Server Configuration ==="
echo ""
echo "Server: edicraft.nigelgardiner.com"
echo ""
read -p "Enter MINECRAFT_PORT (default: 49000): " mc_port
mc_port=${mc_port:-49000}
read -sp "Enter MINECRAFT_RCON_PASSWORD: " rcon_pass
echo ""

echo ""
echo "=== OSDU Platform Configuration ==="
echo ""
read -p "Enter EDI_USERNAME: " edi_user
read -sp "Enter EDI_PASSWORD: " edi_pass
echo ""
read -p "Enter EDI_CLIENT_ID: " edi_client_id
read -sp "Enter EDI_CLIENT_SECRET: " edi_client_secret
echo ""
read -p "Enter EDI_PARTITION: " edi_partition
read -p "Enter EDI_PLATFORM_URL: " edi_url

# Write to .env.local
cat >> .env.local << EOF

# ============================================
# EDIcraft Agent Configuration
# Added: $(date)
# ============================================

# Bedrock AgentCore
BEDROCK_AGENT_ID=$agent_id
BEDROCK_AGENT_ALIAS_ID=$alias_id
BEDROCK_REGION=us-east-1

# Minecraft Server
MINECRAFT_HOST=edicraft.nigelgardiner.com
MINECRAFT_PORT=$mc_port
MINECRAFT_RCON_PASSWORD=$rcon_pass

# OSDU Platform
EDI_USERNAME=$edi_user
EDI_PASSWORD=$edi_pass
EDI_CLIENT_ID=$edi_client_id
EDI_CLIENT_SECRET=$edi_client_secret
EDI_PARTITION=$edi_partition
EDI_PLATFORM_URL=$edi_url

EOF

echo ""
echo "✅ Environment variables written to .env.local"
echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Verify .env.local is in .gitignore (it should be)"
echo "2. Restart the Amplify sandbox:"
echo "   npx ampx sandbox"
echo ""
echo "3. Test the EDIcraft agent:"
echo "   - Select 'EDIcraft' from the agent dropdown"
echo "   - Send: 'get a well log from well001 and show it in minecraft'"
echo ""
echo "⚠️  IMPORTANT: Never commit .env.local to git!"
echo ""
