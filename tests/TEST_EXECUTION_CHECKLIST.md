# Test Execution Checklist

## ✅ Pre-Test Setup

- [ ] Terminal 1 open for sandbox
- [ ] Terminal 2 open for tests
- [ ] Browser open (for UI tests)
- [ ] This checklist ready

---

## 📋 Execution Steps

### 1. Start Sandbox
- [ ] Run: `npx ampx sandbox`
- [ ] Wait for "Deployed" message (5-10 min)
- [ ] Keep terminal open
- [ ] Note sandbox URL: _______________

### 2. Verify Deployment
- [ ] Run: `node tests/check-deployment-status.js`
- [ ] All checks pass ✅
- [ ] If fails, wait 2 more minutes and retry

### 3. Run Automated Smoke Test
- [ ] Run: `./tests/run-renewable-e2e-tests.sh smoke`
- [ ] Note results:
  - Terrain: ⬜ PASS ⬜ FAIL
  - Layout: ⬜ PASS ⬜ FAIL
  - Wind Rose: ⬜ PASS ⬜ FAIL
  - Wake: ⬜ PASS ⬜ FAIL
  - Report: ⬜ PASS ⬜ FAIL

### 4. Manual UI Verification
- [ ] Open browser to sandbox URL
- [ ] Navigate to chat interface
- [ ] Switch to Renewable Energy agent (if available)

**Test 1: Terrain**
- [ ] Paste: `Analyze terrain at coordinates 35.067482, -101.395466 in Texas`
- [ ] Wait for response
- [ ] Check: Map shows ~151 features ✅
- [ ] Check: Elevation data visible ✅
- [ ] Check: No errors ✅

**Test 2: Layout**
- [ ] Paste: `Optimize the turbine layout for this site with 25 turbines`
- [ ] Wait for response
- [ ] Check: Map shows 25 turbines ✅
- [ ] Check: Turbines positioned logically ✅
- [ ] Check: Metrics displayed ✅

**Test 3: Wind Rose**
- [ ] Paste: `Generate a wind rose analysis for this location`
- [ ] Wait for response
- [ ] Check: Wind rose chart appears ✅
- [ ] Check: Chart is interactive ✅
- [ ] Check: Data source shows NREL ✅

**Test 4: Wake Simulation**
- [ ] Paste: `Run a wake simulation for this wind farm layout`
- [ ] Wait for response
- [ ] Check: Wake visualization appears ✅
- [ ] Check: Energy loss data shown ✅
- [ ] Check: No errors ✅

**Test 5: Report**
- [ ] Paste: `Generate a comprehensive project report`
- [ ] Wait for response
- [ ] Check: Multi-panel dashboard ✅
- [ ] Check: All previous data included ✅
- [ ] Check: Professional formatting ✅

### 5. Check Browser Console
- [ ] Open DevTools (F12)
- [ ] Check Console tab
- [ ] Note any errors: _______________
- [ ] Note any warnings: _______________

### 6. Check CloudWatch Logs (if issues)
- [ ] Run: `aws logs tail /aws/lambda/[FUNCTION_NAME] --follow`
- [ ] Note any errors: _______________

---

## 📊 Results Summary

### Automated Tests
- **Total Tests:** 5
- **Passed:** _____ / 5
- **Failed:** _____ / 5
- **Pass Rate:** _____ %

### Manual UI Tests
- **Total Tests:** 5
- **Passed:** _____ / 5
- **Failed:** _____ / 5
- **Pass Rate:** _____ %

### Overall Status
- ⬜ All tests passed ✅
- ⬜ Some tests failed ⚠️
- ⬜ All tests failed ❌

---

## 🔍 Issues Found

### Issue 1
- **Test:** _______________
- **Expected:** _______________
- **Actual:** _______________
- **Error Message:** _______________
- **CloudWatch Logs:** _______________

### Issue 2
- **Test:** _______________
- **Expected:** _______________
- **Actual:** _______________
- **Error Message:** _______________
- **CloudWatch Logs:** _______________

---

## ⏱️ Performance Metrics

| Test | Target | Actual | Status |
|------|--------|--------|--------|
| Terrain | < 10s | ___s | ⬜ |
| Layout | < 10s | ___s | ⬜ |
| Wind Rose | < 8s | ___s | ⬜ |
| Wake | < 15s | ___s | ⬜ |
| Report | < 20s | ___s | ⬜ |

---

## 📝 Notes

### Environment
- **Date:** _______________
- **Tester:** _______________
- **Sandbox URL:** _______________
- **Browser:** _______________
- **AWS Region:** _______________

### Observations
- _______________________________________________
- _______________________________________________
- _______________________________________________

### Recommendations
- _______________________________________________
- _______________________________________________
- _______________________________________________

---

## ✅ Sign-Off

- [ ] All critical tests passed
- [ ] Issues documented
- [ ] Screenshots taken (if needed)
- [ ] Ready for next phase

**Tester Signature:** _______________
**Date:** _______________

---

## 🚀 Next Steps

### If All Passed
- [ ] Document success
- [ ] Move to production testing
- [ ] Update team

### If Some Failed
- [ ] Review CloudWatch logs
- [ ] Check troubleshooting guide
- [ ] Fix issues
- [ ] Re-test

### If All Failed
- [ ] Verify sandbox deployment
- [ ] Check environment variables
- [ ] Review deployment logs
- [ ] Contact support

---

**Testing Complete!** 🎉
