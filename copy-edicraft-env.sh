#!/bin/bash

echo "=== Copying EDIcraft Variables to .env.local ==="
echo ""

if [ ! -f .env.edicraft.example ]; then
    echo "❌ .env.edicraft.example not found"
    exit 1
fi

if [ ! -f .env.local ]; then
    echo "Creating .env.local..."
    touch .env.local
fi

# Backup .env.local
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backed up .env.local"

# Remove old EDIcraft section if it exists
sed -i.bak '/^# ============================================$/,/^# ============================================$/{ /EDIcraft Agent Configuration/,/^$/d; }' .env.local 2>/dev/null || true

# Append EDIcraft variables from .env.edicraft.example
echo "" >> .env.local
echo "# ============================================" >> .env.local
echo "# EDIcraft Agent Configuration" >> .env.local
echo "# Copied from .env.edicraft.example on $(date)" >> .env.local
echo "# ============================================" >> .env.local

# Extract EDIcraft variables (lines that start with BEDROCK_, MINECRAFT_, or EDI_)
grep -E "^(BEDROCK_|MINECRAFT_|EDI_)" .env.edicraft.example >> .env.local

echo "✅ Copied EDIcraft variables to .env.local"
echo ""
echo "Verifying configuration..."
echo ""

# Run the check script
if [ -f check-edicraft-config.sh ]; then
    ./check-edicraft-config.sh
else
    echo "⚠️  check-edicraft-config.sh not found"
    echo "Manually verify .env.local has all required variables"
fi

echo ""
echo "=== Next Steps ==="
echo "1. Verify the configuration above"
echo "2. If OSDU tests fail, you may need to:"
echo "   - Check OSDU platform URL is correct"
echo "   - Verify credentials are valid"
echo "   - Test OSDU connection separately"
echo "3. Restart sandbox: npx ampx sandbox"
