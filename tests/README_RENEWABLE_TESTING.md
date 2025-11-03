# Renewable Energy Testing Documentation

## 🚀 Start Here!

Welcome to the Renewable Energy testing documentation. This suite provides everything you need to test the complete renewable energy workflow.

---

## 📖 Main Index

**👉 [RENEWABLE_TESTING_INDEX.md](./RENEWABLE_TESTING_INDEX.md) 👈**

Start with the index above - it provides a complete overview of all testing documentation and guides you to the right document for your needs.

---

## ⚡ Quick Access

### For Quick Testing (5 minutes)
- **[Cheat Sheet](./RENEWABLE_TEST_CHEAT_SHEET.md)** - Copy-paste test prompts

### For Daily Validation (10-15 minutes)
- **[Quick Test Guide](./RENEWABLE_QUICK_TEST_GUIDE.md)** - Fast validation tests

### For Comprehensive Testing (30-60 minutes)
- **[E2E Test Prompts](./RENEWABLE_E2E_TEST_PROMPTS.md)** - Complete test library

### For Automated Testing
- **[Test Runner Script](./run-renewable-e2e-tests.sh)** - Automated execution

### For Understanding Workflow
- **[Workflow Diagram](./RENEWABLE_WORKFLOW_DIAGRAM.md)** - Visual reference

### For Overview
- **[Testing Summary](./RENEWABLE_TESTING_SUMMARY.md)** - Complete overview

---

## 🎯 5-Minute Smoke Test

Copy-paste these 5 prompts in the chat interface:

```
1. Analyze terrain at 35.067482, -101.395466
2. Optimize layout
3. Generate wind rose
4. Run wake simulation
5. Generate report
```

**Pass Criteria:** All 5 complete with artifacts displayed, no errors.

---

## 📚 Documentation Files

| File | Purpose | Time | Use When |
|------|---------|------|----------|
| [RENEWABLE_TESTING_INDEX.md](./RENEWABLE_TESTING_INDEX.md) | Complete index | 5 min | First time, need overview |
| [RENEWABLE_TESTING_SUMMARY.md](./RENEWABLE_TESTING_SUMMARY.md) | Overview & guide | 10 min | Understanding scope |
| [RENEWABLE_E2E_TEST_PROMPTS.md](./RENEWABLE_E2E_TEST_PROMPTS.md) | Complete test library | 60 min | Thorough testing |
| [RENEWABLE_QUICK_TEST_GUIDE.md](./RENEWABLE_QUICK_TEST_GUIDE.md) | Fast validation | 15 min | Daily checks |
| [RENEWABLE_TEST_CHEAT_SHEET.md](./RENEWABLE_TEST_CHEAT_SHEET.md) | Quick reference | 2 min | Copy-paste prompts |
| [RENEWABLE_WORKFLOW_DIAGRAM.md](./RENEWABLE_WORKFLOW_DIAGRAM.md) | Visual guide | 5 min | Understanding flow |
| [run-renewable-e2e-tests.sh](./run-renewable-e2e-tests.sh) | Automated runner | 20 min | CI/CD, automation |

---

## 🎯 Choose Your Path

### Path 1: I'm New Here
1. Read [RENEWABLE_TESTING_INDEX.md](./RENEWABLE_TESTING_INDEX.md)
2. Review [RENEWABLE_WORKFLOW_DIAGRAM.md](./RENEWABLE_WORKFLOW_DIAGRAM.md)
3. Run 5-minute smoke test from [RENEWABLE_TEST_CHEAT_SHEET.md](./RENEWABLE_TEST_CHEAT_SHEET.md)

### Path 2: I Need Quick Validation
1. Open [RENEWABLE_QUICK_TEST_GUIDE.md](./RENEWABLE_QUICK_TEST_GUIDE.md)
2. Run 5-minute smoke test
3. Check critical regression tests

