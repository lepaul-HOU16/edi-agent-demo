# Deployment Troubleshooting Guide

## Common GitHub Actions Deployment Failures

### 1. Missing GitHub Secrets

**Error:** `Unable to locate credentials` or `The security token included in the request is invalid`

**Cause:** GitHub secrets not configured

**Fix:**
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add these three secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `VITE_API_URL`
3. Re-run the workflow

**Verify secrets exist:**
```bash
# If you have GitHub CLI
gh secret list

# Should show:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# VITE_API_URL
```

---

### 2. Test Job Failed

**Error:** Linting or test failures

**Cause:** Code doesn't pass linting or tests

**Fix:**
```bash
# Run locally to see errors
npm run lint
npm test

# Fix any errors, then push again
```

**Quick fix in workflow:**
The workflow already has `|| true` for tests, so they shouldn't block deployment. If they are, check the workflow file.

---

### 3. CDK Deploy Failed

**Error:** `Stack is in UPDATE_ROLLBACK_COMPLETE state` or CDK deployment errors

**Cause:** Previous failed deployment or stack in bad state

**Fix:**
```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].StackStatus"

# If in bad state, delete and redeploy
cd cdk
aws cloudformation delete-stack --stack-name EnergyInsights-development
# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name EnergyInsights-development
# Redeploy
cdk deploy
```

---

### 4. Build Failed

**Error:** `npm ci` or `npm run build` failed

**Cause:** Missing dependencies or build errors

**Fix:**
```bash
# Test build locally
npm ci
npm run build

# If it works locally, check:
# 1. package-lock.json is committed
# 2. No local-only dependencies
# 3. Node version matches (20.x)
```

---

### 5. Permission Denied

**Error:** `User: arn:aws:iam::xxx:user/github-actions-deploy is not authorized`

**Cause:** IAM user doesn't have required permissions

**Fix:**
```bash
# Attach AdministratorAccess (simplest)
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Or create custom policy with required permissions
```

---

### 6. Frontend Deploy Failed

**Error:** S3 sync or CloudFront invalidation failed

**Cause:** Bucket doesn't exist or permissions issue

**Fix:**
```bash
# Check bucket exists
aws s3 ls s3://energyinsights-development-frontend-development/

# If not, create it
aws s3 mb s3://energyinsights-development-frontend-development

# Check CloudFront distribution
aws cloudfront get-distribution --id E3O1QDG49S3NGP
```

---

## Debugging Steps

### Step 1: Check GitHub Actions Logs

1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
2. Click on the failed workflow run
3. Click on the failed job (Test, Deploy Backend, Deploy Frontend, or Verify)
4. Expand the failed step
5. Read the error message

### Step 2: Check Which Job Failed

**If Test job failed:**
- Check linting errors
- Check test failures
- Fix code and push again

**If Deploy Backend job failed:**
- Check AWS credentials
- Check CDK stack status
- Check IAM permissions

**If Deploy Frontend job failed:**
- Check S3 bucket exists
- Check CloudFront distribution exists
- Check AWS credentials

**If Verify job failed:**
- This is usually informational
- Check if stack actually deployed
- Check if frontend is accessible

### Step 3: Run Locally

Test the deployment steps locally:

```bash
# Test build
npm ci
npm run build

# Test CDK
cd cdk
npm ci
npm run build
cdk diff
# Don't run cdk deploy unless you want to deploy

# Test frontend build
cd ..
npm run build
ls -la dist/
```

### Step 4: Check AWS Resources

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development

# Check recent stack events
aws cloudformation describe-stack-events \
  --stack-name EnergyInsights-development \
  --max-items 20

# Check Lambda functions
aws lambda list-functions \
  --query "Functions[?contains(FunctionName, 'EnergyInsights-development')].FunctionName"

# Check S3 bucket
aws s3 ls s3://energyinsights-development-frontend-development/
```

---

## Quick Fixes

### Fix 1: Re-run Workflow

Sometimes transient errors occur. Just re-run:

1. Go to GitHub Actions
2. Click on failed workflow
3. Click "Re-run all jobs"

### Fix 2: Reset GitHub Secrets

Delete and re-add secrets:

```bash
# If you have GitHub CLI
gh secret delete AWS_ACCESS_KEY_ID
gh secret delete AWS_SECRET_ACCESS_KEY
gh secret delete VITE_API_URL

# Then add them again
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set VITE_API_URL
```

### Fix 3: Reset CDK Stack

If CDK is in a bad state:

```bash
cd cdk

# Destroy stack
cdk destroy

# Redeploy
cdk deploy

# Then re-run GitHub Actions workflow
```

### Fix 4: Check Node Version

Ensure Node 20.x is used:

```bash
# Check local version
node --version  # Should be v20.x

# GitHub Actions uses Node 20 (specified in workflow)
```

---

## Common Error Messages

### "Error: Cannot find module"

**Fix:**
```bash
# Ensure package-lock.json is committed
git add package-lock.json cdk/package-lock.json
git commit -m "Add package-lock.json"
git push
```

### "Error: Stack is in UPDATE_ROLLBACK_COMPLETE state"

**Fix:**
```bash
cd cdk
cdk destroy
cdk deploy
```

### "Error: The security token included in the request is invalid"

**Fix:**
- Check AWS credentials in GitHub Secrets
- Ensure IAM user exists and has access keys
- Regenerate access keys if needed

### "Error: Access Denied"

**Fix:**
```bash
# Attach more permissive policy
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

---

## Get Help

### View Detailed Logs

**GitHub Actions:**
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

**CloudWatch Logs:**
```bash
# View Lambda logs
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow

# View API Gateway logs
aws logs tail /aws/apigateway/EnergyInsights-development-http-api --follow
```

**CloudFormation Events:**
```bash
aws cloudformation describe-stack-events \
  --stack-name EnergyInsights-development \
  --max-items 50
```

### Check Deployment Status

```bash
bash scripts/check-deployment-status.sh
```

---

## Prevention

### Before Pushing

1. **Test locally:**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

2. **Check AWS credentials:**
   ```bash
   aws sts get-caller-identity
   ```

3. **Verify stack is healthy:**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name EnergyInsights-development \
     --query "Stacks[0].StackStatus"
   ```

### After Pushing

1. **Monitor GitHub Actions immediately**
2. **Check for errors in first 2-3 minutes**
3. **Be ready to fix and re-push**

---

## Emergency Rollback

If deployment breaks production:

```bash
# Rollback CloudFormation stack
aws cloudformation rollback-stack \
  --stack-name EnergyInsights-development

# Or restore previous version
git revert HEAD
git push origin main
```

---

## Contact Information

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **AWS CDK Docs:** https://docs.aws.amazon.com/cdk/
- **CloudFormation Docs:** https://docs.aws.amazon.com/cloudformation/

---

**Last Updated:** November 16, 2025
