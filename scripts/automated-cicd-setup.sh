#!/bin/bash

# Fully automated CI/CD setup script
# This script will:
# 1. Create IAM user for GitHub Actions
# 2. Generate access keys
# 3. Get your API URL from CloudFormation
# 4. Display instructions for adding secrets to GitHub
# 5. Commit and push the workflow files

set -e

echo "=========================================="
echo "Automated CI/CD Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Install from: https://aws.amazon.com/cli/"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI found${NC}"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account: $ACCOUNT_ID${NC}"

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git found${NC}"

# Check if in git repo
if ! git rev-parse --git-dir &> /dev/null; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git repository found${NC}"

echo ""

# Get stack information
echo "Getting CloudFormation stack information..."
STACK_NAME="EnergyInsights-development"

if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
    echo -e "${RED}❌ Stack $STACK_NAME not found${NC}"
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

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
    --output text)

echo -e "${GREEN}✅ Stack found${NC}"
echo "   API URL: $API_URL"
echo "   CloudFront ID: $CLOUDFRONT_ID"
echo "   Frontend URL: $FRONTEND_URL"
echo ""

# Create IAM user
echo "=========================================="
echo "Creating IAM User for GitHub Actions"
echo "=========================================="
echo ""

IAM_USER="github-actions-deploy"

# Check if user exists
if aws iam get-user --user-name "$IAM_USER" &> /dev/null; then
    echo -e "${YELLOW}⚠️  User $IAM_USER already exists${NC}"
    read -p "Do you want to create a new access key for this user? (y/n): " CREATE_KEY
    
    if [ "$CREATE_KEY" != "y" ]; then
        echo "Using existing user. You'll need to provide existing credentials."
        read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
        read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
        echo ""
    else
        # Delete old keys if they exist
        OLD_KEYS=$(aws iam list-access-keys --user-name "$IAM_USER" --query "AccessKeyMetadata[].AccessKeyId" --output text)
        for KEY in $OLD_KEYS; do
            echo "Deleting old access key: $KEY"
            aws iam delete-access-key --user-name "$IAM_USER" --access-key-id "$KEY"
        done
        
        # Create new key
        echo "Creating new access key..."
        KEY_OUTPUT=$(aws iam create-access-key --user-name "$IAM_USER" --output json)
        AWS_ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | grep -o '"AccessKeyId": "[^"]*' | cut -d'"' -f4)
        AWS_SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | grep -o '"SecretAccessKey": "[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✅ New access key created${NC}"
    fi
else
    echo "Creating IAM user: $IAM_USER"
    aws iam create-user --user-name "$IAM_USER" > /dev/null
    echo -e "${GREEN}✅ User created${NC}"
    
    echo "Attaching AdministratorAccess policy..."
    aws iam attach-user-policy \
        --user-name "$IAM_USER" \
        --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
    echo -e "${GREEN}✅ Policy attached${NC}"
    
    echo "Creating access key..."
    KEY_OUTPUT=$(aws iam create-access-key --user-name "$IAM_USER" --output json)
    AWS_ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | grep -o '"AccessKeyId": "[^"]*' | cut -d'"' -f4)
    AWS_SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | grep -o '"SecretAccessKey": "[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Access key created${NC}"
fi

echo ""

# Save credentials to file for easy copy-paste
SECRETS_FILE=".github-secrets.txt"
cat > "$SECRETS_FILE" << EOF
========================================
GitHub Secrets Configuration
========================================

Add these three secrets to your GitHub repository:

Repository → Settings → Secrets and variables → Actions → New repository secret

Secret 1:
---------
Name: AWS_ACCESS_KEY_ID
Value: $AWS_ACCESS_KEY_ID

Secret 2:
---------
Name: AWS_SECRET_ACCESS_KEY
Value: $AWS_SECRET_ACCESS_KEY

Secret 3:
---------
Name: VITE_API_URL
Value: $API_URL

========================================
IMPORTANT: Keep this file secure!
Delete it after adding secrets to GitHub.
========================================
EOF

