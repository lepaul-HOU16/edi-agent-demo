#!/bin/bash

# Interactive GitHub Secrets Setup
# This script helps you set up GitHub secrets interactively

set -e

echo "=========================================="
echo "GitHub Secrets Interactive Setup"
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
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo ""
    echo "Authenticating now..."
    gh auth login
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local example=$3
    
    echo "----------------------------------------"
    echo "Setting: $secret_name"
    echo "Description: $secret_description"
    if [ -n "$example" ]; then
        echo "Example: $example"
    fi
    echo ""
    
    # Check if secret already exists
    if gh secret list | grep -q "^$secret_name"; then
        echo "⚠️  Secret $secret_name already exists"
        read -p "Do you want to update it? (y/n): " update
        if [ "$update" != "y" ]; then
            echo "Skipping $secret_name"
            echo ""
            return
        fi
    fi
    
    # Set the secret
    gh secret set "$secret_name"
    
    if [ $? -eq 0 ]; then
        echo "✅ $secret_name set successfully"
    else
        echo "❌ Failed to set $secret_name"
    fi
    echo ""
}

# Get AWS credentials helper
get_aws_credentials() {
    echo "=========================================="
    echo "AWS Credentials Helper"
    echo "=========================================="
    echo ""
    echo "You need AWS credentials for GitHub Actions to deploy."
    echo ""
    echo "Option 1: Use existing IAM user"
    echo "  If you already have an IAM user with access keys, use those."
    echo ""
    echo "Option 2: Create new IAM user"
    echo "  Run these commands to create a new IAM user:"
    echo ""
    echo "  aws iam create-user --user-name github-actions-deploy"
    echo "  aws iam attach-user-policy \\"
    echo "    --user-name github-actions-deploy \\"
    echo "    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess"
    echo "  aws iam create-access-key --user-name github-actions-deploy"
    echo ""
    read -p "Press Enter when you have your AWS credentials ready..."
    echo ""
}

# Get API URL helper
get_api_url() {
    echo "=========================================="
    echo "API URL Helper"
    echo "=========================================="
    echo ""
    echo "You need your API Gateway URL."
    echo ""
    echo "Get it with this command:"
    echo ""
    echo "  aws cloudformation describe-stacks \\"
    echo "    --stack-name EnergyInsights-development \\"
    echo "    --query \"Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue\" \\"
    echo "    --output text"
    echo ""
    
    # Try to get it automatically
    if command -v aws &> /dev/null; then
        echo "Attempting to get API URL automatically..."
        API_URL=$(aws cloudformation describe-stacks \
            --stack-name EnergyInsights-development \
            --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$API_URL" ] && [ "$API_URL" != "None" ]; then
            echo "✅ Found API URL: $API_URL"
            echo ""
            read -p "Use this URL? (y/n): " use_url
            if [ "$use_url" = "y" ]; then
                echo "$API_URL" | gh secret set VITE_API_URL
                echo "✅ VITE_API_URL set successfully"
                echo ""
                return
            fi
        else
            echo "⚠️  Could not automatically retrieve API URL"
            echo ""
        fi
    fi
    
    read -p "Press Enter when you have your API URL ready..."
    echo ""
}

# Main setup flow
echo "This script will help you set up the required GitHub secrets."
echo ""
echo "Required secrets:"
echo "  1. AWS_ACCESS_KEY_ID - Your AWS access key"
echo "  2. AWS_SECRET_ACCESS_KEY - Your AWS secret key"
echo "  3. VITE_API_URL - Your API Gateway URL"
echo ""
read -p "Press Enter to continue..."
echo ""

# AWS Credentials
get_aws_credentials

# Set AWS_ACCESS_KEY_ID
set_secret "AWS_ACCESS_KEY_ID" \
    "AWS Access Key ID for deployment" \
    "AKIAIOSFODNN7EXAMPLE"

# Set AWS_SECRET_ACCESS_KEY
set_secret "AWS_SECRET_ACCESS_KEY" \
    "AWS Secret Access Key for deployment" \
    "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# API URL
get_api_url

# Set VITE_API_URL (if not already set by helper)
if ! gh secret list | grep -q "^VITE_API_URL"; then
    set_secret "VITE_API_URL" \
        "API Gateway URL for frontend" \
        "https://hbt1j807qf.execute-api.us-east-1.amazonaws.com"
fi

# Verify all secrets are set
echo "=========================================="
echo "Verification"
echo "=========================================="
echo ""
echo "Checking all secrets are configured..."
echo ""

SECRETS=$(gh secret list)
REQUIRED_SECRETS=("AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "VITE_API_URL")
ALL_SET=true

for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRETS" | grep -q "^$secret"; then
        echo "✅ $secret"
    else
        echo "❌ $secret - MISSING"
        ALL_SET=false
    fi
done

echo ""

if [ "$ALL_SET" = true ]; then
    echo "=========================================="
    echo "✅ Setup Complete!"
    echo "=========================================="
    echo ""
    echo "All required secrets are configured."
    echo ""
    echo "Next steps:"
    echo "  1. Commit and push your changes:"
    echo "     git add ."
    echo "     git commit -m \"Fix GitHub Actions credentials\""
    echo "     git push origin main"
    echo ""
    echo "  2. Watch the deployment:"
    echo "     gh run watch"
    echo ""
    echo "  3. Or trigger manually:"
    echo "     gh workflow run deploy-production.yml"
    echo ""
else
    echo "=========================================="
    echo "⚠️  Setup Incomplete"
    echo "=========================================="
    echo ""
    echo "Some secrets are missing. Please run this script again."
    echo ""
fi
