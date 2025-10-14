# Orchestrator Diagnostic Panel - Quick Start Guide

**Task 18: Run diagnostic panel tests**  
**Requirements: 6.1, 6.2, 6.3, 6.4, 6.5**

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Deploy Backend (if not already running)
```bash
npx ampx sandbox --stream-function-logs
```

### Step 3: Access Test Page
Open in browser: **http://localhost:3000/diagnostics**

### Step 4: Sign In
Use your AWS Amplify credentials

### Step 5: Run Diagnostics
1. Click **"Run Full Diagnostics"** button
2. Wait 5-10 seconds for results
3. Verify all checks pass (green ✓)

### Step 6: Test Failure Scenario
1. Stop sandbox (Ctrl+C)
2. Wait 30 seconds
3. Click **"Run Full Diagnostics"** again
4. Verify appropriate checks fail (red ✗)
5. Verify remediation steps appear

## ✅ Success Criteria

### When Orchestrator is Deployed:
- ✓ Overall Status: **Healthy** (green)
- ✓ Total Checks: 3
- ✓ Passed: 3
- ✓ Failed: 0
- ✓ CloudWatch links appear
- ✓ Next Steps: "All systems operational"

### When Orchestrator is NOT Deployed:
- ✓ Overall Status: **Unhealthy** (red)
- ✓ "Check Orchestrator Exists" fails
- ✓ Recommendations appear
- ✓ Next Steps provide deployment guidance

## 🧪 Automated Tests

Run automated API tests:
```bash
# Full test suite
node scripts/test-diagnostic-panel.js

# Quick check only
node scripts/test-diagnostic-panel.js --quick
```

Expected output:
```
Total Tests: 5
Passed: 5
Failed: 0
✓ Orchestrator is HEALTHY and ready to use
```

## 📋 Quick Checklist

- [ ] Panel renders correctly
- [ ] Quick Check works (1-2 seconds)
- [ ] Full Diagnostics works (5-10 seconds)
- [ ] All checks pass when deployed
- [ ] Appropriate checks fail when not deployed
- [ ] Remediation steps display for failures
- [ ] CloudWatch links are functional
- [ ] Summary statistics are accurate
- [ ] Expandable details work
- [ ] Multiple runs work correctly
- [ ] Callback logs to console
- [ ] Error handling works

## 📚 Detailed Documentation

For comprehensive test cases and instructions:
- **Full Guide:** `docs/TASK18_DIAGNOSTIC_PANEL_TESTING.md`
- **Manual Tests:** `tests/manual/orchestrator-diagnostics-ui-test.html`

## 🎯 Mark Task Complete

Once all tests pass:
1. Update task status in `.kiro/specs/fix-renewable-orchestrator-flow/tasks.md`
2. Mark task 18 as complete: `[x] 18. Run diagnostic panel tests`
3. Proceed to task 19: Document findings and fixes

## 🆘 Need Help?

**Common Issues:**
- **"Authentication required"** → Sign in to the application
- **All checks fail** → Run `npx ampx sandbox` to deploy
- **CloudWatch links don't work** → Sign in to AWS Console
- **Panel doesn't render** → Check browser console for errors

**Support:**
- See troubleshooting section in `docs/TASK18_DIAGNOSTIC_PANEL_TESTING.md`
- Check CloudWatch logs for detailed error information
- Review diagnostic panel implementation in `src/components/renewable/OrchestratorDiagnosticPanel.tsx`
