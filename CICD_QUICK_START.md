# CI/CD Quick Start Guide

**Automated deployment to production on every push to `main` branch**

---

## 🚀 Quick Setup (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
bash scripts/setup-github-actions.sh
```

This will:
- ✅ Create IAM user for GitHub Actions
- ✅ Configure GitHub secrets
- ✅ Verify workflow configuration

### Option 2: Manual Setup

1. **Create IAM user:**
   ```bash
   aws iam create-user --user-name github-actions-deploy
   aws iam attach-user-policy \
     --user-name github-actions-deploy \
     --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
   aws iam create-access-key --user-name github-actions-deploy
   ```

2. **Add GitHub secrets:**
   - Go to: Repository → Settings → Secrets → Actions
   - Add:
     - `AWS_ACCESS_KEY_ID` - Your access key
     - `AWS_SECRET_ACCESS_KEY` - Your secret key
     - `VITE_API_URL` - Your API URL

3. **Push workflow:**
   ```bash
   git add .github/workflows/deploy-production.yml
   git commit -m "Add CI/CD pipeline"
   git push origin main
   ```

---

## 📋 What Gets Deployed

When you push to `main`:

1. **Tests Run** (~2 min)
   - Linting
   - Unit tests
   - Build verification

2. **Backend Deploys** (~5-10 min)
   - CDK stack update
   - Lambda functions
   - API Gateway
   - DynamoDB tables

3. **Frontend Deploys** (~3-5 min)
   - Build frontend
   - Upload to S3
   - Invalidate CloudFront

4. **Verification** (~1 min)
   - Check stack status
   - Test frontend accessibility
   - Test API health

**Total time:** ~10-20 minutes

---

## 🔍 Monitoring Deployments

### View in GitHub

1. Go to your repository
2. Click **Actions** tab
3. See all deployments and their status

### View Logs

Click on any deployment → Click on a job → Expand steps

### Get Notifications

- Email: GitHub → Settings → Notifications → Enable Actions
- Slack: Add Slack integration (see full docs)

---

## 🛠️ Common Tasks

### Manual Deployment

Trigger deployment without pushing:

```bash
# Via GitHub UI
Actions → Deploy to Production → Run workflow

# Via GitHub CLI
gh workflow run deploy-production.yml
```

### Rollback

If deployment fails:

```bash
# Rollback backend
cd cdk
aws cloudformation rollback-stack --stack-name EnergyInsights-development

# Rollback frontend
# Restore previous S3 version via AWS Console
```

### View Deployment Status

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query "Stacks[0].StackStatus"

# Check frontend
curl -I https://d36sq31aqkfe46.cloudfront.net
```

---

## ⚠️ Troubleshooting

### Deployment Fails: Credentials

**Error:** `Unable to locate credentials`

**Fix:**
```bash
# Verify secrets in GitHub
gh secret list

# Re-run setup
bash scripts/setup-github-actions.sh
```

### Deployment Fails: CDK

**Error:** `Stack is in UPDATE_ROLLBACK_COMPLETE`

**Fix:**
```bash
cd cdk
cdk destroy
cdk deploy
```

### Frontend Not Updating

**Fix:**
```bash
# Check invalidation
aws cloudfront list-invalidations \
  --distribution-id E3O1QDG49S3NGP

# Clear browser cache
Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

---

## 📚 Full Documentation

- **Setup Guide:** [docs/GITHUB_ACTIONS_SETUP.md](./docs/GITHUB_ACTIONS_SETUP.md)
- **Alternative (CodePipeline):** [docs/AWS_CODEPIPELINE_SETUP.md](./docs/AWS_CODEPIPELINE_SETUP.md)
- **Deployment Guide:** [docs/CDK_DEPLOYMENT_GUIDE.md](./docs/CDK_DEPLOYMENT_GUIDE.md)

---

## ✅ Checklist

Before first deployment:

- [ ] GitHub repository created
- [ ] AWS credentials configured
- [ ] CDK stack deployed manually once
- [ ] GitHub secrets configured
- [ ] Workflow file committed
- [ ] First push to main branch

After first deployment:

- [ ] Verify deployment succeeded in GitHub Actions
- [ ] Test frontend: https://d36sq31aqkfe46.cloudfront.net
- [ ] Test API: https://hbt1j807qf.execute-api.us-east-1.amazonaws.com
- [ ] Set up monitoring/alerts (optional)

---

## 💡 Tips

1. **Test locally first:** Always test changes locally before pushing
2. **Small commits:** Push small, incremental changes
3. **Monitor first deployment:** Watch the first deployment closely
4. **Set up notifications:** Enable email/Slack notifications
5. **Use branches:** Develop in feature branches, merge to main when ready

---

## 🎯 Next Steps

1. ✅ Run setup script
2. ✅ Push to main branch
3. ✅ Monitor deployment
4. ⏭️ Set up staging environment
5. ⏭️ Add approval workflow
6. ⏭️ Configure alerts

---

**Questions?** See full documentation in `docs/GITHUB_ACTIONS_SETUP.md`

**Last Updated:** November 16, 2025
