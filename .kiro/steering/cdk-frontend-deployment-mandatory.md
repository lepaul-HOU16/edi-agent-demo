# CDK FRONTEND DEPLOYMENT - MANDATORY PROTOCOL

## CRITICAL RULE: FRONTEND CHANGES REQUIRE MANUAL DEPLOYMENT

**THIS PROJECT USES CDK WITH STATIC FRONTEND HOSTING. CHANGES DO NOT AUTO-DEPLOY.**

## The Architecture

This project has migrated from Amplify to a pure CDK stack with:
- **Backend**: CDK Lambda functions (auto-deploy via `npm run deploy` in cdk/)
- **Frontend**: Static React/Vite app hosted on S3 + CloudFront (MANUAL deployment required)

## The Problem

When you make changes to frontend code (anything in `src/`), those changes:
- ❌ Do NOT automatically deploy to S3
- ❌ Do NOT automatically invalidate CloudFront cache
- ❌ Do NOT appear in the live application
- ❌ Are ONLY visible in local development (`npm run dev`)

**Result**: You make a fix, user tests, NOTHING CHANGED because you didn't deploy.

## MANDATORY DEPLOYMENT PROTOCOL

### After EVERY Frontend Change:

```bash
# 1. Build the frontend
npm run build

# 2. Deploy to S3
aws s3 sync dist/ s3://energyinsights-development-frontend-development/ --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E18FPAPGJR8ZNO --paths "/*"

# 4. Wait 1-2 minutes for invalidation to complete
```

### After EVERY Backend Change:

```bash
# From cdk/ directory
cd cdk
npm run deploy

# This runs:
# - npm run build (TypeScript compilation)
# - npm run build:lambdas (Lambda bundling)
# - cdk deploy --all (CloudFormation deployment)
```

## What Requires Frontend Deployment

**ANY change to these directories requires frontend deployment:**

- `src/components/` - React components
- `src/pages/` - Page components
- `src/lib/` - Utility libraries
- `src/hooks/` - React hooks
- `src/contexts/` - React contexts
- `src/styles/` - CSS/styling
- `src/utils/` - Utility functions
- `public/` - Static assets
- `index.html` - HTML template
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Tailwind configuration
- `.env.local` - Environment variables (requires rebuild)

**Examples of changes that require deployment:**
- Adding a new component
- Fixing a bug in existing component
- Changing styles or CSS
- Updating environment variables
- Adding new routes
- Modifying API calls
- Changing state management
- Updating UI text or labels

## What Requires Backend Deployment

**ANY change to these directories requires backend deployment:**

- `cdk/lambda-functions/` - Lambda function code
- `cdk/lib/` - CDK infrastructure code
- `cdk/bin/` - CDK app entry point
- Lambda dependencies in `package.json`
- Environment variables in CDK stack

## The Complete Deployment Workflow

### For Frontend-Only Changes:

```bash
# 1. Make your changes to src/
vim src/components/MyComponent.tsx

# 2. Test locally (optional but recommended)
npm run dev
# Open http://localhost:5173 and verify

# 3. Build production bundle
npm run build

# 4. Deploy to S3
aws s3 sync dist/ s3://energyinsights-development-frontend-development/ --delete

# 5. Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E18FPAPGJR8ZNO --paths "/*"

# 6. Wait 1-2 minutes, then test
# Open https://d2hkqpgqguj4do.cloudfront.net
```

### For Backend-Only Changes:

```bash
# 1. Make your changes to cdk/lambda-functions/
vim cdk/lambda-functions/chat/handler.ts

# 2. Deploy backend
cd cdk
npm run deploy

# 3. Test backend directly
node test-chat-api.sh
```

### For Full-Stack Changes:

```bash
# 1. Make backend changes
vim cdk/lambda-functions/renewable-orchestrator/handler.ts

# 2. Deploy backend FIRST
cd cdk
npm run deploy
cd ..

# 3. Make frontend changes
vim src/components/ChatMessage.tsx

# 4. Build frontend
npm run build

# 5. Deploy frontend
aws s3 sync dist/ s3://energyinsights-development-frontend-development/ --delete

# 6. Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E18FPAPGJR8ZNO --paths "/*"

# 7. Wait and test
```

