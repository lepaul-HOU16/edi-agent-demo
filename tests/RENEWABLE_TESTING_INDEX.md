# Renewable Energy Testing Documentation Index

## 📚 Complete Testing Documentation Suite

This directory contains comprehensive testing documentation for the Renewable Energy workflow, including all features from the project persistence spec.

---

## 🎯 Quick Start

**New to testing?** Start here:

1. Read: [`RENEWABLE_TESTING_SUMMARY.md`](#renewable_testing_summarymd) (5 min)
2. Use: [`RENEWABLE_TEST_CHEAT_SHEET.md`](#renewable_test_cheat_sheetmd) (2 min)
3. Run: 5-minute smoke test from cheat sheet
4. If pass → celebrate! 🎉
5. If fail → check troubleshooting section

---

## 📖 Documentation Files

### 1. RENEWABLE_TESTING_SUMMARY.md
**Purpose:** Overview of all testing documentation  
**Use When:** First time testing, need overview  
**Time:** 5-10 minutes  
**Content:**
- Documentation overview
- Quick start options
- Test categories
- Success criteria
- Troubleshooting guide

[View File →](./RENEWABLE_TESTING_SUMMARY.md)

---

### 2. RENEWABLE_E2E_TEST_PROMPTS.md
**Purpose:** Comprehensive test prompt library  
**Use When:** Thorough testing, validation, QA  
**Time:** 30-60 minutes for full suite  
**Content:**
- 13 test categories
- 50+ specific test prompts
- Expected outcomes for each
- Pass/fail criteria
- Regression tests

**Test Categories:**
1. Basic Terrain Analysis
2. Layout Optimization
3. Wind Rose Analysis
4. Wake Simulation
5. Report Generation
6. Project Persistence
7. Project Context & Auto-Loading
8. Project Listing & Status
9. Action Buttons & Next Steps
10. Dashboard Consolidation
11. Chain of Thought Display
12. Error Handling & Edge Cases
13. Multi-Project Workflows

[View File →](./RENEWABLE_E2E_TEST_PROMPTS.md)

---

### 3. RENEWABLE_QUICK_TEST_GUIDE.md
**Purpose:** Fast validation and smoke testing  
**Use When:** Daily checks, pre-deployment, quick validation  
**Time:** 5-15 minutes  
**Content:**
- 5-minute smoke test
- Feature-specific quick tests
- One-liner test prompts
- Performance benchmarks
- Pass/fail criteria
- Test results template

**Quick Tests:**
- Smoke Test (5 min)
- Terrain Analysis (30 sec)
- Layout Optimization (30 sec)
- Wind Rose (30 sec)
- Wake Simulation (30 sec)
- Report Generation (30 sec)
- Project Persistence (2 min)
- Action Buttons (1 min)
- Error Handling (1 min)

[View File →](./RENEWABLE_QUICK_TEST_GUIDE.md)

---

### 4. RENEWABLE_TEST_CHEAT_SHEET.md
**Purpose:** Ultra-quick reference card  
**Use When:** Need copy-paste prompts, quick checks  
**Time:** 1-2 minutes  
**Content:**
- Copy-paste test prompts
- Quick validation checklist
- Critical regression checks
- Expected results
- Quick troubleshooting
- Test log template

**Perfect for:**
- Copy-pasting test prompts
- Quick validation
- Daily smoke tests
- Pre-commit checks

[View File →](./RENEWABLE_TEST_CHEAT_SHEET.md)

---

### 5. RENEWABLE_WORKFLOW_DIAGRAM.md
**Purpose:** Visual workflow reference  
**Use When:** Understanding workflow, training, documentation  
**Time:** 5 minutes  
**Content:**
- Complete workflow diagram
- Alternative workflows
- Data flow diagrams
- Project data structure
- Session context structure
- Dashboard layouts
- Chain of thought steps

**Visual Guides:**
- Step-by-step workflow
- Data flow architecture
- Action button flow
- Dashboard layouts
- Quick reference commands

[View File →](./RENEWABLE_WORKFLOW_DIAGRAM.md)

---

### 6. run-renewable-e2e-tests.sh
**Purpose:** Automated test execution  
**Use When:** CI/CD, automated validation, batch testing  
**Time:** 10-20 minutes (automated)  
**Content:**
- Pre-flight checks
- Automated test runners
- Test categories
- Result reporting
- Error handling

**Usage:**
```bash
# Run all tests
./tests/run-renewable-e2e-tests.sh all

# Run smoke test
./tests/run-renewable-e2e-tests.sh smoke

# Run specific category
./tests/run-renewable-e2e-tests.sh terrain
```

**Test Categories:**
- `all` - All tests
- `smoke` - 5-minute smoke test
- `terrain` - Terrain analysis tests
- `layout` - Layout optimization tests
- `windrose` - Wind rose tests
- `wake` - Wake simulation tests
- `report` - Report generation tests
- `persistence` - Project persistence tests
- `actions` - Action button tests
- `dashboards` - Dashboard tests
- `errors` - Error handling tests

[View File →](./run-renewable-e2e-tests.sh)

---

## 🎯 Testing Workflows

### Workflow 1: First-Time Testing
```
1. Read RENEWABLE_TESTING_SUMMARY.md (5 min)
2. Open RENEWABLE_TEST_CHEAT_SHEET.md
3. Copy-paste 5-minute smoke test
4. Run in chat interface
5. Verify all 5 prompts pass
6. If pass → done! 🎉
7. If fail → check troubleshooting
```

### Workflow 2: Daily Validation
```
1. Open RENEWABLE_QUICK_TEST_GUIDE.md
2. Run 5-minute smoke test
3. Check critical regression tests
4. Document results
5. Done in 10 minutes
```

### Workflow 3: Comprehensive Testing
```
1. Open RENEWABLE_E2E_TEST_PROMPTS.md
2. Work through each category
3. Document results for each test
4. Verify all expected outcomes
5. Complete in 30-60 minutes
```

### Workflow 4: Automated Testing
```
1. Run: ./tests/run-renewable-e2e-tests.sh all
2. Review output
3. Check failed tests
4. Fix issues
5. Re-run
```

### Workflow 5: Pre-Deployment
```
1. Run automated smoke test
2. Run critical regression tests
3. Manual UI validation
4. Check CloudWatch logs
5. Verify performance benchmarks
6. Deploy if all pass
```

---

## 📊 Test Coverage Matrix

| Feature | Cheat Sheet | Quick Guide | E2E Prompts | Automated | Manual |
|---------|-------------|-------------|-------------|-----------|--------|
| Terrain Analysis | ✅ | ✅ | ✅ | ✅ | ✅ |
| Layout Optimization | ✅ | ✅ | ✅ | ✅ | ✅ |
| Wind Rose | ✅ | ✅ | ✅ | ✅ | ✅ |
| Wake Simulation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Report Generation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Project Persistence | ✅ | ✅ | ✅ | ✅ | ✅ |
| Session Context | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Project Listing | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Action Buttons | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboards | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |
| Chain of Thought | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |
| Error Handling | ✅ | ✅ | ✅ | ✅ | ✅ |

Legend: ✅ Full Coverage | ⚠️ Partial Coverage | ❌ No Coverage

---

## 🚀 Recommended Testing Strategy

### For Developers (Daily)
1. Use **Cheat Sheet** for quick smoke test
2. Run **Automated Script** before commits
3. Check **Quick Guide** for specific features
4. Time: 10-15 minutes

### For QA (Weekly)
1. Use **E2E Prompts** for comprehensive testing
2. Run **Automated Script** for all categories
3. Document results in test log
4. Time: 1-2 hours

### For Releases (Pre-Deployment)
1. Run **Automated Script** (all tests)
2. Manual validation with **E2E Prompts**
3. Performance benchmarking
4. CloudWatch log review
5. User acceptance testing
6. Time: 2-3 hours

### For New Team Members (Onboarding)
1. Read **Testing Summary**
2. Review **Workflow Diagram**
3. Run **5-minute smoke test**
4. Practice with **Quick Guide**
5. Graduate to **E2E Prompts**
6. Time: 1-2 hours

---

## ✅ Success Criteria

### Must Pass (Critical)
- [ ] 5-minute smoke test passes
- [ ] Terrain shows 151 features
- [ ] Layout displays turbines
- [ ] No "Visualization Unavailable"
- [ ] No infinite loading
- [ ] Project data persists
- [ ] Action buttons work
- [ ] Errors are user-friendly

### Should Pass (Important)
- [ ] All E2E prompts pass
- [ ] Performance within benchmarks
- [ ] Dashboards render correctly
- [ ] Chain of thought displays
- [ ] Multi-project workflows work

### Nice to Have (Enhancement)
- [ ] Export functionality works
- [ ] Advanced features tested
- [ ] Edge cases handled
- [ ] Performance optimized

---

## 🔧 Troubleshooting Guide

### Where to Look

| Issue | Check | Document |
|-------|-------|----------|
| Test fails | Cheat Sheet troubleshooting | RENEWABLE_TEST_CHEAT_SHEET.md |
| Don't know what to test | Quick start guide | RENEWABLE_TESTING_SUMMARY.md |
| Need specific prompt | Test categories | RENEWABLE_E2E_TEST_PROMPTS.md |
| Automated test fails | Script output | run-renewable-e2e-tests.sh |
| Workflow unclear | Visual diagrams | RENEWABLE_WORKFLOW_DIAGRAM.md |
| Performance issues | Benchmarks | RENEWABLE_QUICK_TEST_GUIDE.md |

### Common Issues

1. **"Visualization Unavailable"**
   - Check: S3 permissions
   - Document: RENEWABLE_TEST_CHEAT_SHEET.md

2. **Infinite Loading**
   - Check: CloudWatch logs
   - Document: RENEWABLE_QUICK_TEST_GUIDE.md

3. **Wrong Feature Count**
   - Check: Terrain Lambda logs
   - Document: RENEWABLE_E2E_TEST_PROMPTS.md

4. **Missing Coordinates**
   - Check: Project data in S3
   - Document: RENEWABLE_WORKFLOW_DIAGRAM.md

---

## 📈 Performance Benchmarks

| Operation | Target | Max | Document |
|-----------|--------|-----|----------|
| Terrain | 5s | 10s | RENEWABLE_QUICK_TEST_GUIDE.md |
| Layout | 5s | 10s | RENEWABLE_QUICK_TEST_GUIDE.md |
| Wind Rose | 3s | 8s | RENEWABLE_QUICK_TEST_GUIDE.md |
| Wake | 8s | 15s | RENEWABLE_QUICK_TEST_GUIDE.md |
| Report | 10s | 20s | RENEWABLE_QUICK_TEST_GUIDE.md |

---

## 📝 Test Documentation

### Test Results Template
```
Date: ___________
Tester: ___________
Environment: [ ] Local [ ] Production

Smoke Test:          [ ] PASS [ ] FAIL
Terrain (151):       [ ] PASS [ ] FAIL
Layout Display:      [ ] PASS [ ] FAIL
Wind Rose:           [ ] PASS [ ] FAIL
Wake Simulation:     [ ] PASS [ ] FAIL
Report:              [ ] PASS [ ] FAIL
Project Persist:     [ ] PASS [ ] FAIL
Action Buttons:      [ ] PASS [ ] FAIL

Overall:             [ ] PASS [ ] FAIL

Notes:
_________________________________________________
```

---

## 🎓 Best Practices

1. **Start Simple** - Begin with smoke test
2. **Test Incrementally** - One feature at a time
3. **Document Results** - Use test log template
4. **Check Logs** - Always verify CloudWatch
5. **Test Both Sessions** - Same and new session
6. **Verify Regressions** - Run critical checks
7. **No Assumptions** - Verify everything
8. **One Failure = Stop** - Fix before proceeding

---

## 📞 Support

### Need Help?

1. **Quick Question** → Check Cheat Sheet
2. **Specific Test** → Check E2E Prompts
3. **Workflow Question** → Check Workflow Diagram
4. **Troubleshooting** → Check Quick Guide
5. **General Overview** → Check Testing Summary

### Reporting Issues

Include:
1. Exact test prompt used
2. Expected outcome
3. Actual outcome
4. Browser console errors
5. CloudWatch logs
6. Steps to reproduce

---

## 🚀 Ready to Test!

### Quick Start Commands

```bash
# 1. Start sandbox
npx ampx sandbox

# 2. Run automated smoke test
./tests/run-renewable-e2e-tests.sh smoke

# 3. Or manual smoke test (copy-paste in chat):
Analyze terrain at 35.067482, -101.395466
Optimize layout
Generate wind rose
Run wake simulation
Generate report
```

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial documentation suite |

---

## 📚 Related Documentation

- **Spec:** `.kiro/specs/renewable-project-persistence/`
- **Design:** `.kiro/specs/complete-renewable-features/design.md`
- **Tasks:** `.kiro/specs/renewable-project-persistence/tasks.md`
- **Code:** `amplify/functions/renewableOrchestrator/`

---

**Documentation Suite Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Complete and Ready for Use  
**Maintainer:** Development Team

---

## 🎯 Next Steps

1. ✅ Read this index (you're here!)
2. ⬜ Choose your testing workflow
3. ⬜ Run your first test
4. ⬜ Document results
5. ⬜ Celebrate success! 🎉

**Remember:** Quality over speed. One failure = stop and fix.

Happy Testing! 🚀
