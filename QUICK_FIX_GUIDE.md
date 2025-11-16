# Quick Fix Guide - GitHub Actions Credentials

## 🚀 Fast Track (3 Steps)

### 1. Run Interactive Setup
```bash
bash scripts/setup-github-secrets-interactive.sh
```

### 2. Push Changes
```bash
git add .
git commit -m "Fix GitHub Actions credentials"
git push origin main
```

### 3. Watch Deployment
```bash
gh run watch
```

---

## 📋 Manual Setup (If Interactive Fails)

### Step 1: Add Secrets
```bash
gh secret set AWS_ACCESS_KEY_ID
# Paste your AWS access key

gh secret set AWS_SECRET_ACCESS_KEY
# Paste your AWS secret key

gh secret set VITE_API_URL
# Paste your API URL (e.g., https://xxx.execute-api.us-east-1.amazonaws.com)
```

### Step 2: Verify
```bash
bash scripts/verify-github-secrets.sh
```

### Step 3: Deploy
```bash
git push origin main
```

---

## 🔍 Troubleshooting

### Check Secrets
```bash
gh secret list
```

Should show:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- VITE_API_URL

### Test AWS Credentials
```bash
aws sts get-caller-identity
```

### View Workflow Logs
```bash
gh run list
gh run view --log
```

---

## 📚 Need More Help?

- **Detailed Guide:** `GITHUB_CREDENTIALS_FIX.md`
- **Full Summary:** `CREDENTIALS_FIX_SUMMARY.md`
- **Troubleshooting:** `DEPLOYMENT_TROUBLESHOOTING.md`

---

## ✅ Success Checklist

- [ ] GitHub CLI installed (`brew install gh`)
- [ ] GitHub CLI authenticated (`gh auth login`)
- [ ] AWS credentials obtained
- [ ] API URL obtained
- [ ] Secrets added to GitHub
- [ ] Secrets verified (`gh secret list`)
- [ ] Changes pushed to main
- [ ] Workflow running successfully

---

**Time to Complete:** 5-10 minutes

**Last Updated:** November 16, 2025
