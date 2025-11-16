# Manual CI/CD Setup Guide

**Set up automated deployment without GitHub CLI**

---

## Step 1: Create IAM User for GitHub Actions

### 1.1 Create User

```bash
# Create IAM user
aws iam create-user --user-name github-actions-deploy

# Attach AdministratorAccess policy (simplest - restrict in production)
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access key
aws iam create-access-key --user-name github-actions-deploy --output json
```

### 1.2 Save Credentials

The output will look like:
```json
{
  "AccessKey": {
    "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    ...
  }
}
```

**Save these values - you'll need them in Step 2!**

---

## Step 2: Add GitHub Secrets

### 2.1 Go to GitHub Repository Settings

1. Open your repository on GitHub
2. Click **Settings** (top right)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2.2 Add Three Secrets

#### Secret 1: AWS_ACCESS_KEY_ID
- Name: `AWS_ACCESS_KEY_ID`
- Value: Your access key ID from Step 1.2
- Click **Add secret**

#### Secret 2: AWS_SECRET_ACCESS_KEY
- Name: `AWS_SECRET_ACCESS_KEY`
- Value: Your secret access key from Step 1.2
- Click **Add secret**

#### Secret 3: VITE_API_URL
- Name: `VITE_API_URL`
- Value: Get it with this command:
  ```bash
  aws cloudformation describe-stacks \
    --stack-name EnergyInsights-development \
    --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
    --output text
  ```
- Should be: `https://hbt1j807qf.execute-api.us-east-1.amazonaws.com`
- Click **Add secret**

### 2.3 Verify Secrets

You should now see three secrets listed:
- ✅ AWS_ACCESS_KEY_ID
- ✅ AWS_SECRET_ACCESS_KEY
- ✅ VITE_API_URL

---

## Step 3: Verify Workflow Configuration

### 3.1 Check Workflow File

The file `.github/workflows/deploy-production.yml` should already exist.

### 3.2 Verify Configuration Values

Open `.github/workflows/deploy-production.yml` and check these values:

```yaml
env:
  AWS_REGION: us-east-1  # ✅ Correct
  STACK_NAME: EnergyInsights-development  # ✅ Correct
  CLOUDFRONT_DISTRIBUTION_ID: E3O1QDG49S3NGP  # ✅ Correct
```

If any values are different, update them.

---

## Step 4: Commit and Push

### 4.1 Stage Files

```bash
git add .github/workflows/deploy-production.yml
git add scripts/setup-github-actions.sh
git add docs/GITHUB_ACTIONS_SETUP.md
git add docs/AWS_CODEPIPELINE_SETUP.md
git add docs/CICD_PIPELINE_DIAGRAM.md
git add CICD_QUICK_START.md
git add MANUAL_CICD_SETUP.md
```

### 4.2 Commit

```bash
git commit -m "Add CI/CD pipeline with GitHub Actions"
```

### 4.3 Push to Main

```bash
git push origin main
```

**This will trigger your first automated deployment!** 🚀

---

## Step 5: Monitor Deployment

### 5.1 View Workflow Run

1. Go to your GitHub repository
2. Click **Actions** tab (top)
3. You should see "Deploy to Production" running

### 5.2 Watch Progress

Click on the workflow run to see:
- ✅ Test job
- ⏳ Deploy Backend job (in progress)
- ⏳ Deploy Frontend job (waiting)
- ⏳ Verify job (waiting)

### 5.3 View Logs

Click on any job to see detailed logs of what's happening.

---

## Step 6: Verify Deployment

### 6.1 Wait for Completion

The workflow should complete in ~10-20 minutes.

### 6.2 Check Status

Once complete, you should see:
- ✅ Test
- ✅ Deploy Backend
- ✅ Deploy Frontend
- ✅ Verify

### 6.3 Test Application

**Frontend:**
```bash
open https://d36sq31aqkfe46.cloudfront.net
```

**API:**
```bash
curl https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/health
```

---

## Troubleshooting

### Issue: Workflow Not Triggering

**Check:**
1. Workflow file is in `.github/workflows/` directory
2. File is named `deploy-production.yml`
3. You pushed to `main` branch (not `master` or other)

**Fix:**
```bash
git branch  # Verify you're on main
git push origin main  # Push again
```

### Issue: Authentication Failed

**Error in logs:** `Unable to locate credentials`

**Check:**
1. Secrets are added in GitHub (Settings → Secrets → Actions)
2. Secret names are exactly: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `VITE_API_URL`
3. No extra spaces in secret values

**Fix:**
1. Delete and re-add secrets in GitHub
2. Re-run workflow: Actions → Failed workflow → Re-run all jobs

### Issue: CDK Deploy Failed

**Error in logs:** `Stack is in UPDATE_ROLLBACK_COMPLETE state`

**Fix:**
```bash
cd cdk
aws cloudformation delete-stack --stack-name EnergyInsights-development
# Wait for deletion to complete
cdk deploy
# Then re-run GitHub Actions workflow
```

### Issue: Frontend Not Updating

**Problem:** Changes not visible after deployment

**Fix:**
1. Check CloudFront invalidation completed (in workflow logs)
2. Clear browser cache: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
3. Wait 5-10 minutes for CloudFront to propagate

---

## Manual Deployment (Without Push)

### Trigger Manually

1. Go to GitHub → Actions
2. Click "Deploy to Production"
3. Click "Run workflow" button (top right)
4. Select branch: `main`
5. Click "Run workflow"

---

## Next Steps

### Enable Notifications

**Email:**
1. GitHub → Settings (your profile) → Notifications
2. Enable "Actions" notifications

**Slack (Optional):**
See `docs/GITHUB_ACTIONS_SETUP.md` for Slack integration

### Set Up Staging Environment

Create a separate workflow for staging:
1. Copy `deploy-production.yml` to `deploy-staging.yml`
2. Change trigger to `develop` branch
3. Change stack name to `EnergyInsights-staging`

### Add Approval Step

Require manual approval before production:
1. GitHub → Settings → Environments
2. Create environment: `production`
3. Add required reviewers
4. Update workflow to use environment

---

## Summary

✅ **What You Did:**
1. Created IAM user for GitHub Actions
2. Added AWS credentials to GitHub Secrets
3. Committed and pushed workflow file
4. Triggered first automated deployment

✅ **What Happens Now:**
- Every push to `main` triggers automatic deployment
- Tests run first
- Backend deploys (CDK)
- Frontend deploys (S3/CloudFront)
- Verification checks run
- You get notified of success/failure

✅ **Deployment Time:**
- ~10-20 minutes per deployment
- Completely automated
- No manual steps required

---

## Quick Reference

### Get Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].Outputs" \
  --output table
```

### Check Deployment Status
```bash
aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].StackStatus" \
  --output text
```

### View Lambda Logs
```bash
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow
```

### Invalidate CloudFront Manually
```bash
aws cloudfront create-invalidation \
  --distribution-id E3O1QDG49S3NGP \
  --paths "/*"
```

---

## Support

- **Full Documentation:** `docs/GITHUB_ACTIONS_SETUP.md`
- **Quick Start:** `CICD_QUICK_START.md`
- **Pipeline Diagrams:** `docs/CICD_PIPELINE_DIAGRAM.md`
- **Deployment Guide:** `docs/CDK_DEPLOYMENT_GUIDE.md`

---

**You're all set! Push to main and watch the magic happen! ✨**

**Last Updated:** November 16, 2025
