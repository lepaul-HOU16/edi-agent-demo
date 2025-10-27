# Project Persistence Deployment - Quick Start

## 🚀 Deploy in 3 Steps

### Step 1: Run Deployment Script
```bash
chmod +x scripts/deploy-project-persistence-code.sh
./scripts/deploy-project-persistence-code.sh
```

### Step 2: Wait for Deployment
- Script will build frontend (~2-5 min)
- Prompt to start Amplify sandbox
- Wait for "Deployed" message (~5-10 min)

### Step 3: Validate Deployment
```bash
npm run test:project-persistence-smoke
```

**Expected**: 10/10 tests pass ✅

## 📋 What Gets Deployed

### Backend
- ✅ Orchestrator Lambda with project persistence
- ✅ Tool Lambdas (terrain, layout, simulation, report)
- ✅ DynamoDB session context table
- ✅ AWS Location Service place index
- ✅ IAM permissions for S3, DynamoDB, Location Service

### Frontend
- ✅ Action buttons for next steps
- ✅ Consolidated dashboards
- ✅ Plotly wind rose visualization
- ✅ Simplified chain of thought display

## 🧪 Manual Testing

After smoke tests pass, test in UI:

```
1. Open: http://localhost:3000/chat/[session-id]

2. Test project creation:
   Query: "analyze terrain in West Texas at 35.0675, -101.3954"
   Expected: Project "west-texas-wind-farm" created

3. Test session context:
   Query: "optimize layout"
   Expected: Uses active project, auto-loads coordinates

4. Test project listing:
   Query: "list my renewable projects"
   Expected: Shows all projects with status
```

## ❌ Rollback (if needed)

```bash
# Revert code changes
git revert HEAD

# Restart sandbox
npx ampx sandbox
```

## 📚 Full Documentation

- **Deployment Guide**: `tests/TASK_15_4_DEPLOYMENT_GUIDE.md`
- **Completion Report**: `tests/TASK_15_4_DEPLOYMENT_COMPLETE.md`
- **Summary**: `tests/TASK_15_4_SUMMARY.md`

## ⏱️ Time Estimate

- Frontend build: 2-5 minutes
- Backend deployment: 5-10 minutes
- Smoke tests: 1-2 minutes
- **Total: 8-17 minutes**

## ✅ Success Criteria

- [x] All 10 smoke tests pass
- [x] Project creation works
- [x] Session context persists
- [x] Action buttons appear
- [x] Dashboards display
- [x] No CloudWatch errors

## 🆘 Need Help?

See troubleshooting guide in:
`tests/TASK_15_4_DEPLOYMENT_GUIDE.md`

---

**Ready to deploy?** Run: `./scripts/deploy-project-persistence-code.sh`
