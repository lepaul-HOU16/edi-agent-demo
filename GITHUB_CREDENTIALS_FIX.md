# GitHub Actions Credentials Fix

## Problem Fixed

The GitHub Actions workflow had inconsistent credential configuration between jobs. The `verify` job was using the `aws-actions/configure-aws-credentials@v4` action while other jobs used environment variables directly. This has been fixed to use consistent environment variable configuration across all jobs.

## Changes Made

### 1. Updated `.github/workflows/deploy-production.yml`

**Before:**
```yaml
verify:
  steps:
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Verify stack status
      run: aws cloudformation describe-stacks ...
```

**After:**
```yaml
verify:
  steps:
    - name: Verify stack status
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_DEFAULT_REGION: ${{ env.AWS_REGION }}
      run: aws cloudformation describe-stacks ...
```

All steps in the `verify` job now use environment variables consistently with the rest of the workflow.

### 2. Created Verification Script

Created `scripts/verify-github-secrets.sh` to help verify that GitHub secrets are properly configured.

## How to Use

### Step 1: Verify GitHub Secrets

Run the verification script:

```bash
bash scripts/verify-github-secrets.sh
```

This will check:
- ✅ GitHub CLI is installed and authenticated
- ✅ All required secrets are configured
- ✅ AWS credentials work locally (optional)

### Step 2: Add Missing Secrets (if needed)

If secrets are missing, add them using GitHub CLI:

```bash
# Add AWS Access Key ID
gh secret set AWS_ACCESS_KEY_ID
# Paste your access key when prompted

# Add AWS Secret Access Key
gh secret set AWS_SECRET_ACCESS_KEY
# Paste your secret key when prompted

# Add API URL
gh secret set VITE_API_URL
# Paste your API URL when prompted (e.g., https://hbt1j807qf.execute-api.us-east-1.amazonaws.com)
```

Or add them via GitHub UI:
1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `VITE_API_URL`

### Step 3: Get AWS Credentials

If you don't have AWS credentials yet, create an IAM user:

```bash
# Create IAM user
aws iam create-user --user-name github-actions-deploy

# Attach administrator access (or use more restrictive policy)
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access key
aws iam create-access-key --user-name github-actions-deploy
```

Save the `AccessKeyId` and `SecretAccessKey` from the output.

### Step 4: Get API URL

Get your API Gateway URL from CloudFormation:

```bash
aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
  --output text
```

Example output: `https://hbt1j807qf.execute-api.us-east-1.amazonaws.com`

### Step 5: Test the Workflow

#### Option A: Push to Main Branch

```bash
git add .
git commit -m "Fix GitHub Actions credentials configuration"
git push origin main
```

Then watch the workflow run:
```bash
# Open in browser
gh workflow view deploy-production.yml --web

# Or watch in terminal
gh run watch
```

#### Option B: Trigger Manually

```bash
gh workflow run deploy-production.yml
```

Then watch the run:
```bash
gh run watch
```

## Verification Checklist

After pushing, verify the workflow succeeds:

- [ ] Test job completes successfully
- [ ] Deploy Backend job completes successfully
- [ ] Deploy Frontend job completes successfully
- [ ] Verify job completes successfully
- [ ] No credential errors in logs
- [ ] Stack status is UPDATE_COMPLETE or CREATE_COMPLETE
- [ ] Frontend is accessible
- [ ] API responds

## Common Issues and Solutions

### Issue 1: "Unable to locate credentials"

**Cause:** GitHub secrets not configured or incorrect

**Solution:**
```bash
# Verify secrets exist
gh secret list

# Should show:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# VITE_API_URL

# If missing, add them
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set VITE_API_URL
```

### Issue 2: "The security token included in the request is invalid"

**Cause:** AWS credentials are incorrect or expired

**Solution:**
```bash
# Test credentials locally
aws sts get-caller-identity

# If they work locally, regenerate and update GitHub secrets
aws iam create-access-key --user-name github-actions-deploy

# Update GitHub secrets with new keys
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
```

### Issue 3: "Access Denied"

**Cause:** IAM user doesn't have required permissions

**Solution:**
```bash
# Attach administrator access (simplest)
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Or create custom policy with required permissions
```

### Issue 4: Workflow runs but deployment fails

**Cause:** Various deployment issues

**Solution:**
1. Check GitHub Actions logs for specific error
2. Check CloudFormation stack status:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name EnergyInsights-development \
     --query "Stacks[0].StackStatus"
   ```
3. Check CloudFormation events:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name EnergyInsights-development \
     --max-items 20
   ```

## Testing Locally

Before pushing, test the deployment locally:

```bash
# Test build
npm ci
npm run build

# Test CDK deployment (dry run)
cd cdk
npm ci
npm run build
npx cdk diff

# Don't run 'cdk deploy' unless you want to deploy
```

## Monitoring

### Watch Workflow Runs

```bash
# List recent runs
gh run list --workflow=deploy-production.yml

# Watch latest run
gh run watch

# View specific run
gh run view RUN_ID
```

### Check Deployment Status

```bash
# Use the deployment status script
bash scripts/check-deployment-status.sh
```

## Rollback

If deployment fails and breaks production:

```bash
# Rollback CloudFormation stack
aws cloudformation rollback-stack \
  --stack-name EnergyInsights-development

# Or revert the commit
git revert HEAD
git push origin main
```

## Next Steps

1. ✅ Credentials configuration fixed
2. ✅ Verification script created
3. ⏭️ Add GitHub secrets
4. ⏭️ Test workflow
5. ⏭️ Monitor deployment
6. ⏭️ Verify application works

## Additional Resources

- **GitHub Secrets Documentation:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **AWS IAM Best Practices:** https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- **GitHub Actions Workflow Syntax:** https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions

---

**Last Updated:** November 16, 2025
