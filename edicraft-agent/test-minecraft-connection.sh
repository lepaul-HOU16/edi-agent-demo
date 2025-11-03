#!/bin/bash

# Test Minecraft RCON Connection
# Usage: ./test-minecraft-connection.sh <rcon_password>

set -e

MINECRAFT_HOST="edicraft.nigelgardiner.com"
MINECRAFT_PORT="49000"
RCON_PASSWORD="${1:-}"

if [ -z "$RCON_PASSWORD" ]; then
    echo "Usage: ./test-minecraft-connection.sh <rcon_password>"
    echo ""
    echo "This script tests the RCON connection to the Minecraft server."
    exit 1
fi

echo "Testing Minecraft RCON connection..."
echo "Host: $MINECRAFT_HOST"
echo "Port: $MINECRAFT_PORT"
echo ""

# Check if mcrcon is installed
if ! command -v mcrcon &> /dev/null; then
    echo "❌ mcrcon is not installed."
    echo ""
    echo "Install it with:"
    echo "  Mac:   brew install mcrcon"
    echo "  Linux: apt-get install mcrcon"
    echo ""
    exit 1
fi

# Test connection
echo "Attempting to connect..."
if mcrcon -H "$MINECRAFT_HOST" -P "$MINECRAFT_PORT" -p "$RCON_PASSWORD" "list" 2>&1; then
    echo ""
    echo "✅ SUCCESS! RCON connection works."
    echo ""
    echo "Your RCON password is correct. Add it to config.ini:"
    echo "MINECRAFT_RCON_PASSWORD=\"$RCON_PASSWORD\""
else
    echo ""
    echo "❌ FAILED! Could not connect to Minecraft server."
    echo ""
    echo "Possible issues:"
    echo "1. Wrong password"
    echo "2. Server is down"
    echo "3. RCON is not enabled"
    echo "4. Firewall blocking port $MINECRAFT_PORT"
    echo ""
    echo "Try checking the server status:"
    echo "  nc -zv $MINECRAFT_HOST $MINECRAFT_PORT"
fi