## Verification Checklist

Before claiming a fix is deployed:

### Frontend Deployment Verification:
```bash
# ✅ 1. Build completed successfully
npm run build
# Check for "✓ built in X.XXs"

# ✅ 2. Files uploaded to S3
aws s3 ls s3://energyinsights-development-frontend-development/assets/ | head -5
# Should show recent timestamps

# ✅ 3. CloudFront invalidation created
aws cloudfront create-invalidation --distribution-id E18FPAPGJR8ZNO --paths "/*"
# Should return invalidation ID

# ✅ 4. Invalidation completed (wait 1-2 minutes)
aws cloudfront get-invalidation --distribution-id E18FPAPGJR8ZNO --id <INVALIDATION_ID>
# Status should be "Completed"

# ✅ 5. Test in browser
# Open https://d2hkqpgqguj4do.cloudfront.net
# Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
# Verify changes are visible
```

### Backend Deployment Verification:
```bash
# ✅ 1. CDK deployment completed
cd cdk && npm run deploy
# Check for "✅ EnergyInsights-development"

# ✅ 2. Lambda updated (check timestamp)
aws lambda get-function --function-name EnergyInsights-development-chat \
  --query 'Configuration.LastModified'
# Should be within last 5 minutes

# ✅ 3. Test Lambda directly
node test-chat-api.sh
# Should return expected results
```

## Common Mistakes to Avoid

### ❌ MISTAKE 1: "I changed the code, it should work now"
**REALITY**: Code changes in your editor do NOT deploy automatically.

### ❌ MISTAKE 2: "I ran npm run build, it's deployed"
**REALITY**: Building locally does NOT deploy to S3. You must run `aws s3 sync`.

### ❌ MISTAKE 3: "I uploaded to S3, users should see it"
**REALITY**: CloudFront caches files. You must invalidate the cache.

### ❌ MISTAKE 4: "The test passed locally, so it's fixed"
**REALITY**: Local tests use local code. Production uses deployed code. They are different.

### ❌ MISTAKE 5: "I deployed yesterday, the changes should be there"
**REALITY**: Each code change requires a new deployment. Old deployments don't include new changes.

### ❌ MISTAKE 6: "CloudFront invalidation is instant"
**REALITY**: Invalidation takes 1-2 minutes to propagate. Wait before testing.

### ❌ MISTAKE 7: "Browser cache doesn't matter"
**REALITY**: Browser caches files. Users must hard refresh (Cmd+Shift+R) to see changes.

## Environment-Specific Information

### Development Environment:
- **S3 Bucket**: `energyinsights-development-frontend-development`
- **CloudFront Distribution**: `E18FPAPGJR8ZNO`
- **CloudFront URL**: `https://d2hkqpgqguj4do.cloudfront.net`
- **API Gateway URL**: `https://t4begsixg2.execute-api.us-east-1.amazonaws.com`
- **Stack Name**: `EnergyInsights-development`

### Key Resources:
```bash
# Frontend bucket
aws s3 ls s3://energyinsights-development-frontend-development/

# CloudFront distribution
aws cloudfront get-distribution --id E18FPAPGJR8ZNO

# API Gateway
aws apigatewayv2 get-api --api-id t4begsixg2

# Lambda functions
aws lambda list-functions --query "Functions[?contains(FunctionName, 'EnergyInsights-development')]"
```

## Deployment Scripts

### Quick Frontend Deploy Script:

Create `deploy-frontend.sh`:
```bash
#!/bin/bash
set -e

echo "🏗️  Building frontend..."
npm run build

echo "📤 Uploading to S3..."
aws s3 sync dist/ s3://energyinsights-development-frontend-development/ --delete

echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id E18FPAPGJR8ZNO \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "✅ Deployment complete!"
echo "📋 Invalidation ID: $INVALIDATION_ID"
echo "⏱️  Wait 1-2 minutes for cache invalidation"
echo "🌐 Test at: https://d2hkqpgqguj4do.cloudfront.net"
```

