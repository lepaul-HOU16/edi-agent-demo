# Task 6: Manual Testing - Quick Start Guide

## ✅ Task 6 is Ready for Validation!

All test infrastructure has been created. You can now validate the terrain query routing fix.

## Quick Start (30 seconds)

```bash
# Run all tests automatically
./tests/manual/run-task-6-tests.sh
```

That's it! The script will:
- ✅ Check sandbox is running
- ✅ Find orchestrator Lambda
- ✅ Run all test scenarios
- ✅ Verify CloudWatch logs
- ✅ Report pass/fail results

## What Gets Tested

### Task 6.1: Problematic Query ✅
**Query:** "Analyze terrain at coordinates 35.067482, -101.395466 in Texas"
**Validates:** Routes to terrain analysis (NOT project list)

### Task 6.2: Project List Queries ✅
**Queries:** "list my renewable projects", "show my projects"
**Validates:** Routes to project list handler

### Task 6.3: No Regressions ✅
**Queries:** Terrain, layout, simulation, report, project details
**Validates:** All renewable queries still work correctly

## Expected Output

### ✅ All Tests Pass:
```
╔════════════════════════════════════════════════════════════════════════════╗
║                        ✅ ALL TESTS PASSED ✅                              ║
║  Ready for deployment! ✅                                                  ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### ❌ Tests Fail:
```
╔════════════════════════════════════════════════════════════════════════════╗
║                        ❌ TESTS FAILED ❌                                  ║
║  Action Required: Review failed test details                              ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## Manual Testing (Optional)

If you prefer to test manually in the UI:

1. Open chat interface
2. Select "Renewables Agent"
3. Submit: "Analyze terrain at coordinates 35.067482, -101.395466 in Texas"
4. Verify: Gets terrain analysis (NOT project list)

Full manual testing guide: `tests/manual/TERRAIN_ROUTING_MANUAL_TEST_GUIDE.md`

## Troubleshooting

### "Cannot connect to AWS Lambda"
**Solution:** Start sandbox: `npx ampx sandbox`

### "Orchestrator Lambda function not found"
**Solution:** Wait for sandbox to fully deploy (~5 minutes)

### Tests fail
**Solution:** Check CloudWatch logs and review test output

## Next Steps

After tests pass:
1. Mark Task 6 complete in tasks.md
2. Proceed to Task 7 (Deploy and monitor)
3. Monitor production for routing issues

## Documentation

- **Automated Tests:** `tests/manual/test-terrain-routing-manual.js`
- **Manual Guide:** `tests/manual/TERRAIN_ROUTING_MANUAL_TEST_GUIDE.md`
- **Complete Summary:** `tests/manual/TASK_6_COMPLETE_SUMMARY.md`

---

**Ready to test? Run:** `./tests/manual/run-task-6-tests.sh`
