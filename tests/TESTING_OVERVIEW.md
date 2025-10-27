# Renewable Energy Testing - Complete Overview

## 📊 Testing Documentation Structure

```
tests/
│
├── 🚀 START_HERE.md                          ← YOU ARE HERE
│   └── Quick start guide (5 min)
│
├── 📋 Execution Guides
│   ├── EXECUTE_TESTS_NOW.md                  ← Step-by-step instructions
│   ├── TEST_EXECUTION_CHECKLIST.md           ← Printable checklist
│   └── COMMANDS_CHEAT_SHEET.md               ← Copy-paste commands
│
├── 📚 Reference Documentation
│   ├── RENEWABLE_TESTING_INDEX.md            ← Complete index
│   ├── RENEWABLE_TESTING_SUMMARY.md          ← Overview
│   ├── RENEWABLE_TEST_CHEAT_SHEET.md         ← Quick prompts
│   ├── RENEWABLE_QUICK_TEST_GUIDE.md         ← Fast validation
│   ├── RENEWABLE_E2E_TEST_PROMPTS.md         ← All test scenarios
│   └── RENEWABLE_WORKFLOW_DIAGRAM.md         ← Visual workflow
│
└── 🔧 Test Scripts
    ├── run-renewable-e2e-tests.sh            ← Automated runner
    ├── check-deployment-status.js            ← Deployment check
    └── test-renewable-dashboards-e2e.js      ← Backend tests
```

---

## 🎯 Quick Decision Tree

```
Do you need to test?
│
├─ YES, but I'm in a hurry (5 min)
│  └─→ Open: START_HERE.md
│     └─→ Run: 3 commands
│        └─→ Done!
│
├─ YES, I want a checklist (10 min)
│  └─→ Open: TEST_EXECUTION_CHECKLIST.md
│     └─→ Check off items
│        └─→ Document results
│
├─ YES, I need commands only (2 min)
│  └─→ Open: COMMANDS_CHEAT_SHEET.md
│     └─→ Copy-paste
│        └─→ Run
│
├─ YES, I want detailed steps (15 min)
│  └─→ Open: EXECUTE_TESTS_NOW.md
│     └─→ Follow all steps
│        └─→ Verify everything
│
└─ YES, I want comprehensive testing (60 min)
   └─→ Open: RENEWABLE_TESTING_INDEX.md
      └─→ Read all documentation
         └─→ Run all test categories
            └─→ Full validation
```

---

## 📈 Testing Levels

### Level 1: Smoke Test (5 minutes)
**Purpose:** Quick validation that core features work  
**Use:** Daily checks, pre-commit  
**Command:** `./tests/run-renewable-e2e-tests.sh smoke`  
**Tests:** 5 core features  
**Pass Criteria:** All 5 pass

### Level 2: Category Tests (15 minutes)
**Purpose:** Test specific feature areas  
**Use:** Feature development, bug fixes  
**Command:** `./tests/run-renewable-e2e-tests.sh [category]`  
**Tests:** 5-10 per category  
**Pass Criteria:** All category tests pass

### Level 3: Full Suite (30 minutes)
**Purpose:** Comprehensive validation  
**Use:** Pre-deployment, releases  
**Command:** `./tests/run-renewable-e2e-tests.sh all`  
**Tests:** 50+ scenarios  
**Pass Criteria:** 95%+ pass rate

### Level 4: Manual UI (10 minutes)
**Purpose:** User experience validation  
**Use:** UI changes, visual verification  
**Method:** Manual testing in browser  
**Tests:** 5 key workflows  
**Pass Criteria:** All visualizations render correctly

---

## 🔄 Testing Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1. START SANDBOX                                        │
│    npx ampx sandbox                                     │
│    ⏱️  5-10 minutes                                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. VERIFY DEPLOYMENT                                    │
│    node tests/check-deployment-status.js                │
│    ⏱️  2 minutes                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. RUN SMOKE TEST                                       │
│    ./tests/run-renewable-e2e-tests.sh smoke             │
│    ⏱️  5 minutes                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. CHECK RESULTS                                        │
│    ✅ All pass → Done!                                  │
│    ⚠️  Some fail → Debug                                │
│    ❌ All fail → Check deployment                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Test Coverage

### What Gets Tested

| Feature | Automated | Manual UI | Coverage |
|---------|-----------|-----------|----------|
| Terrain Analysis | ✅ | ✅ | 100% |
| Layout Optimization | ✅ | ✅ | 100% |
| Wind Rose | ✅ | ✅ | 100% |
| Wake Simulation | ✅ | ✅ | 100% |
| Report Generation | ✅ | ✅ | 100% |
| Project Persistence | ✅ | ✅ | 100% |
| Action Buttons | ✅ | ✅ | 100% |
| Dashboards | ⚠️ | ✅ | 80% |
| Error Handling | ✅ | ✅ | 100% |
| Performance | ✅ | ⚠️ | 90% |

---

## 🎯 Success Metrics

### Critical (Must Pass)
- ✅ Terrain shows 150+ features
- ✅ Layout displays turbines
- ✅ No "Visualization Unavailable"
- ✅ No infinite loading
- ✅ Project data persists