echo -e "${GREEN}✅ Credentials saved to: $SECRETS_FILE${NC}"
echo ""

# Display credentials
echo "=========================================="
echo "GitHub Secrets to Add"
echo "=========================================="
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Add these secrets to GitHub!${NC}"
echo ""
echo "1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "2. Click 'New repository secret' and add each of these:"
echo ""
echo -e "${GREEN}Secret 1:${NC}"
echo "   Name: AWS_ACCESS_KEY_ID"
echo "   Value: $AWS_ACCESS_KEY_ID"
echo ""
echo -e "${GREEN}Secret 2:${NC}"
echo "   Name: AWS_SECRET_ACCESS_KEY"
echo "   Value: $AWS_SECRET_ACCESS_KEY"
echo ""
echo -e "${GREEN}Secret 3:${NC}"
echo "   Name: VITE_API_URL"
echo "   Value: $API_URL"
echo ""
echo "These values are also saved in: $SECRETS_FILE"
echo ""

# Verify workflow file exists
echo "=========================================="
echo "Verifying Workflow Configuration"
echo "=========================================="
echo ""

if [ ! -f ".github/workflows/deploy-production.yml" ]; then
    echo -e "${RED}❌ Workflow file not found${NC}"
    echo "Expected: .github/workflows/deploy-production.yml"
    exit 1
fi
echo -e "${GREEN}✅ Workflow file exists${NC}"

# Check workflow configuration
echo ""
echo "Workflow configuration:"
echo "  AWS_REGION: us-east-1"
echo "  STACK_NAME: $STACK_NAME"
echo "  CLOUDFRONT_DISTRIBUTION_ID: $CLOUDFRONT_ID"
echo ""

# Commit and push
echo "=========================================="
echo "Git Operations"
echo "=========================================="
echo ""

# Check if files are already committed
if git diff --quiet .github/workflows/deploy-production.yml 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Workflow file already committed${NC}"
else
    echo "Staging workflow files..."
    git add .github/workflows/deploy-production.yml
    git add scripts/*.sh
    git add docs/GITHUB_ACTIONS_SETUP.md
    git add docs/AWS_CODEPIPELINE_SETUP.md
    git add docs/CICD_PIPELINE_DIAGRAM.md
    git add CICD_QUICK_START.md
    git add MANUAL_CICD_SETUP.md
    
    echo "Committing files..."
    git commit -m "Add CI/CD pipeline with GitHub Actions

- Add GitHub Actions workflow for automated deployment
- Add setup scripts and documentation
- Configure deployment to production on push to main
"
    echo -e "${GREEN}✅ Files committed${NC}"
fi

echo ""
read -p "Do you want to push to main branch now? (y/n): " PUSH_NOW

if [ "$PUSH_NOW" = "y" ]; then
    echo ""
    echo "Pushing to main branch..."
    git push origin main
    echo -e "${GREEN}✅ Pushed to main${NC}"
    echo ""
    echo -e "${GREEN}🚀 Deployment triggered!${NC}"
    echo ""
    echo "Monitor deployment at:"
    echo "  https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
else
    echo ""
    echo "Files are committed but not pushed."
    echo "When ready, run: git push origin main"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ IAM user created: $IAM_USER${NC}"
echo -e "${GREEN}✅ Access keys generated${NC}"
echo -e "${GREEN}✅ Workflow files committed${NC}"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo ""
echo "1. Add secrets to GitHub:"
echo "   https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "   Copy values from: $SECRETS_FILE"
echo ""
echo "2. Push to main (if you haven't already):"
echo "   git push origin main"
echo ""
echo "3. Monitor deployment:"
echo "   https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo ""
echo "4. Verify deployment:"
echo "   Frontend: $FRONTEND_URL"
echo "   API: $API_URL"
echo ""
echo "5. Delete credentials file (after adding to GitHub):"
echo "   rm $SECRETS_FILE"
echo ""
echo "=========================================="
echo ""
echo "For help, see: CICD_QUICK_START.md"
echo ""
