# GitHub Actions CI/CD Setup Guide

This guide will help you set up automated deployment to production when you push to the `main` branch.

---

## Overview

The CI/CD pipeline consists of 4 jobs:

1. **Test** - Run linter, tests, and build frontend
2. **Deploy Backend** - Deploy CDK stack to AWS
3. **Deploy Frontend** - Build and deploy frontend to S3/CloudFront
4. **Verify** - Verify deployment succeeded

**Trigger:** Automatic on push to `main` branch, or manual via GitHub Actions UI

---

## Prerequisites

### 1. GitHub Repository

Ensure your code is pushed to a GitHub repository.

### 2. AWS IAM User for GitHub Actions

Create an IAM user with programmatic access for GitHub Actions.

#### Required Permissions

The IAM user needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "s3:*",
        "cloudfront:*",
        "cognito-idp:*",
        "iam:*",
        "logs:*",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

**Note:** For production, use more restrictive permissions scoped to specific resources.

#### Create IAM User

```bash
# Create IAM user
aws iam create-user --user-name github-actions-deploy

# Attach policy (use a custom policy with above permissions)
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access key
aws iam create-access-key --user-name github-actions-deploy
```

Save the `AccessKeyId` and `SecretAccessKey` - you'll need these for GitHub Secrets.

---

## Setup Steps

### Step 1: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### Required Secrets

1. **AWS_ACCESS_KEY_ID**
   - Value: Your IAM user's access key ID
   - Example: `AKIAIOSFODNN7EXAMPLE`

2. **AWS_SECRET_ACCESS_KEY**
   - Value: Your IAM user's secret access key
   - Example: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

3. **VITE_API_URL**
   - Value: Your API Gateway URL
   - Example: `https://hbt1j807qf.execute-api.us-east-1.amazonaws.com`

#### How to Add Secrets

```bash
# In GitHub UI:
Repository → Settings → Secrets and variables → Actions → New repository secret

# Or using GitHub CLI:
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set VITE_API_URL
```

### Step 2: Update Workflow Configuration

Edit `.github/workflows/deploy-production.yml` if needed:

```yaml
env:
  AWS_REGION: us-east-1  # Change if using different region
  STACK_NAME: EnergyInsights-development  # Change if using different stack name
  CLOUDFRONT_DISTRIBUTION_ID: E3O1QDG49S3NGP  # Change to your distribution ID
```

### Step 3: Commit and Push Workflow

```bash
git add .github/workflows/deploy-production.yml
git commit -m "Add GitHub Actions CI/CD pipeline"
git push origin main
```

This will trigger the first deployment!

---

## Workflow Details

### Job 1: Test

```yaml
- Checkout code
- Setup Node.js 20
- Install dependencies
- Run linter
- Run tests
- Build frontend
```

**Duration:** ~2-3 minutes

### Job 2: Deploy Backend

```yaml
- Checkout code
- Setup Node.js 20
- Configure AWS credentials
- Install dependencies
- Build CDK
- Show CDK diff
- Deploy CDK stack
- Verify deployment
```

**Duration:** ~5-10 minutes

### Job 3: Deploy Frontend

```yaml
- Checkout code
- Setup Node.js 20
- Configure AWS credentials
- Install dependencies
- Build frontend
- Get S3 bucket name from stack outputs
- Deploy to S3 with cache headers
- Invalidate CloudFront cache
- Wait for invalidation to complete
```

**Duration:** ~3-5 minutes

### Job 4: Verify

```yaml
- Configure AWS credentials
- Verify stack status
- Get frontend URL
- Test frontend accessibility
- Test API health
- Print deployment summary
```

**Duration:** ~1-2 minutes

**Total Pipeline Duration:** ~10-20 minutes

---

## Monitoring Deployments

### View Workflow Runs

1. Go to your GitHub repository
2. Click "Actions" tab
3. See all workflow runs and their status

### View Logs

1. Click on a workflow run
2. Click on a job (Test, Deploy Backend, etc.)
3. Expand steps to see detailed logs

### Workflow Status Badge

Add to your README.md:

```markdown
![Deploy to Production](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy-production.yml/badge.svg)
```

---

## Manual Deployment

You can manually trigger a deployment:

1. Go to Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

Or using GitHub CLI:

```bash
gh workflow run deploy-production.yml
```

---

## Troubleshooting

### Deployment Fails: AWS Credentials

**Error:** `Unable to locate credentials`

**Solution:**
1. Verify secrets are set correctly in GitHub
2. Check IAM user has correct permissions
3. Verify access key is active

```bash
# Test credentials locally
aws sts get-caller-identity
```

### Deployment Fails: CDK Bootstrap

**Error:** `This stack uses assets, so the toolkit stack must be deployed`

**Solution:** Bootstrap CDK in your AWS account

```bash
cd cdk
npx cdk bootstrap aws://ACCOUNT-ID/REGION
```

