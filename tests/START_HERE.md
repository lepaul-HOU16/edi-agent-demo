# 🚀 START HERE - Renewable Energy Testing

## Welcome! Let's Test Your Renewable Energy Notebooks

This guide will get you from zero to testing in **under 5 minutes**.

---

## ⚡ Super Quick Start (3 Steps)

### Step 1: Start Sandbox (Terminal 1)
```bash
npx ampx sandbox
```
**Wait for:** "Deployed" message (5-10 minutes)  
**Keep this terminal open!**

### Step 2: Verify & Test (Terminal 2)
```bash
# Check deployment
node tests/check-deployment-status.js

# Run smoke test
./tests/run-renewable-e2e-tests.sh smoke
```

### Step 3: Check Results
Look for:
```
✅ Test 1: Terrain Analysis - PASS
✅ Test 2: Layout Optimization - PASS
✅ Test 3: Wind Rose - PASS
✅ Test 4: Wake Simulation - PASS
✅ Test 5: Report Generation - PASS

Overall: 5/5 tests passed (100%)
```

**Done!** 🎉

---

## 📚 Documentation Quick Links

### For Execution
- **[EXECUTE_TESTS_NOW.md](./EXECUTE_TESTS_NOW.md)** - Detailed step-by-step guide
- **[TEST_EXECUTION_CHECKLIST.md](./TEST_EXECUTION_CHECKLIST.md)** - Printable checklist
- **[COMMANDS_CHEAT_SHEET.md](./COMMANDS_CHEAT_SHEET.md)** - Copy-paste commands

### For Reference
- **[RENEWABLE_TESTING_INDEX.md](./RENEWABLE_TESTING_INDEX.md)** - Complete documentation index
- **[RENEWABLE_TEST_CHEAT_SHEET.md](./RENEWABLE_TEST_CHEAT_SHEET.md)** - Quick test prompts
- **[RENEWABLE_QUICK_TEST_GUIDE.md](./RENEWABLE_QUICK_TEST_GUIDE.md)** - Fast validation guide

### For Comprehensive Testing
- **[RENEWABLE_E2E_TEST_PROMPTS.md](./RENEWABLE_E2E_TEST_PROMPTS.md)** - All test scenarios
- **[RENEWABLE_WORKFLOW_DIAGRAM.md](./RENEWABLE_WORKFLOW_DIAGRAM.md)** - Visual workflow

---

## 🎯 Choose Your Path

### Path 1: I Just Want to Test (5 minutes)
1. Open **[EXECUTE_TESTS_NOW.md](./EXECUTE_TESTS_NOW.md)**
2. Follow Steps 1-3
3. Done!

### Path 2: I Want a Checklist (10 minutes)
1. Print **[TEST_EXECUTION_CHECKLIST.md](./TEST_EXECUTION_CHECKLIST.md)**
2. Check off each item as you go
3. Document results

### Path 3: I Need Commands Only (2 minutes)
1. Open **[COMMANDS_CHEAT_SHEET.md](./COMMANDS_CHEAT_SHEET.md)**
2. Copy-paste commands
3. Run tests

### Path 4: I Want to Understand Everything (30 minutes)
1. Read **[RENEWABLE_TESTING_INDEX.md](./RENEWABLE_TESTING_INDEX.md)**
2. Review **[RENEWABLE_WORKFLOW_DIAGRAM.md](./RENEWABLE_WORKFLOW_DIAGRAM.md)**
3. Run comprehensive tests from **[RENEWABLE_E2E_TEST_PROMPTS.md](./RENEWABLE_E2E_TEST_PROMPTS.md)**

---

## 🎬 What Happens When You Test

### Automated Tests Check:
1. ✅ Terrain analysis (151 features from OSM)
2. ✅ Layout optimization (turbine placement)
3. ✅ Wind rose generation (Plotly charts)
4. ✅ Wake simulation (energy analysis)
5. ✅ Report generation (comprehensive dashboard)

