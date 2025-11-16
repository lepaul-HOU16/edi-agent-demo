#!/bin/bash

# Setup GitHub Repository Configuration
# This script helps configure the GitHub CLI with your repository

set -e

echo "=========================================="
echo "GitHub Repository Setup"
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

echo "✅ GitHub CLI installed"
echo ""

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "⚠️  Not authenticated with GitHub CLI"
    echo ""
    echo "Authenticating now..."
    gh auth login
    echo ""
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

echo "✅ In a git repository"
echo ""

# Check if remote exists
REMOTE=$(git remote -v | grep origin | head -1 || echo "")

if [ -z "$REMOTE" ]; then
    echo "❌ No 'origin' remote found"
    echo ""
    echo "You need to add a GitHub remote:"
    echo "  git remote add origin https://github.com/USERNAME/REPO.git"
    echo ""
    exit 1
fi

echo "✅ Remote 'origin' exists:"
echo "   $REMOTE"
echo ""

# Extract repository info
REPO_URL=$(git remote get-url origin)
echo "Repository URL: $REPO_URL"
echo ""

# Set default repository
echo "Setting default repository for GitHub CLI..."
gh repo set-default

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "You can now use GitHub CLI commands:"
echo "  gh secret list"
echo "  gh secret set SECRET_NAME"
echo "  gh workflow run deploy-production.yml"
echo "  gh run watch"
echo "  gh run list"
echo ""
