#!/bin/bash

# Verify GitHub Secrets Configuration
# This script helps verify that GitHub secrets are properly configured

set -e

echo "=========================================="
echo "GitHub Secrets Verification"
echo "=========================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "Install it with:"
    echo "  macOS: brew install gh"
    echo "  Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo ""
    echo "Then authenticate with: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo ""
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI installed and authenticated"
echo ""

# List secrets
echo "Checking GitHub repository secrets..."
echo ""

SECRETS=$(gh secret list 2>&1)

if echo "$SECRETS" | grep -q "no secrets"; then
    echo "❌ No secrets found in repository"
    echo ""
    echo "You need to add the following secrets:"
    echo "  1. AWS_ACCESS_KEY_ID"
    echo "  2. AWS_SECRET_ACCESS_KEY"
    echo "  3. VITE_API_URL"
    echo ""
    echo "Add them with:"
    echo "  gh secret set AWS_ACCESS_KEY_ID"
    echo "  gh secret set AWS_SECRET_ACCESS_KEY"
    echo "  gh secret set VITE_API_URL"
    exit 1
fi

# Check for required secrets
REQUIRED_SECRETS=("AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "VITE_API_URL")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRETS" | grep -q "^$secret"; then
        echo "✅ $secret is configured"
    else
        echo "❌ $secret is MISSING"
        MISSING_SECRETS+=("$secret")
    fi
done

echo ""

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo "❌ Missing secrets: ${MISSING_SECRETS[*]}"
    echo ""
    echo "Add missing secrets with:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "  gh secret set $secret"
    done
    echo ""
    exit 1
fi

echo "✅ All required secrets are configured"
echo ""

# Test AWS credentials locally (if available)
echo "Testing AWS credentials locally..."
echo ""

if command -v aws &> /dev/null; then
    if aws sts get-caller-identity &> /dev/null; then
        ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
        USER=$(aws sts get-caller-identity --query Arn --output text)
        echo "✅ AWS credentials work locally"
        echo "   Account: $ACCOUNT"
        echo "   User: $USER"
    else
        echo "⚠️  AWS credentials not configured locally"
        echo "   (This is OK if GitHub secrets are correct)"
    fi
else
    echo "⚠️  AWS CLI not installed locally"
    echo "   (This is OK if GitHub secrets are correct)"
fi

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Commit and push your changes to main branch"
echo "  2. Go to: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
echo "  3. Watch the deployment workflow run"
echo ""
echo "Or trigger manually with:"
echo "  gh workflow run deploy-production.yml"
echo ""
