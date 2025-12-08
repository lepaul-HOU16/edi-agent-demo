#!/bin/bash

# ⚠️ DEPRECATED - THIS SCRIPT IS OBSOLETE ⚠️
#
# This script is no longer needed. The CI/CD workflow now automatically
# fetches the API URL from CloudFormation, eliminating the need for
# the VITE_API_URL GitHub secret.
#
# See API_URL_FIX_COMPLETE.md for details.
#
# If you need to set up GitHub Actions, you only need:
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
#
# The VITE_API_URL secret is no longer used and can be deleted.

echo "=========================================="
echo "⚠️  DEPRECATED SCRIPT"
echo "=========================================="
echo ""
echo "This script is obsolete. The CI/CD workflow now automatically"
echo "fetches the API URL from CloudFormation."
echo ""
echo "See API_URL_FIX_COMPLETE.md for details."
echo ""
echo "Exiting..."
exit 1

# OLD CODE BELOW - KEPT FOR REFERENCE ONLY

set -e

echo "=========================================="
echo "GitHub Actions CI/CD Setup"
echo "=========================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "Or manually add secrets in GitHub UI:"
    echo "Repository → Settings → Secrets and variables → Actions"
    exit 1
fi

echo "✅ GitHub CLI found"
echo ""

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub CLI"
    echo ""
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ Logged in to GitHub"
echo ""

# Get current AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo ""
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# Get stack outputs
echo "Getting stack information..."
STACK_NAME="EnergyInsights-development"

if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
    echo "❌ Stack $STACK_NAME not found"
    echo ""
    echo "Deploy the stack first:"
    echo "  cd cdk && cdk deploy"
    exit 1
fi

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
    --output text)

CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text)

echo "✅ Stack found"
echo "   API URL: $API_URL"
echo "   CloudFront ID: $CLOUDFRONT_ID"
echo ""

# Prompt for GitHub Actions IAM user
echo "=========================================="
echo "IAM User Setup"
echo "=========================================="
echo ""
echo "You need an IAM user for GitHub Actions with deployment permissions."
echo ""
read -p "Do you want to create a new IAM user? (y/n): " CREATE_USER

if [ "$CREATE_USER" = "y" ]; then
    IAM_USER="github-actions-deploy"
    
    echo ""
    echo "Creating IAM user: $IAM_USER"
    
    # Create user
    if aws iam get-user --user-name "$IAM_USER" &> /dev/null; then
        echo "⚠️  User $IAM_USER already exists"
    else
        aws iam create-user --user-name "$IAM_USER"
        echo "✅ User created"
    fi
    
    # Attach policy (using AdministratorAccess for simplicity - restrict in production!)
    echo "Attaching AdministratorAccess policy..."
    aws iam attach-user-policy \
        --user-name "$IAM_USER" \
        --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
    echo "✅ Policy attached"
    
    # Create access key
    echo "Creating access key..."
    KEY_OUTPUT=$(aws iam create-access-key --user-name "$IAM_USER" --output json)
    
    AWS_ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.AccessKeyId')
    AWS_SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.SecretAccessKey')
    
    echo "✅ Access key created"
    echo ""
    echo "⚠️  IMPORTANT: Save these credentials securely!"
    echo "   Access Key ID: $AWS_ACCESS_KEY_ID"
    echo "   Secret Access Key: $AWS_SECRET_ACCESS_KEY"
    echo ""
else
    echo ""
    echo "Enter your existing IAM user credentials:"
    read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    echo ""
fi

# Set GitHub secrets
echo ""
echo "=========================================="
echo "Setting GitHub Secrets"
echo "=========================================="
echo ""

echo "Setting AWS_ACCESS_KEY_ID..."
echo "$AWS_ACCESS_KEY_ID" | gh secret set AWS_ACCESS_KEY_ID
echo "✅ AWS_ACCESS_KEY_ID set"

echo "Setting AWS_SECRET_ACCESS_KEY..."
echo "$AWS_SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY
echo "✅ AWS_SECRET_ACCESS_KEY set"

echo "Setting VITE_API_URL..."
echo "$API_URL" | gh secret set VITE_API_URL
echo "✅ VITE_API_URL set"

echo ""
echo "=========================================="
echo "Verifying Setup"
echo "=========================================="
echo ""

# List secrets
echo "GitHub Secrets configured:"
gh secret list

echo ""
echo "=========================================="
echo "Workflow Configuration"
echo "=========================================="
echo ""

# Check workflow file
if [ -f ".github/workflows/deploy-production.yml" ]; then
    echo "✅ Workflow file exists"
    
    # Check if values need updating
    echo ""
    echo "Verify these values in .github/workflows/deploy-production.yml:"
    echo ""
    echo "  AWS_REGION: us-east-1"
    echo "  STACK_NAME: $STACK_NAME"
    echo "  CLOUDFRONT_DISTRIBUTION_ID: $CLOUDFRONT_ID"
    echo ""
    
    read -p "Do these values look correct? (y/n): " CORRECT
    
    if [ "$CORRECT" != "y" ]; then
        echo ""
        echo "Update the values in .github/workflows/deploy-production.yml"
        echo "Then commit and push the changes."
        exit 0
    fi
else
    echo "❌ Workflow file not found"
    echo ""
    echo "Expected: .github/workflows/deploy-production.yml"
    exit 1
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "✅ GitHub secrets configured"
echo "✅ Workflow file verified"
echo ""
echo "Next steps:"
echo "1. Commit and push the workflow file:"
echo "   git add .github/workflows/deploy-production.yml"
echo "   git commit -m 'Add GitHub Actions CI/CD pipeline'"
echo "   git push origin main"
echo ""
echo "2. Monitor the deployment:"
echo "   - Go to GitHub → Actions tab"
echo "   - Watch the workflow run"
echo ""
echo "3. Verify deployment:"
echo "   - Frontend: https://d36sq31aqkfe46.cloudfront.net"
echo "   - API: $API_URL"
echo ""
echo "=========================================="
echo ""
echo "For more information, see:"
echo "  docs/GITHUB_ACTIONS_SETUP.md"
echo ""