### Deployment Fails: Stack Update

**Error:** `Stack is in UPDATE_ROLLBACK_COMPLETE state`

**Solution:** Delete and redeploy stack

```bash
cd cdk
npx cdk destroy
npx cdk deploy
```

### Frontend Not Updating

**Issue:** Changes not visible after deployment

**Solution:**
1. Check CloudFront invalidation completed
2. Clear browser cache (Ctrl+Shift+R)
3. Check S3 bucket has new files

```bash
# Check invalidation status
aws cloudfront list-invalidations \
  --distribution-id E3O1QDG49S3NGP

# Check S3 files
aws s3 ls s3://energyinsights-development-frontend-development/
```

### Build Fails: Dependencies

**Error:** `Cannot find module`

**Solution:** Ensure package-lock.json is committed

```bash
git add package-lock.json cdk/package-lock.json
git commit -m "Add package-lock.json"
git push
```

---

## Advanced Configuration

### Deploy to Multiple Environments

Create separate workflows for staging and production:

**.github/workflows/deploy-staging.yml**
```yaml
name: Deploy to Staging
on:
  push:
    branches:
      - develop
env:
  STACK_NAME: EnergyInsights-staging
  CLOUDFRONT_DISTRIBUTION_ID: YOUR_STAGING_DIST_ID
```

**.github/workflows/deploy-production.yml**
```yaml
name: Deploy to Production
on:
  push:
    branches:
      - main
env:
  STACK_NAME: EnergyInsights-production
  CLOUDFRONT_DISTRIBUTION_ID: YOUR_PROD_DIST_ID
```

### Add Approval Step

Require manual approval before production deployment:

```yaml
deploy-backend:
  name: Deploy CDK Backend
  runs-on: ubuntu-latest
  needs: test
  environment:
    name: production
    url: https://d36sq31aqkfe46.cloudfront.net
  # ... rest of job
```

Then in GitHub:
1. Settings → Environments → New environment
2. Name: `production`
3. Add required reviewers
4. Save

### Slack Notifications

Add Slack notifications on deployment success/failure:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to production ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Rollback on Failure

Add automatic rollback if verification fails:

```yaml
- name: Rollback on failure
  if: failure()
  working-directory: cdk
  run: |
    aws cloudformation rollback-stack \
      --stack-name ${{ env.STACK_NAME }}
```

---

## Security Best Practices

### 1. Use OIDC Instead of Access Keys

For better security, use OpenID Connect (OIDC) instead of long-lived access keys:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT-ID:role/GitHubActionsRole
    aws-region: us-east-1
```

Setup:
1. Create IAM role with trust policy for GitHub
2. Attach required permissions to role
3. Update workflow to use role ARN

### 2. Least Privilege Permissions

Create custom IAM policy with only required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:DescribeStacks",
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DescribeStackEvents"
      ],
      "Resource": "arn:aws:cloudformation:us-east-1:ACCOUNT-ID:stack/EnergyInsights-*"
    }
  ]
}
```

### 3. Rotate Access Keys

Rotate IAM user access keys regularly:

```bash
# Create new key
aws iam create-access-key --user-name github-actions-deploy

# Update GitHub secrets with new key

# Delete old key
aws iam delete-access-key \
  --user-name github-actions-deploy \
  --access-key-id OLD_KEY_ID
```

### 4. Use Environment Secrets

Store production secrets in GitHub Environment:

1. Settings → Environments → production
2. Add environment secrets
3. Require approval for production deployments

---

## Cost Considerations

### GitHub Actions Minutes

- **Free tier:** 2,000 minutes/month for private repos
- **This pipeline:** ~15 minutes per deployment
- **Estimated usage:** ~133 deployments/month on free tier

### AWS Costs

Deployment costs are minimal:
- CloudFormation: Free
- S3 API calls: ~$0.01 per deployment
- CloudFront invalidations: $0.005 per path (first 1,000 free)

**Total deployment cost:** ~$0.01-0.02 per deployment

---

## Monitoring and Alerts

### CloudWatch Alarms

Set up alarms for deployment failures:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name deployment-failures \
  --alarm-description "Alert on deployment failures" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

### GitHub Actions Notifications

Enable email notifications:
1. GitHub → Settings → Notifications
2. Enable "Actions" notifications
3. Choose email or web notifications

---

## Next Steps

1. ✅ Set up GitHub secrets
2. ✅ Push workflow to main branch
3. ✅ Monitor first deployment
4. ✅ Test deployed application
5. ⏭️ Set up staging environment
6. ⏭️ Add approval workflow for production
7. ⏭️ Set up monitoring and alerts
8. ⏭️ Configure Slack notifications

---

## Additional Resources

- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **AWS CDK CI/CD:** https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html
- **AWS Actions:** https://github.com/aws-actions
- **Workflow Syntax:** https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions

---

**Last Updated:** November 16, 2025