### Path 3: I Need Comprehensive Testing
1. Open [RENEWABLE_E2E_TEST_PROMPTS.md](./RENEWABLE_E2E_TEST_PROMPTS.md)
2. Work through each category
3. Document results

### Path 4: I Want Automation
1. Run `./tests/run-renewable-e2e-tests.sh smoke`
2. Review output
3. Fix any failures

---

## ✅ What Gets Tested

### Core Features
- ✅ Terrain Analysis (151 features, OSM data)
- ✅ Layout Optimization (turbine placement)
- ✅ Wind Rose Analysis (Plotly charts)
- ✅ Wake Simulation (heat maps, AEP)
- ✅ Report Generation (comprehensive reports)

### Project Persistence
- ✅ Project name generation
- ✅ Project data save/load
- ✅ Session context management
- ✅ Project listing
- ✅ Project details

### User Experience
- ✅ Action buttons
- ✅ Dashboard consolidation
- ✅ Chain of thought display
- ✅ Error handling

### Reliability
- ✅ No regressions
- ✅ Data persistence
- ✅ Performance benchmarks
- ✅ Edge cases

---

## 🚨 Critical Checks

These MUST pass every time:

1. **Feature Count:** Terrain shows 151 features (not 60)
2. **Layout Display:** Turbines show on map (not blank)
3. **Project Persistence:** Data survives page refresh
4. **No Viz Unavailable:** All visualizations render
5. **No Infinite Loading:** Loading states dismiss

---

## 🔧 Quick Troubleshooting

| Issue | Solution | Document |
|-------|----------|----------|
| Test fails | Check cheat sheet troubleshooting | [Cheat Sheet](./RENEWABLE_TEST_CHEAT_SHEET.md) |
| Don't know what to test | Read testing summary | [Summary](./RENEWABLE_TESTING_SUMMARY.md) |
| Need specific prompt | Check E2E prompts | [E2E Prompts](./RENEWABLE_E2E_TEST_PROMPTS.md) |
| Workflow unclear | Review workflow diagram | [Workflow](./RENEWABLE_WORKFLOW_DIAGRAM.md) |

---

## 📈 Performance Targets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Terrain Analysis | < 5s | 10s |
| Layout Optimization | < 5s | 10s |
| Wind Rose | < 3s | 8s |
| Wake Simulation | < 8s | 15s |
| Report Generation | < 10s | 20s |

---

## 🎓 Best Practices

1. **Start Simple** - Run smoke test first
2. **Test Incrementally** - One feature at a time
3. **Check Logs** - Always verify CloudWatch
4. **Document Results** - Use test log templates
5. **No Assumptions** - Verify everything works
6. **One Failure = Stop** - Fix before proceeding

---

## 📞 Need Help?

1. **Quick Question** → [Cheat Sheet](./RENEWABLE_TEST_CHEAT_SHEET.md)
2. **Specific Test** → [E2E Prompts](./RENEWABLE_E2E_TEST_PROMPTS.md)
3. **Workflow Question** → [Workflow Diagram](./RENEWABLE_WORKFLOW_DIAGRAM.md)
4. **General Overview** → [Testing Summary](./RENEWABLE_TESTING_SUMMARY.md)
5. **Everything** → [Testing Index](./RENEWABLE_TESTING_INDEX.md)

---

## 🚀 Ready to Test!

### Quick Start

```bash
# 1. Start sandbox
npx ampx sandbox

# 2. Run automated smoke test
./tests/run-renewable-e2e-tests.sh smoke

# 3. Or open chat and paste:
Analyze terrain at 35.067482, -101.395466
Optimize layout
Generate wind rose
Run wake simulation
Generate report
```

---

## 📚 Related Documentation

- **Spec:** `.kiro/specs/renewable-project-persistence/`
- **Design:** `.kiro/specs/complete-renewable-features/design.md`
- **Code:** `amplify/functions/renewableOrchestrator/`

---

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Ready for Use

**Happy Testing! 🎉**