### You'll See:
- Interactive maps with real data
- Professional visualizations
- Performance metrics
- Action buttons for next steps
- Project persistence working

### You Won't See:
- ❌ "Visualization Unavailable" errors
- ❌ Blank maps or charts
- ❌ Infinite loading states
- ❌ Synthetic/fake data
- ❌ Page reload requirements

---

## 🚨 If Something Goes Wrong

### Sandbox Won't Start
```bash
pkill -f ampx
npx ampx sandbox
```

### Tests Fail
```bash
# Check logs
aws logs tail /aws/lambda/[FUNCTION_NAME] --follow

# Check deployment
node tests/check-deployment-status.js

# Re-run specific test
./tests/run-renewable-e2e-tests.sh terrain
```

### Need Help
1. Check **[EXECUTE_TESTS_NOW.md](./EXECUTE_TESTS_NOW.md)** troubleshooting section
2. Review **[COMMANDS_CHEAT_SHEET.md](./COMMANDS_CHEAT_SHEET.md)** diagnostic commands
3. Check CloudWatch logs
4. Review error messages

---

## 📊 Success Criteria

### Must Pass ✅
- [ ] Sandbox is running
- [ ] Deployment check passes
- [ ] Terrain shows 150+ features
- [ ] Layout displays turbines
- [ ] No visualization errors
- [ ] No infinite loading

### Should Pass ✅
- [ ] Wind rose is interactive
- [ ] Wake simulation completes
- [ ] Report generates successfully
- [ ] Project data persists
- [ ] Performance within targets

---

## ⏱️ Time Estimates

| Activity | Time |
|----------|------|
| Start sandbox | 5-10 min |
| Verify deployment | 2 min |
| Run smoke test | 5 min |
| Review results | 2 min |
| **Total** | **15-20 min** |

---

## 🎯 Next Steps After Testing

### If All Tests Pass 🎉
1. ✅ Document success
2. ✅ Take screenshots
3. ✅ Note performance metrics
4. ✅ Move to production testing
5. ✅ Celebrate! 🎊

### If Some Tests Fail ⚠️
1. ⚠️ Note which tests failed
2. ⚠️ Check CloudWatch logs
3. ⚠️ Review error messages
4. ⚠️ Fix issues
5. ⚠️ Re-test

### If All Tests Fail ❌
1. ❌ Verify sandbox is fully deployed
2. ❌ Check environment variables
3. ❌ Review deployment logs
4. ❌ Check AWS credentials
5. ❌ Contact support

---

## 📞 Quick Help

| Need | Document |
|------|----------|
| Step-by-step guide | [EXECUTE_TESTS_NOW.md](./EXECUTE_TESTS_NOW.md) |
| Checklist | [TEST_EXECUTION_CHECKLIST.md](./TEST_EXECUTION_CHECKLIST.md) |
| Commands | [COMMANDS_CHEAT_SHEET.md](./COMMANDS_CHEAT_SHEET.md) |
| Test prompts | [RENEWABLE_TEST_CHEAT_SHEET.md](./RENEWABLE_TEST_CHEAT_SHEET.md) |
| Full index | [RENEWABLE_TESTING_INDEX.md](./RENEWABLE_TESTING_INDEX.md) |

---

## 🚀 Ready? Let's Go!

### Open Two Terminals

**Terminal 1:**
```bash
npx ampx sandbox
```

**Terminal 2 (after sandbox deploys):**
```bash
node tests/check-deployment-status.js
./tests/run-renewable-e2e-tests.sh smoke
```

---

## 📝 Remember

- ✅ Keep sandbox terminal open
- ✅ Wait for "Deployed" message
- ✅ Run tests in second terminal
- ✅ Check results carefully
- ✅ Document any issues

---

**You've got this!** 🚀

**Questions?** Check [EXECUTE_TESTS_NOW.md](./EXECUTE_TESTS_NOW.md) for detailed help.

**Happy Testing!** 🎉
