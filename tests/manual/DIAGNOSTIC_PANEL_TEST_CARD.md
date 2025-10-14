# 🔍 Orchestrator Diagnostic Panel - Test Card

**Quick Reference for Task 18**

## 🚀 Quick Access

| Resource | Location |
|----------|----------|
| **Test Page** | http://localhost:3000/diagnostics |
| **Manual Guide** | `tests/manual/orchestrator-diagnostics-ui-test.html` |
| **Quick Start** | `tests/manual/DIAGNOSTIC_PANEL_QUICK_START.md` |
| **Full Docs** | `docs/TASK18_DIAGNOSTIC_PANEL_TESTING.md` |

## ⚡ Quick Commands

```bash
# Start dev server
npm run dev

# Deploy backend
npx ampx sandbox --stream-function-logs

# Run automated tests
node scripts/test-diagnostic-panel.js

# Run quick check only
node scripts/test-diagnostic-panel.js --quick
```

## ✅ Quick Checklist

### When Orchestrator is Deployed:
- [ ] Overall Status: **Healthy** ✓
- [ ] Total Checks: 3
- [ ] Passed: 3, Failed: 0
- [ ] CloudWatch links appear
- [ ] Next Steps: "All systems operational"

### When Orchestrator is NOT Deployed:
- [ ] Overall Status: **Unhealthy** ✗
- [ ] "Check Orchestrator Exists" fails
- [ ] Recommendations appear
- [ ] Next Steps provide deployment guidance

## 🎯 Test Scenarios

### Scenario 1: Positive Test (Deployed)
1. Start: `npm run dev` + `npx ampx sandbox`
2. Open: http://localhost:3000/diagnostics
3. Click: "Run Full Diagnostics"
4. Verify: All 3 checks pass ✓

### Scenario 2: Negative Test (Not Deployed)
1. Stop sandbox: `Ctrl+C`
2. Wait: 30 seconds
3. Click: "Run Full Diagnostics"
4. Verify: Appropriate failures ✗

## 📊 Expected Results

### Healthy System
```
Status: Healthy ✓
Checks: 3/3 passed
Duration: ~1.5s
Links: 5 CloudWatch links
```

### Unhealthy System
```
Status: Unhealthy ✗
Checks: 1/2 passed
Recommendations: 3 steps
Next Steps: Deploy guidance
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Auth required | Sign in to app |
| All checks fail | Run `npx ampx sandbox` |
| Links don't work | Sign in to AWS Console |
| Panel doesn't render | Check browser console |

## 📋 Requirements

- [x] 6.1 - Verify orchestrator exists
- [x] 6.2 - Check availability
- [x] 6.3 - Clear error messages
- [x] 6.4 - Deployment guidance
- [x] 6.5 - Normal routing when healthy

## 🎓 Test Cases

1. Panel Renders
2. Quick Check
3. Full Diagnostics (Deployed)
4. Full Diagnostics (Not Deployed)
5. Expandable Details
6. CloudWatch Links
7. Summary Statistics
8. Authentication
9. Error Handling
10. Multiple Runs
11. Callback
12. Remediation Steps

## 📞 Support

- **Full Guide:** `docs/TASK18_DIAGNOSTIC_PANEL_TESTING.md`
- **Component:** `src/components/renewable/OrchestratorDiagnosticPanel.tsx`
- **API:** `src/app/api/renewable/diagnostics/route.ts`

---

**Task 18 Status:** ✅ COMPLETE  
**Next:** Task 19 - Document findings