### Important (Should Pass)
- ✅ Wind rose is interactive
- ✅ Wake simulation completes
- ✅ Report generates successfully
- ✅ Performance within targets
- ✅ Action buttons work

### Nice to Have
- ✅ Export functionality
- ✅ Advanced features
- ✅ Edge cases handled
- ✅ Optimal performance

---

## ⏱️ Time Investment

### First Time Setup
- Read documentation: 15 min
- Start sandbox: 10 min
- Run first test: 5 min
- **Total: 30 min**

### Daily Testing
- Start sandbox: 10 min (if not running)
- Run smoke test: 5 min
- Review results: 2 min
- **Total: 17 min**

### Pre-Deployment
- Run all tests: 30 min
- Manual UI check: 10 min
- Review logs: 5 min
- **Total: 45 min**

---

## 🚀 Quick Start Commands

### Absolute Minimum (3 commands)
```bash
npx ampx sandbox                              # Terminal 1
node tests/check-deployment-status.js         # Terminal 2
./tests/run-renewable-e2e-tests.sh smoke      # Terminal 2
```

### Recommended (5 commands)
```bash
npx ampx sandbox                              # Terminal 1
node tests/check-deployment-status.js         # Terminal 2
./tests/run-renewable-e2e-tests.sh smoke      # Terminal 2
aws logs tail /aws/lambda/[FUNCTION] --follow # Terminal 3
# Manual UI test in browser
```

### Comprehensive (10+ commands)
```bash
npx ampx sandbox
node tests/check-deployment-status.js
./tests/run-renewable-e2e-tests.sh all
aws logs tail /aws/lambda/[ORCHESTRATOR] --follow
aws logs tail /aws/lambda/[SIMULATION] --follow
aws s3 ls s3://[BUCKET]/renewable/
# Manual UI test all features
# Performance monitoring
# CloudWatch metrics review
# Documentation update
```

---

## 📚 Documentation Quick Reference

| Document | Purpose | Time | When to Use |
|----------|---------|------|-------------|
| START_HERE.md | Quick start | 5 min | First time |
| EXECUTE_TESTS_NOW.md | Detailed guide | 15 min | Need steps |
| TEST_EXECUTION_CHECKLIST.md | Checklist | 10 min | Want structure |
| COMMANDS_CHEAT_SHEET.md | Commands | 2 min | Need commands |
| RENEWABLE_TEST_CHEAT_SHEET.md | Test prompts | 2 min | Need prompts |
| RENEWABLE_QUICK_TEST_GUIDE.md | Fast tests | 15 min | Daily checks |
| RENEWABLE_E2E_TEST_PROMPTS.md | All tests | 60 min | Comprehensive |
| RENEWABLE_TESTING_INDEX.md | Index | 5 min | Find docs |
| RENEWABLE_WORKFLOW_DIAGRAM.md | Visual | 5 min | Understand flow |

---

## 🎓 Best Practices

### DO ✅
- Start with smoke test
- Keep sandbox running
- Check deployment status first
- Document results
- Review CloudWatch logs
- Test incrementally
- Verify regressions

### DON'T ❌
- Skip deployment check
- Run tests without sandbox
- Ignore failed tests
- Test everything at once
- Assume it works
- Skip documentation
- Forget to check logs

---

## 🔧 Troubleshooting Quick Links

| Issue | Check | Document |
|-------|-------|----------|
| Sandbox won't start | Process conflicts | EXECUTE_TESTS_NOW.md |
| Tests fail | CloudWatch logs | COMMANDS_CHEAT_SHEET.md |
| Deployment issues | Lambda status | EXECUTE_TESTS_NOW.md |
| UI errors | Browser console | TEST_EXECUTION_CHECKLIST.md |
| Performance slow | Metrics | RENEWABLE_QUICK_TEST_GUIDE.md |
| Don't know what to test | Test categories | RENEWABLE_E2E_TEST_PROMPTS.md |

---

## 📞 Get Help

### Quick Questions
→ Check **COMMANDS_CHEAT_SHEET.md**

### Need Test Prompts
→ Check **RENEWABLE_TEST_CHEAT_SHEET.md**

### Need Step-by-Step
→ Check **EXECUTE_TESTS_NOW.md**

### Need Everything
→ Check **RENEWABLE_TESTING_INDEX.md**

---

## 🎯 Your Next Step

**Choose ONE:**

1. **I want to test NOW** → Open [START_HERE.md](./START_HERE.md)
2. **I want a checklist** → Open [TEST_EXECUTION_CHECKLIST.md](./TEST_EXECUTION_CHECKLIST.md)
3. **I want commands** → Open [COMMANDS_CHEAT_SHEET.md](./COMMANDS_CHEAT_SHEET.md)
4. **I want to understand** → Open [RENEWABLE_TESTING_INDEX.md](./RENEWABLE_TESTING_INDEX.md)

---

**Ready to test?** Pick your path above! 🚀

**Questions?** All answers are in the documentation! 📚

**Happy Testing!** 🎉