### Quick Backend Deploy Script:

Create `deploy-backend.sh`:
```bash
#!/bin/bash
set -e

echo "🏗️  Building and deploying backend..."
cd cdk
npm run deploy
cd ..

echo "✅ Backend deployment complete!"
echo "🧪 Test with: node test-orchestrator-terrain.js"
```

### Full Stack Deploy Script:

Create `deploy-all.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Full Stack Deployment"
echo "========================"

echo ""
echo "📦 Step 1: Deploy Backend"
cd cdk
npm run deploy
cd ..

echo ""
echo "📦 Step 2: Build Frontend"
npm run build

echo ""
echo "📦 Step 3: Upload to S3"
aws s3 sync dist/ s3://energyinsights-development-frontend-development/ --delete

echo ""
echo "📦 Step 4: Invalidate CloudFront"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id E18FPAPGJR8ZNO \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================"
echo "Backend: ✅ Deployed"
echo "Frontend: ✅ Deployed"
echo "CloudFront: ⏱️  Invalidating (ID: $INVALIDATION_ID)"
echo ""
echo "⏱️  Wait 1-2 minutes for CloudFront invalidation"
echo "🌐 Test at: https://d2hkqpgqguj4do.cloudfront.net"
echo "📡 API at: https://t4begsixg2.execute-api.us-east-1.amazonaws.com"
```

## Testing After Deployment

### Frontend Testing:
```bash
# 1. Wait for CloudFront invalidation (1-2 minutes)
sleep 120

# 2. Open in browser
open https://d2hkqpgqguj4do.cloudfront.net

# 3. Hard refresh to bypass browser cache
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R

# 4. Check browser console for errors
# Open DevTools (F12) and check Console tab

# 5. Verify changes are visible
# Test the specific feature you changed
```

### Backend Testing:
```bash
# Test specific Lambda functions
node test-orchestrator-terrain.js
node test-chat-api.sh
node test-renewable-e2e-validation.js

# Check CloudWatch logs
aws logs tail /aws/lambda/EnergyInsights-development-chat --since 5m --follow
```

## Emergency Rollback

If deployment breaks production:

### Frontend Rollback:
```bash
# 1. Revert code changes
git revert HEAD

# 2. Rebuild and redeploy
npm run build
aws s3 sync dist/ s3://energyinsights-development-frontend-development/ --delete
aws cloudfront create-invalidation --distribution-id E18FPAPGJR8ZNO --paths "/*"
```

### Backend Rollback:
```bash
# 1. Revert code changes
git revert HEAD

# 2. Redeploy CDK stack
cd cdk
npm run deploy
```

## Success Criteria

A deployment is ONLY complete when:

✅ Code changes committed to git
✅ Frontend built successfully (`npm run build`)
✅ Files uploaded to S3 (`aws s3 sync`)
✅ CloudFront cache invalidated
✅ Invalidation completed (Status: "Completed")
✅ Backend deployed (if backend changes made)
✅ Lambda timestamps are recent (within 5 minutes)
✅ Tested in browser at CloudFront URL
✅ Hard refresh performed to bypass browser cache
✅ Changes are visible and working
✅ No console errors
✅ No CloudWatch errors
✅ User has validated the fix

## Remember

**CODE IN YOUR EDITOR ≠ CODE IN PRODUCTION**

**LOCAL BUILD ≠ DEPLOYED BUILD**

**"I CHANGED IT" ≠ "IT'S DEPLOYED"**

**ALWAYS BUILD. ALWAYS DEPLOY. ALWAYS INVALIDATE. ALWAYS TEST DEPLOYED CODE.**

---

*This document was created after repeatedly wasting time on undeployed frontend changes. Read it. Follow it. Stop wasting time.*
