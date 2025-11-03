#!/bin/bash

echo "=== EDIcraft Configuration Status ==="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found"
    echo ""
    echo "Run: ./setup-edicraft-env.sh"
    exit 1
fi

echo "✅ .env.local exists"
echo ""

# Function to check if a variable is set (without showing the value)
check_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env.local | cut -d'=' -f2-)
    
    if [ -z "$var_value" ] || [ "$var_value" = "your_"* ] || [ "$var_value" = "" ]; then
        echo "❌ $var_name - NOT SET"
        return 1
    else
        # Show only first 3 and last 3 characters for security
        local length=${#var_value}
        if [ $length -gt 6 ]; then
            local masked="${var_value:0:3}***${var_value: -3}"
            echo "✅ $var_name - SET ($masked)"
        else
            echo "✅ $var_name - SET (***)"
        fi
        return 0
    fi
}

echo "=== Bedrock AgentCore ==="
check_var "BEDROCK_AGENT_ID"
check_var "BEDROCK_AGENT_ALIAS_ID"
echo ""

echo "=== Minecraft Server ==="
check_var "MINECRAFT_HOST"
check_var "MINECRAFT_PORT"
check_var "MINECRAFT_RCON_PASSWORD"
echo ""

echo "=== OSDU Platform ==="
check_var "EDI_USERNAME"
check_var "EDI_PASSWORD"
check_var "EDI_CLIENT_ID"
check_var "EDI_CLIENT_SECRET"
check_var "EDI_PARTITION"
check_var "EDI_PLATFORM_URL"
echo ""

# Count missing variables
missing_count=0
for var in BEDROCK_AGENT_ID BEDROCK_AGENT_ALIAS_ID MINECRAFT_HOST MINECRAFT_PORT MINECRAFT_RCON_PASSWORD EDI_USERNAME EDI_PASSWORD EDI_CLIENT_ID EDI_CLIENT_SECRET EDI_PARTITION EDI_PLATFORM_URL; do
    if ! grep -q "^${var}=" .env.local 2>/dev/null; then
        ((missing_count++))
    fi
done

if [ $missing_count -eq 0 ]; then
    echo "=== Status ==="
    echo "✅ All required variables are configured!"
    echo ""
    echo "Next steps:"
    echo "1. Restart the sandbox: npx ampx sandbox"
    echo "2. Test the EDIcraft agent in the UI"
else
    echo "=== Status ==="
    echo "⚠️  $missing_count variable(s) need to be configured"
    echo ""
    echo "Run: ./setup-edicraft-env.sh"
fi

echo ""
echo "=== Security Check ==="
if grep -q "\.env\.local" .gitignore; then
    echo "✅ .env.local is in .gitignore"
else
    echo "❌ WARNING: .env.local is NOT in .gitignore!"
    echo "   Add it now to prevent credential exposure!"
fi
